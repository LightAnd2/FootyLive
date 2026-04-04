from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.player import Player
from app.schemas.player import Player as PlayerSchema
from app.services.player_service import PlayerService

router = APIRouter()

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
