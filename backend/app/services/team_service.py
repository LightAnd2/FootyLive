from sqlalchemy.orm import Session
from sqlalchemy import or_, asc
from typing import List, Optional
from app.models.team import Team
from app.models.match import Match
from app.schemas.team import Team as TeamSchema

class TeamService:
    def __init__(self, db: Session):
        self.db = db
    
    async def get_teams(
        self, 
        search: Optional[str] = None, 
        country: Optional[str] = None,
        competition: Optional[str] = None,
    ) -> List[TeamSchema]:
        """Get teams with optional filtering"""
        query = self.db.query(Team)

        if competition:
            query = query.join(
                Match,
                or_(Match.home_team_id == Team.id, Match.away_team_id == Team.id),
            ).filter(Match.competition_code == competition).distinct()
        
        if search:
            query = query.filter(
                or_(
                    Team.name.ilike(f"%{search}%"),
                    Team.short_name.ilike(f"%{search}%")
                )
            )
        
        if country:
            query = query.filter(Team.country.ilike(f"%{country}%"))
        
        teams = query.order_by(asc(Team.name)).all()
        return [self._team_to_schema(team) for team in teams]
    
    async def get_team_by_id(self, team_id: int) -> Optional[TeamSchema]:
        """Get team by ID"""
        team = self.db.query(Team).filter(Team.id == team_id).first()
        return self._team_to_schema(team) if team else None
    
    async def get_premier_league_teams(self) -> List[TeamSchema]:
        """Get all Premier League teams"""
        teams = (
            self.db.query(Team)
            .join(
                Match,
                or_(Match.home_team_id == Team.id, Match.away_team_id == Team.id),
            )
            .filter(Match.competition_code == "PL")
            .distinct()
            .order_by(asc(Team.name))
            .all()
        )
        
        return [self._team_to_schema(team) for team in teams]
    
    def _team_to_schema(self, team: Team) -> TeamSchema:
        """Convert Team model to TeamSchema"""
        return TeamSchema(
            id=team.id,
            external_id=team.external_id,
            name=team.name,
            short_name=team.short_name,
            logo=team.logo,
            color=team.color,
            country=team.country,
            founded=team.founded,
            venue=team.venue,
            venue_capacity=team.venue_capacity,
            website=team.website,
            created_at=team.created_at,
            updated_at=team.updated_at
        )
