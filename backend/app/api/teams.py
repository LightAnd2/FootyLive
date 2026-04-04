from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.team import Team
from app.schemas.team import Team as TeamSchema
from app.services.team_service import TeamService
from app.core.config import settings
from app.core.competitions import normalize_competition_code
import httpx

router = APIRouter()


def _format_team_detail(team_data: dict) -> dict:
    coach = team_data.get("coach") or {}
    squad = team_data.get("squad") or []
    return {
        "club": {
            "id": team_data.get("id"),
            "name": team_data.get("name", ""),
            "short_name": team_data.get("shortName") or team_data.get("tla", ""),
            "crest": team_data.get("crest", ""),
            "founded": team_data.get("founded"),
            "venue": team_data.get("venue", ""),
            "website": team_data.get("website", ""),
            "address": team_data.get("address", ""),
            "club_colors": team_data.get("clubColors", ""),
        },
        "coach": {
            "name": coach.get("name", ""),
            "nationality": coach.get("nationality", ""),
            "date_of_birth": coach.get("dateOfBirth"),
        },
        "squad": [
            {
                "id": player.get("id"),
                "name": player.get("name", ""),
                "first_name": player.get("firstName"),
                "last_name": player.get("lastName"),
                "date_of_birth": player.get("dateOfBirth"),
                "nationality": player.get("nationality"),
                "position": player.get("position") or player.get("section"),
                "shirt_number": player.get("shirtNumber"),
            }
            for player in squad
        ],
    }


@router.get("/premier-league", response_model=List[TeamSchema])
async def get_premier_league_teams(db: Session = Depends(get_db)):
    team_service = TeamService(db)
    return await team_service.get_premier_league_teams()


@router.get("/", response_model=List[TeamSchema])
async def get_teams(
    search: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    competition: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    team_service = TeamService(db)
    return await team_service.get_teams(
        search=search,
        country=country,
        competition=normalize_competition_code(competition) if competition else None,
    )


@router.get("/{team_id}/history")
async def get_team_history(team_id: int, db: Session = Depends(get_db)):
    """Full match history for a team across all competitions (free tier)."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    ext_id = team.external_id
    headers = {"X-Auth-Token": settings.FOOTBALL_DATA_API_KEY}
    base = settings.FOOTBALL_DATA_BASE_URL

    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(f"{base}/teams/{ext_id}/matches",
                                 headers=headers, params={"status": "FINISHED", "limit": 30}, timeout=20.0)
            r.raise_for_status()
            finished = r.json().get("matches", [])
        except Exception:
            finished = []

        try:
            r2 = await client.get(f"{base}/teams/{ext_id}/matches",
                                  headers=headers, params={"status": "SCHEDULED,TIMED", "limit": 10}, timeout=20.0)
            r2.raise_for_status()
            upcoming = r2.json().get("matches", [])
        except Exception:
            upcoming = []

    # Compute clean sheets from finished matches
    clean_sheets = sum(
        1 for m in finished
        if m.get("score", {}).get("fullTime") and (
            (m.get("homeTeam", {}).get("id") == ext_id and (m["score"]["fullTime"].get("away") or 0) == 0) or
            (m.get("awayTeam", {}).get("id") == ext_id and (m["score"]["fullTime"].get("home") or 0) == 0)
        )
    )

    # W/D/L record from finished matches
    wins = draws = losses = 0
    goals_for = goals_against = 0
    for m in finished:
        ft = m.get("score", {}).get("fullTime") or {}
        home_id = m.get("homeTeam", {}).get("id")
        away_id = m.get("awayTeam", {}).get("id")
        if home_id == ext_id:
            gf, ga = ft.get("home") or 0, ft.get("away") or 0
        else:
            gf, ga = ft.get("away") or 0, ft.get("home") or 0
        goals_for += gf
        goals_against += ga
        winner = m.get("score", {}).get("winner")
        if winner == "HOME_TEAM" and home_id == ext_id:
            wins += 1
        elif winner == "AWAY_TEAM" and away_id == ext_id:
            wins += 1
        elif winner == "DRAW":
            draws += 1
        elif winner is not None:
            # HOME_TEAM won but this team is away, or AWAY_TEAM won but this team is home
            losses += 1
        # winner is None → match has no result yet (postponed/abandoned), skip

    def fmt(m: dict) -> dict:
        ft = m.get("score", {}).get("fullTime") or {}
        ht = m.get("score", {}).get("halfTime") or {}
        return {
            "id": m.get("id"),
            "competition": m.get("competition", {}).get("name", ""),
            "competition_emblem": m.get("competition", {}).get("emblem", ""),
            "date": m.get("utcDate", ""),
            "status": m.get("status", ""),
            "home_team": {
                "id": m.get("homeTeam", {}).get("id"),
                "name": m.get("homeTeam", {}).get("name", ""),
                "tla": m.get("homeTeam", {}).get("tla", ""),
                "crest": m.get("homeTeam", {}).get("crest", ""),
            },
            "away_team": {
                "id": m.get("awayTeam", {}).get("id"),
                "name": m.get("awayTeam", {}).get("name", ""),
                "tla": m.get("awayTeam", {}).get("tla", ""),
                "crest": m.get("awayTeam", {}).get("crest", ""),
            },
            "score": {
                "home": ft.get("home"),
                "away": ft.get("away"),
                "half_home": ht.get("home"),
                "half_away": ht.get("away"),
                "winner": m.get("score", {}).get("winner"),
            },
            "is_home": m.get("homeTeam", {}).get("id") == ext_id,
        }

    return {
        "team": {
            "id": team.id,
            "name": team.name,
            "short_name": team.short_name,
            "logo": team.logo,
        },
        "stats": {
            "played": len(finished),
            "wins": wins,
            "draws": draws,
            "losses": losses,
            "goals_for": goals_for,
            "goals_against": goals_against,
            "goal_difference": goals_for - goals_against,
            "clean_sheets": clean_sheets,
        },
        "results": [fmt(m) for m in reversed(finished)],
        "upcoming": [fmt(m) for m in upcoming],
    }


@router.get("/{team_id}/details")
async def get_team_details(
    team_id: int,
    competition: str = Query("PL"),
    db: Session = Depends(get_db),
):
    """Live team details with squad, coach, venue, and club metadata."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    code = normalize_competition_code(competition)
    headers = {"X-Auth-Token": settings.FOOTBALL_DATA_API_KEY}
    base = settings.FOOTBALL_DATA_BASE_URL

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{base}/competitions/{code}/teams",
                headers=headers,
                timeout=20.0,
            )
            response.raise_for_status()
            teams = response.json().get("teams", [])
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"Failed to fetch team details: {exc}")

    team_data = next((item for item in teams if item.get("id") == team.external_id), None)
    if not team_data:
        raise HTTPException(status_code=404, detail="Team details unavailable")

    return _format_team_detail(team_data)


@router.get("/{team_id}", response_model=TeamSchema)
async def get_team(team_id: int, db: Session = Depends(get_db)):
    team_service = TeamService(db)
    team = await team_service.get_team_by_id(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team
