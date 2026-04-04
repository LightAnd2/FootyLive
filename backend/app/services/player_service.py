from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from typing import List, Optional
from app.models.player import Player
from app.schemas.player import Player as PlayerSchema

class PlayerService:
    def __init__(self, db: Session):
        self.db = db
    
    async def get_players(
        self, 
        team_id: Optional[int] = None,
        position: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[PlayerSchema]:
        """Get players with optional filtering"""
        query = self.db.query(Player).filter(Player.is_active == True)
        
        if team_id:
            query = query.filter(Player.team_id == team_id)
        
        if position:
            query = query.filter(Player.position.ilike(f"%{position}%"))
        
        if search:
            query = query.filter(
                or_(
                    Player.name.ilike(f"%{search}%"),
                    Player.first_name.ilike(f"%{search}%"),
                    Player.last_name.ilike(f"%{search}%")
                )
            )
        
        players = query.order_by(asc(Player.name)).all()
        return [self._player_to_schema(player) for player in players]
    
    async def get_player_by_id(self, player_id: int) -> Optional[PlayerSchema]:
        """Get player by ID"""
        player = self.db.query(Player).filter(Player.id == player_id).first()
        return self._player_to_schema(player) if player else None
    
    async def get_players_by_team(self, team_id: int) -> List[PlayerSchema]:
        """Get all players for a specific team"""
        players = self.db.query(Player).filter(
            and_(
                Player.team_id == team_id,
                Player.is_active == True
            )
        ).order_by(asc(Player.name)).all()
        
        return [self._player_to_schema(player) for player in players]
    
    def _player_to_schema(self, player: Player) -> PlayerSchema:
        """Convert Player model to PlayerSchema"""
        return PlayerSchema(
            id=player.id,
            external_id=player.external_id,
            name=player.name,
            first_name=player.first_name,
            last_name=player.last_name,
            position=player.position,
            number=player.number,
            photo=player.photo,
            nationality=player.nationality,
            birth_date=player.birth_date,
            height=player.height,
            weight=player.weight,
            team_id=player.team_id,
            is_active=player.is_active,
            created_at=player.created_at,
            updated_at=player.updated_at
        )
