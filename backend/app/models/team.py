from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(Integer, unique=True, index=True)  # Upstream team ID
    name = Column(String(255), nullable=False)
    short_name = Column(String(50))
    logo = Column(String(500))
    color = Column(String(7))  # Hex color code
    country = Column(String(100))
    founded = Column(Integer)
    venue = Column(String(255))
    venue_capacity = Column(Integer)
    website = Column(String(500))
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    # Relationships
    home_matches = relationship("Match", foreign_keys="Match.home_team_id", back_populates="home_team")
    away_matches = relationship("Match", foreign_keys="Match.away_team_id", back_populates="away_team")
    players = relationship("Player", back_populates="team")
    events = relationship("MatchEvent", back_populates="team")
    lineups = relationship("MatchLineup", back_populates="team")
