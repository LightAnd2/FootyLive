from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class PlayerBase(BaseModel):
    name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    position: Optional[str] = None
    number: Optional[int] = None
    photo: Optional[str] = None
    nationality: Optional[str] = None
    birth_date: Optional[date] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    team_id: Optional[int] = None
    is_active: bool = True

class PlayerCreate(PlayerBase):
    external_id: int

class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    position: Optional[str] = None
    number: Optional[int] = None
    photo: Optional[str] = None
    nationality: Optional[str] = None
    birth_date: Optional[date] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    team_id: Optional[int] = None
    is_active: Optional[bool] = None

class Player(PlayerBase):
    id: int
    external_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
