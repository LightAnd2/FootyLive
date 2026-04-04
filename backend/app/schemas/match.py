from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.team import Team
from app.schemas.player import Player

class MatchEventBase(BaseModel):
    type: str
    minute: int
    player_name: str
    team_id: int
    description: str
    is_home: bool

class MatchEvent(MatchEventBase):
    id: int
    match_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class MatchLineupBase(BaseModel):
    team_id: int
    player_id: int
    position: str
    number: int
    is_captain: bool = False
    is_substitute: bool = False
    is_starting: bool = True

class MatchLineup(MatchLineupBase):
    id: int
    match_id: int
    player: Player
    created_at: datetime
    
    class Config:
        from_attributes = True

class MatchBase(BaseModel):
    home_team_id: int
    away_team_id: int
    home_score: int = 0
    away_score: int = 0
    status: str
    minute: Optional[int] = None
    venue: Optional[str] = None
    referee: Optional[str] = None
    match_date: datetime
    league_id: int
    season_id: Optional[int] = None
    matchday: Optional[int] = None
    competition_code: Optional[str] = None
    competition_name: Optional[str] = None

class MatchCreate(MatchBase):
    external_id: int

class MatchUpdate(BaseModel):
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    status: Optional[str] = None
    minute: Optional[int] = None

class Match(MatchBase):
    id: int
    external_id: int
    home_team: Team
    away_team: Team
    events: List[MatchEvent] = []
    lineups: List[MatchLineup] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class MatchList(BaseModel):
    matches: List[Match]
    total: int
    page: int
    per_page: int
