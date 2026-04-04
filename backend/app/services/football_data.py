import httpx
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from app.core.config import settings
from app.core.competitions import DEFAULT_COMPETITION_CODE

logger = logging.getLogger(__name__)

STATUS_MAP = {
    "SCHEDULED": "scheduled",
    "TIMED": "scheduled",
    "IN_PLAY": "live",
    "PAUSED": "half_time",
    "FINISHED": "full_time",
    "POSTPONED": "postponed",
    "CANCELLED": "cancelled",
    "SUSPENDED": "suspended",
    "AWARDED": "full_time",
}


class FootballDataService:
    def __init__(self):
        self.base_url = settings.FOOTBALL_DATA_BASE_URL
        self.api_key = settings.FOOTBALL_DATA_API_KEY

    @property
    def _headers(self):
        return {"X-Auth-Token": self.api_key}

    async def _get(self, endpoint: str, params: dict = None) -> Optional[dict]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}{endpoint}",
                    headers=self._headers,
                    params=params,
                    timeout=30.0,
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP {e.response.status_code} for {endpoint}: {e}")
                return None
            except httpx.RequestError as e:
                logger.error(f"Request error for {endpoint}: {e}")
                return None

    async def fetch_all_live_matches(self) -> List[Dict[str, Any]]:
        """Fetch all live matches across every accessible competition in one call."""
        data = await self._get("/matches", params={"status": "IN_PLAY,PAUSED"})
        return data.get("matches", []) if data else []

    async def fetch_live_matches(
        self, competition: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        code = competition or DEFAULT_COMPETITION_CODE
        data = await self._get(
            f"/competitions/{code}/matches",
            params={"status": "IN_PLAY,PAUSED"},
        )
        return data.get("matches", []) if data else []

    async def fetch_matches(
        self, date: Optional[str] = None, competition: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        params = {}
        if date:
            params["dateFrom"] = date
            params["dateTo"] = date
        code = competition or DEFAULT_COMPETITION_CODE
        data = await self._get(
            f"/competitions/{code}/matches", params=params
        )
        return data.get("matches", []) if data else []

    async def fetch_matches_range(self, date_from: str, date_to: str, competition: str = None) -> List[Dict[str, Any]]:
        code = competition or DEFAULT_COMPETITION_CODE
        data = await self._get(
            f"/competitions/{code}/matches",
            params={"dateFrom": date_from, "dateTo": date_to},
        )
        return data.get("matches", []) if data else []

    async def fetch_upcoming_matches(
        self, days: int = 7, competition: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        future = (datetime.now(timezone.utc) + timedelta(days=days)).strftime("%Y-%m-%d")
        code = competition or DEFAULT_COMPETITION_CODE
        data = await self._get(
            f"/competitions/{code}/matches",
            params={"dateFrom": today, "dateTo": future, "status": "SCHEDULED,TIMED"},
        )
        return data.get("matches", []) if data else []

    async def fetch_match_details(self, match_id: int) -> Optional[Dict[str, Any]]:
        return await self._get(f"/matches/{match_id}")

    async def fetch_teams(self, competition: Optional[str] = None) -> List[Dict[str, Any]]:
        code = competition or DEFAULT_COMPETITION_CODE
        data = await self._get(f"/competitions/{code}/teams")
        return data.get("teams", []) if data else []

    def parse_team_data(self, team_data: Dict[str, Any]) -> Dict[str, Any]:
        area = team_data.get("area") or {}
        return {
            "external_id": team_data.get("id"),
            "name": team_data.get("name", ""),
            "short_name": team_data.get("tla") or team_data.get("shortName", ""),
            "logo": team_data.get("crest", ""),
            "country": area.get("name", ""),
            "founded": team_data.get("founded"),
            "venue": team_data.get("venue", ""),
            "website": team_data.get("website"),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

    def parse_match_data(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        score = match_data.get("score", {})
        full_time = score.get("fullTime") or {}

        status_raw = match_data.get("status", "SCHEDULED")
        status = STATUS_MAP.get(status_raw, "scheduled")

        utc_date = match_data.get("utcDate", "")
        try:
            match_date = datetime.fromisoformat(utc_date.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            match_date = datetime.now(timezone.utc)

        referees = match_data.get("referees", [])
        referee_name = next(
            (r.get("name", "") for r in referees if r.get("role") == "REFEREE"), ""
        )

        # Calculate match minute from kickoff time (API doesn't provide it on free tier)
        minute = match_data.get("minute")
        if minute is None and status_raw == "IN_PLAY":
            try:
                elapsed = (datetime.now(timezone.utc) - match_date).total_seconds() / 60
                if elapsed <= 52:
                    # First half — subtract ~3 min for pre-kick delay
                    minute = max(1, int(elapsed) - 3)
                else:
                    # Second half — subtract ~15 min halftime + ~3 min pre-kick delay
                    minute = max(46, int(elapsed - 18))
            except Exception:
                pass

        competition = match_data.get("competition") or {}
        return {
            "external_id": match_data.get("id"),
            "home_score": full_time.get("home") or 0,
            "away_score": full_time.get("away") or 0,
            "status": status,
            "minute": minute,
            "venue": match_data.get("venue") or "",
            "referee": referee_name,
            "match_date": match_date,
            "league_id": competition.get("id") or settings.PREMIER_LEAGUE_ID,
            "season_id": match_data.get("season", {}).get("id"),
            "matchday": match_data.get("matchday"),
            "competition_code": competition.get("code", DEFAULT_COMPETITION_CODE),
            "competition_name": competition.get("name", "Premier League"),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

    def parse_events(self, match_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Convert goals/bookings/substitutions into unified event list."""
        events = []
        now = datetime.now(timezone.utc)

        for goal in (match_data.get("goals") or []):
            team = goal.get("team") or {}
            scorer = goal.get("scorer") or {}
            events.append({
                "type": "goal",
                "minute": goal.get("minute"),
                "player_name": scorer.get("name", ""),
                "team_external_id": team.get("id"),
                "description": f"Goal by {scorer.get('name', 'Unknown')}",
                "created_at": now,
            })

        for booking in (match_data.get("bookings") or []):
            team = booking.get("team") or {}
            player = booking.get("player") or {}
            card = booking.get("card", "YELLOW_CARD")
            event_type = "yellow_card" if "YELLOW" in card else "red_card"
            events.append({
                "type": event_type,
                "minute": booking.get("minute"),
                "player_name": player.get("name", ""),
                "team_external_id": team.get("id"),
                "description": f"{card.replace('_', ' ').title()} for {player.get('name', 'Unknown')}",
                "created_at": now,
            })

        for sub in (match_data.get("substitutions") or []):
            team = sub.get("team") or {}
            player_out = sub.get("playerOut") or {}
            player_in = sub.get("playerIn") or {}
            events.append({
                "type": "substitution",
                "minute": sub.get("minute"),
                "player_name": player_in.get("name", ""),
                "team_external_id": team.get("id"),
                "description": f"Sub: {player_in.get('name', '?')} on for {player_out.get('name', '?')}",
                "created_at": now,
            })

        return events


football_data_service = FootballDataService()
