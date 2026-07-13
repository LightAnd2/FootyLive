from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Any, Dict, List, Optional

from app.services.football_data import football_data_service
from app.core.competitions import DEFAULT_COMPETITION_CODE, normalize_competition_code
from app.core.cache import cache_get, cache_set
from app.core.database import get_db
from app.models.season_archive import SeasonArchive

router = APIRouter(redirect_slashes=False)

KNOCKOUT_STAGES = [
    "KNOCKOUT_ROUND_PLAY_OFFS",
    "LAST_32",
    "LAST_16",
    "QUARTER_FINALS",
    "SEMI_FINALS",
    "THIRD_PLACE",
    "FINAL",
]

STAGE_LABELS = {
    "KNOCKOUT_ROUND_PLAY_OFFS": "Knockout Play-offs",
    "LAST_32": "Round of 32",
    "LAST_16": "Round of 16",
    "QUARTER_FINALS": "Quarter-finals",
    "SEMI_FINALS": "Semi-finals",
    "THIRD_PLACE": "Third Place Play-off",
    "FINAL": "Final",
}

def _fmt_team(t: dict) -> dict:
    return {
        "id": t.get("id"),
        "name": t.get("name", ""),
        "short_name": t.get("shortName", ""),
        "tla": t.get("tla", ""),
        "crest": t.get("crest", ""),
    }

def _fmt_match(m: dict) -> dict:
    score_data = m.get("score") or {}
    ft = score_data.get("fullTime") or {}
    penalties = score_data.get("penalties") or {}

    # The API folds a penalty shootout into `fullTime` (e.g. 1-1 + 4-3 pens => 5-4).
    # Strip it back out so the displayed score is the open-play result, and expose
    # the shootout score separately — same convention as the main match sync.
    home_score = ft.get("home")
    away_score = ft.get("away")
    penalty_home = penalties.get("home")
    penalty_away = penalties.get("away")
    if penalty_home is not None and penalty_away is not None and home_score is not None and away_score is not None:
        home_score -= penalty_home
        away_score -= penalty_away

    return {
        "id": m.get("id"),
        "date": m.get("utcDate", ""),
        "status": m.get("status", ""),
        "stage": m.get("stage", ""),
        "home_team": _fmt_team(m.get("homeTeam") or {}),
        "away_team": _fmt_team(m.get("awayTeam") or {}),
        "score": {
            "home": home_score,
            "away": away_score,
            "winner": score_data.get("winner"),
            "penalty_home": penalty_home,
            "penalty_away": penalty_away,
        },
    }


async def fetch_bracket(code: str, use_cache: bool = True) -> dict:
    """Knockout bracket (Champions League, World Cup, etc.) from football-data.org free tier."""
    cache_key = f"bracket:{code}"
    if use_cache:
        cached = await cache_get(cache_key)
        if cached:
            return cached

    data = await football_data_service._get(f"/competitions/{code}/matches")
    if not data:
        raise HTTPException(status_code=502, detail=f"Failed to fetch {code} matches")

    all_matches: List[dict] = data.get("matches", [])

    bracket: List[Dict[str, Any]] = []
    for stage_key in KNOCKOUT_STAGES:
        stage_matches = [m for m in all_matches if m.get("stage") == stage_key]
        if stage_matches:
            bracket.append({
                "stage": stage_key,
                "label": STAGE_LABELS.get(stage_key, stage_key.replace("_", " ").title()),
                "matches": [_fmt_match(m) for m in sorted(stage_matches, key=lambda x: x.get("utcDate", ""))],
            })

    result = {"bracket": bracket}
    if use_cache:
        await cache_set(cache_key, result, ttl=300)
    return result


