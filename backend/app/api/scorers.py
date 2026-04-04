from fastapi import APIRouter, Query, HTTPException
from app.services.football_data import football_data_service
from app.core.competitions import normalize_competition_code

router = APIRouter()


@router.get("/")
async def get_top_scorers(
    limit: int = Query(20, ge=1, le=50),
    competition: str = Query("PL"),
):
    """Get top scorers with goals and assists for a competition."""
    code = normalize_competition_code(competition)
    data = await football_data_service._get(
        f"/competitions/{code}/scorers",
        params={"limit": limit},
    )
    if not data:
        raise HTTPException(status_code=502, detail="Failed to fetch scorers")

    scorers = data.get("scorers", [])
    return {
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
                "assists": s.get("assists") or 0,
                "penalties": s.get("penalties") or 0,
                "playedMatches": s.get("playedMatches") or 0,
            }
            for i, s in enumerate(scorers)
        ],
    }
