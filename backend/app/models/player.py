from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.core.database import Base

class Player(Base):
    __tablename__ = "players"
    
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(Integer, unique=True, index=True)  # Upstream player ID
    name = Column(String(255), nullable=False)
    first_name = Column(String(255))
    last_name = Column(String(255))
    position = Column(String(50))
    number = Column(Integer)
    photo = Column(String(500))
    nationality = Column(String(100))
    birth_date = Column(Date)
    height = Column(Integer)  # in cm
    weight = Column(Integer)  # in kg
    team_id = Column(Integer, ForeignKey("teams.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    # Relationships
    team = relationship("Team", back_populates="players")
    lineups = relationship("MatchLineup", back_populates="player")