@router.get("/bracket")
async def get_bracket(
    competition: str = Query(
        "CL",
        description="Competition code with a knockout stage, e.g. CL or WC",
    ),
    season: Optional[str] = Query(
        None,
        description="Archived season label (e.g. 2025-26). Omit for the live/current season.",
    ),
    db: Session = Depends(get_db),
):
    code = normalize_competition_code(competition)

    if season:
        archive = db.query(SeasonArchive).filter(
            SeasonArchive.competition_code == code,
            SeasonArchive.season_label == season,
        ).first()
        if not archive or not archive.bracket:
            raise HTTPException(status_code=404, detail=f"No archived {season} bracket for {code}")
        return archive.bracket

    return await fetch_bracket(code)



def _normalize_standings_payload(data: dict) -> Dict[str, Any]:
    """Split league table vs cup groups (e.g. Champions League)."""
    standings = data.get("standings", [])
    groups_out: List[Dict[str, Any]] = []
    main_table: List = []

    for s in standings:
        grp = s.get("group")
        table = s.get("table") or []
        if grp and table:
            label = str(grp).replace("_", " ")
            groups_out.append({"name": label, "table": table})
        elif s.get("type") == "TOTAL" and table:
            main_table = table

    if not main_table and standings and not groups_out:
        main_table = standings[0].get("table") or []

    # Some leagues (e.g. Brasileirão) label their single season table with a
    # group name like "Matchday"; that's a league table, not a cup group.
    if not main_table and len(groups_out) == 1:
        main_table = groups_out[0]["table"]
        groups_out = []

    return {
        "season": data.get("season", {}),
        "table": main_table,
        "groups": groups_out if groups_out else None,
    }


async def fetch_standings(code: str, use_cache: bool = True, season_year: Optional[int] = None) -> dict:
    """Standings for a competition (Premier League, Champions League, etc.).

    `season_year` pins an explicit football-data.org season (its start year) —
    used by the archive script for competitions whose season doesn't follow the
    Aug-May convention (e.g. Brasileirão runs a plain calendar year).
    """
    cache_key = f"standings:{code}" if season_year is None else f"standings:{code}:{season_year}"
    if use_cache:
        cached = await cache_get(cache_key)
        if cached:
            return cached

    params = {"season": season_year} if season_year is not None else None
    data = await football_data_service._get(f"/competitions/{code}/standings", params=params)
    if not data:
        raise HTTPException(status_code=502, detail="Failed to fetch standings")

    payload = _normalize_standings_payload(data)

    # Between seasons the API's "current" pointer rolls over to next season's
    # fixtures before a ball is kicked (every club sitting at 0 games) — fall back
    # to the most recently completed season, same convention as scorers below.
    # Skipped when a season_year was explicitly requested — that's already a pin.
    table = payload.get("table") or []
    if season_year is None and table and all((row.get("playedGames") or 0) == 0 for row in table):
        season_start = (data.get("season") or {}).get("startDate") or ""
        try:
            current_start_year = int(season_start[:4])
            previous_data = await football_data_service._get(
                f"/competitions/{code}/standings",
                params={"season": current_start_year - 1},
            )
            if previous_data:
                previous_payload = _normalize_standings_payload(previous_data)
                if previous_payload.get("table"):
                    payload = previous_payload
        except ValueError:
            pass

    payload["competition"] = {"code": code}
    if use_cache:
        await cache_set(cache_key, payload, ttl=300)
    return payload


@router.get("/")
async def get_standings(
    competition: str = Query(
        DEFAULT_COMPETITION_CODE,
        description="Competition code from football-data.org, e.g. PL or CL",
    ),
    season: Optional[str] = Query(
        None,
        description="Archived season label (e.g. 2025-26). Omit for the live/current season.",
    ),
    db: Session = Depends(get_db),
):
    code = normalize_competition_code(competition)

    if season:
        archive = db.query(SeasonArchive).filter(
            SeasonArchive.competition_code == code,
            SeasonArchive.season_label == season,
        ).first()
        if not archive or not archive.standings:
            raise HTTPException(status_code=404, detail=f"No archived {season} standings for {code}")
        return archive.standings

    return await fetch_standings(code)
