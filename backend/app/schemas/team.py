from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TeamBase(BaseModel):
    name: str
    short_name: Optional[str] = None
    logo: Optional[str] = None
    color: Optional[str] = None
    country: Optional[str] = None
    founded: Optional[int] = None
    venue: Optional[str] = None
    venue_capacity: Optional[int] = None
    website: Optional[str] = None

class TeamCreate(TeamBase):
    external_id: int

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None
    logo: Optional[str] = None
    color: Optional[str] = None
    country: Optional[str] = None
    founded: Optional[int] = None
    venue: Optional[str] = None
    venue_capacity: Optional[int] = None
    website: Optional[str] = None

class Team(TeamBase):
    id: int
    external_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
