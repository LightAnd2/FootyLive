from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Match(Base):
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(Integer, unique=True, index=True)  # Upstream match ID
    home_team_id = Column(Integer, ForeignKey("teams.id"))
    away_team_id = Column(Integer, ForeignKey("teams.id"))
    home_score = Column(Integer, default=0)
    away_score = Column(Integer, default=0)
    status = Column(String(50))  # scheduled, live, half_time, full_time, etc.
    minute = Column(Integer, nullable=True)
    venue = Column(String(255))
    referee = Column(String(255))
    match_date = Column(DateTime)
    league_id = Column(Integer)
    season_id = Column(Integer)
    matchday = Column(Integer, nullable=True)
    competition_code = Column(String(10), nullable=True)   # PL, CL, etc.
    competition_name = Column(String(100), nullable=True)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    # Relationships
    home_team = relationship("Team", foreign_keys=[home_team_id], back_populates="home_matches")
    away_team = relationship("Team", foreign_keys=[away_team_id], back_populates="away_matches")
    events = relationship("MatchEvent", back_populates="match")
    lineups = relationship("MatchLineup", back_populates="match")

class MatchEvent(Base):
    __tablename__ = "match_events"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"))
    external_id = Column(Integer, nullable=True)
    type = Column(String(50))  # goal, card, substitution, etc.
    minute = Column(Integer)
    player_name = Column(String(255))
    team_id = Column(Integer, ForeignKey("teams.id"))
    description = Column(Text)
    is_home = Column(Boolean)
    created_at = Column(DateTime)
    
    # Relationships
    match = relationship("Match", back_populates="events")
    team = relationship("Team")

class MatchLineup(Base):
    __tablename__ = "match_lineups"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"))
    team_id = Column(Integer, ForeignKey("teams.id"))
    player_id = Column(Integer, ForeignKey("players.id"))
    position = Column(String(50))
    number = Column(Integer)
    is_captain = Column(Boolean, default=False)
    is_substitute = Column(Boolean, default=False)
    is_starting = Column(Boolean, default=True)
    created_at = Column(DateTime)
    
    # Relationships
    match = relationship("Match", back_populates="lineups")
    team = relationship("Team")
    player = relationship("Player")
