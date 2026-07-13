"""
Freeze a finished competition season into the database so it can be served
from our own DB forever after, with no further calls to football-data.org.

Usage:
    python scripts/archive_season.py CL 2025-26
    python scripts/archive_season.py EC 2024

    # Competitions on a plain calendar year (e.g. Brasileirão) instead of
    # Aug-May need the football-data.org season pinned explicitly:
    python scripts/archive_season.py BSA 2025 --season-year 2025
"""
import argparse
import asyncio
import sys
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.api.scorers import fetch_scorers
from app.api.standings import fetch_bracket, fetch_standings
from app.core.competitions import CUP_COMPETITION_CODES, normalize_competition_code
from app.core.database import Base, SessionLocal, engine
from app.models import match, player, season_archive, team  # noqa: F401 — registers tables
from app.models.season_archive import SeasonArchive


async def archive(competition: str, season_label: str, season_year: Optional[int] = None) -> None:
    code = normalize_competition_code(competition)
    is_cup = code in CUP_COMPETITION_CODES

    print(f"Fetching {'bracket' if is_cup else 'table'}/scorers for {code}"
          f"{f' (season {season_year})' if season_year else ''}...")
    # Cups are told by their bracket (a group-stage table isn't the story); leagues
    # have no knockout stage — so each only stores the snapshot that's relevant.
    bracket = await fetch_bracket(code, use_cache=False) if is_cup else None
    standings = await fetch_standings(code, use_cache=False, season_year=season_year) if not is_cup else None
    scorers = await fetch_scorers(code, use_cache=False, season_year=season_year)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(SeasonArchive).filter(
            SeasonArchive.competition_code == code,
            SeasonArchive.season_label == season_label,
        ).first()

        if existing:
            existing.bracket = bracket
            existing.standings = standings
            existing.scorers = scorers
            print(f"Updated existing archive: {code} {season_label}")
        else:
            db.add(SeasonArchive(
                competition_code=code,
                season_label=season_label,
                bracket=bracket,
                standings=standings,
                scorers=scorers,
            ))
            print(f"Saved new archive: {code} {season_label}")

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("competition", help="Competition code, e.g. CL, EC, WC")
    parser.add_argument("season_label", help="Label to store it under, e.g. 2025-26 or 2024")
    parser.add_argument(
        "--season-year", type=int, default=None,
        help="Pin an explicit football-data.org season (start year) instead of using 'current'",
    )
    args = parser.parse_args()

    asyncio.run(archive(args.competition, args.season_label, args.season_year))
