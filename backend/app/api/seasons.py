from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.competitions import normalize_competition_code
from app.core.database import get_db
from app.models.season_archive import SeasonArchive

router = APIRouter(redirect_slashes=False)


@router.get("/")
def list_seasons(competition: str = Query(...), db: Session = Depends(get_db)):
    """Archived (finished) seasons available for a competition, most recent first."""
    code = normalize_competition_code(competition)
    rows = (
        db.query(SeasonArchive)
        .filter(SeasonArchive.competition_code == code)
        .order_by(SeasonArchive.season_label.desc())
        .all()
    )
    return {"seasons": [row.season_label for row in rows]}
