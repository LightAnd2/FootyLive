from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.match import Match
from app.models.team import Team
from app.core.competitions import normalize_competition_code

router = APIRouter()


@router.get("/")
async def get_clean_sheets(
    competition: str = Query("PL"),
    db: Session = Depends(get_db),
):
    """Compute clean sheets for all teams from finished matches in the DB."""
    finished = (
        db.query(Match)
        .filter(
            Match.status == "full_time",
            Match.competition_code == normalize_competition_code(competition),
        )
        .all()
    )

    counts: dict[int, dict] = {}

    for m in finished:
        for team_id, goals_conceded in [
            (m.home_team_id, m.away_score),
            (m.away_team_id, m.home_score),
        ]:
            if team_id not in counts:
                counts[team_id] = {"clean_sheets": 0, "matches_played": 0}
            counts[team_id]["matches_played"] += 1
            if (goals_conceded or 0) == 0:
                counts[team_id]["clean_sheets"] += 1

    results = []
    for team_id, data in counts.items():
        team = db.query(Team).filter(Team.id == team_id).first()
        if team:
            results.append({
                "position": 0,
                "team": {
                    "id": team.id,
                    "name": team.name,
                    "tla": team.short_name,
                    "crest": team.logo,
                },
                "clean_sheets": data["clean_sheets"],
                "matches_played": data["matches_played"],
            })

    results.sort(key=lambda x: x["clean_sheets"], reverse=True)
    for i, r in enumerate(results):
        r["position"] = i + 1

    return {"clean_sheets": results}
