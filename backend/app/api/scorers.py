from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.services.football_data import football_data_service
from app.core.competitions import normalize_competition_code
from app.core.cache import cache_get, cache_set
from app.core.database import get_db
from app.models.season_archive import SeasonArchive

router = APIRouter(redirect_slashes=False)


async def fetch_scorers(code: str, limit: int = 20, use_cache: bool = True, season_year: Optional[int] = None) -> dict:
    """Top scorers for a competition, falling back to the previous season if the
    current one hasn't started yet.

    `season_year` pins an explicit football-data.org season (its start year) —
    used by the archive script for competitions whose season doesn't follow the
    Aug-May convention (e.g. Brasileirão runs a plain calendar year).
    """
    cache_key = f"scorers:{code}:{limit}" if season_year is None else f"scorers:{code}:{limit}:{season_year}"
    if use_cache:
        cached = await cache_get(cache_key)
        if cached:
            return cached

    params = {"limit": limit, **({"season": season_year} if season_year is not None else {})}
    data = await football_data_service._get(
        f"/competitions/{code}/scorers",
        params=params,
    )
    if not data:
        raise HTTPException(status_code=502, detail="Failed to fetch scorers")

    scorers = data.get("scorers", [])

    # Between seasons the current season has no scorers yet; fall back to the
    # most recent completed season so the Stats tab isn't empty all summer.
    # Skipped when a season_year was explicitly requested — that's already a pin.
    if not scorers and season_year is None:
        season_start = (data.get("season") or {}).get("startDate") or ""
        try:
            current_start_year = int(season_start[:4])
        except ValueError:
            current_start_year = datetime.now(timezone.utc).year
        previous = await football_data_service._get(
            f"/competitions/{code}/scorers",
            params={"limit": limit, "season": current_start_year - 1},
        )
        if previous and previous.get("scorers"):
            data = previous
            scorers = previous["scorers"]

    result = {
        "season": data.get("season", {}),
        "scorers": [
            {
                "position": i + 1,
                "player": {
                    "id": s["player"]["id"],
                    "name": s["player"]["name"],
                    "nationality": s["player"].get("nationality", ""),
                    "section": s["player"].get("section", ""),
                },
                "team": {
                    "id": s["team"]["id"],
                    "name": s["team"]["name"],
                    "tla": s["team"]["tla"],
                    "crest": s["team"]["crest"],
                },
                "goals": s.get("goals") or 0,
                "penalties": s.get("penalties") or 0,
                "playedMatches": s.get("playedMatches") or 0,
            }
            for i, s in enumerate(scorers)
        ],
    }
    if use_cache:
        await cache_set(cache_key, result, ttl=300)
    return result


@router.get("/")
async def get_top_scorers(
    limit: int = Query(20, ge=1, le=50),
    competition: str = Query("PL"),
    season: Optional[str] = Query(
        None,
        description="Archived season label (e.g. 2025-26). Omit for the live/current season.",
    ),
    db: Session = Depends(get_db),
):
    """Get top scorers for a competition."""
    code = normalize_competition_code(competition)

    if season:
        archive = db.query(SeasonArchive).filter(
            SeasonArchive.competition_code == code,
            SeasonArchive.season_label == season,
        ).first()
        if not archive or not archive.scorers:
            raise HTTPException(status_code=404, detail=f"No archived {season} scorers for {code}")
        return archive.scorers

    return await fetch_scorers(code, limit)
