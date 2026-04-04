from fastapi import APIRouter, HTTPException, Query
from typing import Any, Dict, List, Optional

from app.services.football_data import football_data_service
from app.core.competitions import DEFAULT_COMPETITION_CODE, normalize_competition_code

router = APIRouter()

KNOCKOUT_STAGES = [
    "KNOCKOUT_ROUND_PLAY_OFFS",
    "LAST_16",
    "QUARTER_FINALS",
    "SEMI_FINALS",
    "FINAL",
]

STAGE_LABELS = {
    "KNOCKOUT_ROUND_PLAY_OFFS": "Knockout Play-offs",
    "LAST_16": "Round of 16",
    "QUARTER_FINALS": "Quarter-finals",
    "SEMI_FINALS": "Semi-finals",
    "FINAL": "Final",
}

def _fmt_team(t: dict) -> dict:
    return {
        "id": t.get("id"),
        "name": t.get("name", ""),
        "tla": t.get("tla", ""),
        "crest": t.get("crest", ""),
    }

def _fmt_match(m: dict) -> dict:
    ft = (m.get("score") or {}).get("fullTime") or {}
    return {
        "id": m.get("id"),
        "date": m.get("utcDate", ""),
        "status": m.get("status", ""),
        "stage": m.get("stage", ""),
        "home_team": _fmt_team(m.get("homeTeam") or {}),
        "away_team": _fmt_team(m.get("awayTeam") or {}),
        "score": {
            "home": ft.get("home"),
            "away": ft.get("away"),
            "winner": (m.get("score") or {}).get("winner"),
        },
    }


@router.get("/cl-bracket")
async def get_cl_bracket():
    """Champions League knockout bracket from football-data.org free tier."""
    data = await football_data_service._get("/competitions/CL/matches")
    if not data:
        raise HTTPException(status_code=502, detail="Failed to fetch CL matches")

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

    return {"bracket": bracket}



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

    # Avoid duplicating the first CL group as both "main" and group tables
    if not main_table and standings and not groups_out:
        main_table = standings[0].get("table") or []

    return {
        "season": data.get("season", {}),
        "table": main_table,
        "groups": groups_out if groups_out else None,
    }


@router.get("/")
async def get_standings(
    competition: str = Query(
        DEFAULT_COMPETITION_CODE,
        description="Competition code from football-data.org, e.g. PL or CL",
    ),
):
    """Standings for a competition (Premier League, Champions League, etc.)."""
    code = normalize_competition_code(competition)
    data = await football_data_service._get(f"/competitions/{code}/standings")
    if not data:
        raise HTTPException(status_code=502, detail="Failed to fetch standings")

    payload = _normalize_standings_payload(data)
    payload["competition"] = {"code": code}
    return payload
