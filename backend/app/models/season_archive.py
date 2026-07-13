from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, JSON, DateTime, UniqueConstraint

from app.core.database import Base


class SeasonArchive(Base):
    """A frozen snapshot of a finished season/tournament — bracket, table, and top
    scorers — so it can be served without any further calls to football-data.org."""

    __tablename__ = "season_archives"
    __table_args__ = (
        UniqueConstraint("competition_code", "season_label", name="uq_season_archive_competition_label"),
    )

    id = Column(Integer, primary_key=True, index=True)
    competition_code = Column(String(10), index=True, nullable=False)
    season_label = Column(String(20), nullable=False)  # e.g. "2025-26" or "2024"
    bracket = Column(JSON, nullable=True)
    standings = Column(JSON, nullable=True)
    scorers = Column(JSON, nullable=True)
    archived_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
