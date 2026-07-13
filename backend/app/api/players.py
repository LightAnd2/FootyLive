from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.cache import cache_get, cache_set
from app.core.database import get_db
from app.models.player import Player
from app.schemas.player import Player as PlayerSchema
from app.services.football_data import football_data_service
from app.services.player_service import PlayerService

router = APIRouter(redirect_slashes=False)


@router.get("/{person_id}/profile")
async def get_player_profile(person_id: int):
    """Live player profile (position, nationality, birth date, current club contract)."""
    cache_key = f"person:{person_id}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    data = await football_data_service._get(f"/persons/{person_id}")
    if not data:
        raise HTTPException(status_code=502, detail="Failed to fetch player profile")

    team = data.get("currentTeam") or {}
    contract = team.get("contract") or {}
    result = {
        "id": data.get("id"),
        "name": data.get("name", ""),
        "first_name": data.get("firstName"),
        "last_name": data.get("lastName"),
        "date_of_birth": data.get("dateOfBirth"),
        "nationality": data.get("nationality"),
        "position": data.get("position"),
        "shirt_number": data.get("shirtNumber"),
        "current_team": {
            "id": team.get("id"),
            "name": team.get("name", ""),
            "crest": team.get("crest", ""),
            "contract_start": contract.get("start"),
            "contract_until": contract.get("until"),
        },
    }
    await cache_set(cache_key, result, ttl=86400)
    return result

@router.get("/", response_model=List[PlayerSchema])
async def get_players(
    team_id: Optional[int] = Query(None, description="Filter by team ID"),
    position: Optional[str] = Query(None, description="Filter by position"),
    search: Optional[str] = Query(None, description="Search players by name"),
    db: Session = Depends(get_db)
):
    """Get all players with optional filtering"""
    player_service = PlayerService(db)
    return await player_service.get_players(
        team_id=team_id, 
        position=position, 
        search=search
    )

@router.get("/team/{team_id}", response_model=List[PlayerSchema])
async def get_team_players(team_id: int, db: Session = Depends(get_db)):
    """Get all players for a specific team"""
    player_service = PlayerService(db)
    return await player_service.get_players_by_team(team_id)

@router.get("/{player_id}", response_model=PlayerSchema)
async def get_player(player_id: int, db: Session = Depends(get_db)):
    """Get specific player details"""
    player_service = PlayerService(db)
    player = await player_service.get_player_by_id(player_id)

    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    return player
