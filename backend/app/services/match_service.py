from sqlalchemy.orm import Session
from sqlalchemy import and_, asc, desc
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from app.models.match import Match, MatchEvent, MatchLineup
from app.models.team import Team
from app.schemas.match import Match as MatchSchema
from app.services.football_data import football_data_service
from app.core.competitions import DEFAULT_COMPETITION_CODE


class MatchService:
    def __init__(self, db: Session):
        self.db = db

    async def get_matches(
        self,
        status: Optional[str] = None,
        date: Optional[str] = None,
        competition: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> List[MatchSchema]:
        query = self.db.query(Match).join(Team, Match.home_team_id == Team.id)

        if status:
            query = query.filter(Match.status == status)

        if competition:
            query = query.filter(Match.competition_code == competition)

        if date:
            start_date = datetime.strptime(date, "%Y-%m-%d")
            end_date = start_date + timedelta(days=1)
            query = query.filter(
                and_(Match.match_date >= start_date, Match.match_date < end_date)
            )

        # Show most recent first for finished matches, soonest first for others
        if status == 'full_time':
            query = query.order_by(desc(Match.match_date))
        else:
            query = query.order_by(asc(Match.match_date))
        offset = (page - 1) * per_page
        matches = query.offset(offset).limit(per_page).all()
        return [self._match_to_schema(match) for match in matches]

    async def get_live_matches(self) -> List[MatchSchema]:
        return await self.get_live_matches_by_competition()

    async def get_live_matches_by_competition(
        self, competition: Optional[str] = None
    ) -> List[MatchSchema]:
        query = self.db.query(Match).filter(Match.status.in_(["live", "half_time"]))
        if competition:
            query = query.filter(Match.competition_code == competition)
        matches = query.order_by(asc(Match.match_date)).all()
        return [self._match_to_schema(match) for match in matches]

    async def get_match_by_id(self, match_id: int) -> Optional[MatchSchema]:
        match = self.db.query(Match).filter(Match.id == match_id).first()
        return self._match_to_schema(match) if match else None

    async def get_matches_by_date(
        self, date: str, competition: Optional[str] = None
    ) -> List[MatchSchema]:
        start_date = datetime.strptime(date, "%Y-%m-%d")
        end_date = start_date + timedelta(days=1)
        query = self.db.query(Match).filter(
            and_(Match.match_date >= start_date, Match.match_date < end_date)
        )
        if competition:
            query = query.filter(Match.competition_code == competition)
        matches = query.order_by(asc(Match.match_date)).all()
        return [self._match_to_schema(match) for match in matches]

    async def get_upcoming_matches(
        self, days: int = 30, competition: Optional[str] = None
    ) -> List[MatchSchema]:
        start_date = datetime.now(timezone.utc)
        end_date = start_date + timedelta(days=days)
        query = self.db.query(Match).filter(
            and_(
                Match.match_date >= start_date,
                Match.match_date <= end_date,
                Match.status == "scheduled",
            )
        )
        if competition:
            query = query.filter(Match.competition_code == competition)
        matches = query.order_by(asc(Match.match_date)).all()
        return [self._match_to_schema(match) for match in matches]

    async def count_matches(
        self,
        status: Optional[str] = None,
        date: Optional[str] = None,
        competition: Optional[str] = None,
    ) -> int:
        query = self.db.query(Match)
        if status:
            query = query.filter(Match.status == status)
        if competition:
            query = query.filter(Match.competition_code == competition)
        if date:
            start_date = datetime.strptime(date, "%Y-%m-%d")
            end_date = start_date + timedelta(days=1)
            query = query.filter(
                and_(Match.match_date >= start_date, Match.match_date < end_date)
            )
        return query.count()

    async def sync_matches(self, matches_data: List[dict]):
        for match_data in matches_data:
            await self._sync_single_match(match_data)
        self.db.commit()

    async def _sync_single_match(self, match_data: dict):
        parsed_match = football_data_service.parse_match_data(match_data)

        # Sync home and away teams, get internal DB IDs
        home_team_ext = match_data.get("homeTeam", {})
        away_team_ext = match_data.get("awayTeam", {})

        home_team = await self._sync_team(home_team_ext)
        away_team = await self._sync_team(away_team_ext)

        if not home_team or not away_team:
            return

        parsed_match["home_team_id"] = home_team.id
        parsed_match["away_team_id"] = away_team.id

        # Check if match already exists
        existing_match = (
            self.db.query(Match)
            .filter(Match.external_id == parsed_match["external_id"])
            .first()
        )

        if existing_match:
            for key, value in parsed_match.items():
                if key not in ("external_id", "created_at"):
                    setattr(existing_match, key, value)
            existing_match.updated_at = datetime.now(timezone.utc)
            match_record = existing_match
        else:
            match_record = Match(**parsed_match)
            self.db.add(match_record)
            self.db.flush()

        # Sync events (goals, bookings, substitutions)
        events = football_data_service.parse_events(match_data)
        for event_data in events:
            await self._sync_event(event_data, match_record.id, match_record.home_team_id)

    async def _sync_team(self, team_data: dict) -> Optional[Team]:
        if not team_data or not team_data.get("id"):
            return None

        parsed_team = football_data_service.parse_team_data(team_data)
        existing = (
            self.db.query(Team)
            .filter(Team.external_id == parsed_team["external_id"])
            .first()
        )

        if existing:
            for key, value in parsed_team.items():
                if key not in ("external_id", "created_at"):
                    setattr(existing, key, value)
            existing.updated_at = datetime.now(timezone.utc)
            return existing
        else:
            new_team = Team(**parsed_team)
            self.db.add(new_team)
            self.db.flush()
            return new_team

    async def _sync_event(self, event_data: dict, match_id: int, home_team_id: Optional[int] = None):
        team_ext_id = event_data.pop("team_external_id", None)

        team = None
        if team_ext_id:
            team = (
                self.db.query(Team)
                .filter(Team.external_id == team_ext_id)
                .first()
            )

        # Avoid duplicate events for the same match/type/minute/player
        existing = (
            self.db.query(MatchEvent)
            .filter(
                and_(
                    MatchEvent.match_id == match_id,
                    MatchEvent.type == event_data.get("type"),
                    MatchEvent.minute == event_data.get("minute"),
                    MatchEvent.player_name == event_data.get("player_name"),
                )
            )
            .first()
        )

        if existing:
            return

        new_event = MatchEvent(
            match_id=match_id,
            type=event_data.get("type"),
            minute=event_data.get("minute"),
            player_name=event_data.get("player_name", ""),
            team_id=team.id if team else None,
            description=event_data.get("description", ""),
            is_home=(team.id == home_team_id if team and home_team_id is not None else False),
            created_at=event_data.get("created_at", datetime.now(timezone.utc)),
        )
        self.db.add(new_event)

    async def sync_match_events(self, matches_data: List[dict]):
        """Fetch individual match details to get events (goals/bookings/subs)."""
        import asyncio
        for match_data in matches_data:
            ext_id = match_data.get("id")
            if not ext_id:
                continue
            detail = await football_data_service.fetch_match_details(ext_id)
            if not detail:
                continue
            match_record = self.db.query(Match).filter(Match.external_id == ext_id).first()
            if not match_record:
                continue
            events = football_data_service.parse_events(detail)
            for event_data in events:
                await self._sync_event(event_data, match_record.id, match_record.home_team_id)
            self.db.commit()
            await asyncio.sleep(6)

    async def _sync_lineup(self, lineup_data: dict, match_id: int):
        pass

    def _match_to_schema(self, match: Match) -> MatchSchema:
        return MatchSchema(
            id=match.id,
            external_id=match.external_id,
            home_team_id=match.home_team_id,
            away_team_id=match.away_team_id,
            home_score=match.home_score,
            away_score=match.away_score,
            status=match.status,
            minute=match.minute,
            venue=match.venue,
            referee=match.referee,
            match_date=match.match_date,
            league_id=match.league_id,
            season_id=match.season_id,
            matchday=getattr(match, 'matchday', None),
            competition_code=getattr(match, 'competition_code', 'PL'),
            competition_name=getattr(match, 'competition_name', 'Premier League'),
            home_team=match.home_team,
            away_team=match.away_team,
            events=match.events or [],
            lineups=[],
            created_at=match.created_at,
            updated_at=match.updated_at,
        )
