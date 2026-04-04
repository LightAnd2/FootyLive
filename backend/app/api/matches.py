from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from app.core.database import get_db
from app.schemas.match import Match as MatchSchema, MatchList
from app.services.football_data import football_data_service
from app.services.match_service import MatchService
from app.core.competitions import MAIN_LEAGUE_CODES, normalize_competition_code

router = APIRouter()


@router.get("/live", response_model=List[MatchSchema])
async def get_live_matches(
    competition: str = Query("PL"),
    db: Session = Depends(get_db),
):
    """Get all live matches"""
    match_service = MatchService(db)
    return await match_service.get_live_matches_by_competition(
        normalize_competition_code(competition)
    )


@router.get("/today", response_model=List[MatchSchema])
async def get_today_matches(
    competition: str = Query("PL"),
    db: Session = Depends(get_db),
):
    """Get today's matches"""
    match_service = MatchService(db)
    today = datetime.now().strftime("%Y-%m-%d")
    return await match_service.get_matches_by_date(
        today, normalize_competition_code(competition)
    )


@router.get("/upcoming", response_model=List[MatchSchema])
async def get_upcoming_matches(
    days: int = Query(30, ge=1, le=90),
    competition: str = Query("PL"),
    db: Session = Depends(get_db),
):
    """Get upcoming matches"""
    match_service = MatchService(db)
    return await match_service.get_upcoming_matches(
        days, normalize_competition_code(competition)
    )


@router.get("/", response_model=MatchList)
async def get_matches(
    status: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    competition: str = Query("PL"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get matches with optional filtering"""
    match_service = MatchService(db)
    if not date and not status:
        date = datetime.now().strftime("%Y-%m-%d")
    comp_code = normalize_competition_code(competition)
    matches = await match_service.get_matches(
        status=status,
        date=date,
        competition=comp_code,
        page=page,
        per_page=per_page,
    )
    total = await match_service.count_matches(
        status=status, date=date, competition=comp_code
    )
    return MatchList(matches=matches, total=total, page=page, per_page=per_page)


@router.get("/{match_id}", response_model=MatchSchema)
async def get_match(match_id: int, db: Session = Depends(get_db)):
    """Get specific match details from the local store."""
    match_service = MatchService(db)

    match = await match_service.get_match_by_id(match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match


@router.post("/sync")
async def sync_matches(db: Session = Depends(get_db)):
    """Sync supported league matches from football-data.org."""
    match_service = MatchService(db)

    try:
        now = datetime.now(timezone.utc)
        # Season starts in August; if we're before August use the previous year's start
        season_year = now.year if now.month >= 8 else now.year - 1
        season_start = f"{season_year}-08-01"
        future_end = (now + timedelta(days=60)).strftime("%Y-%m-%d")
        total = 0

        for competition in MAIN_LEAGUE_CODES:
            matches = await football_data_service.fetch_matches_range(
                season_start, future_end, competition
            )
            await match_service.sync_matches(matches)
            total += len(matches)

        return {"message": f"Synced {total} matches successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error syncing matches: {str(e)}")


@router.post("/sync-events")
async def sync_match_events(db: Session = Depends(get_db)):
    """Sync match-level events (goals/cards/subs) for existing matches."""
    match_service = MatchService(db)

    try:
        now = datetime.now(timezone.utc)
        season_year = now.year if now.month >= 8 else now.year - 1
        season_start = f"{season_year}-08-01"
        future_end = (now + timedelta(days=60)).strftime("%Y-%m-%d")
        all_matches = []
        for competition in MAIN_LEAGUE_CODES:
            competition_matches = await football_data_service.fetch_matches_range(
                season_start, future_end, competition
            )
            all_matches.extend(competition_matches)

        await match_service.sync_match_events(all_matches)

        return {"message": f"Synced match events for {len(all_matches)} matches successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error syncing match events: {str(e)}")
