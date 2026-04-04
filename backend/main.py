import asyncio
import json
import logging
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api import matches, teams, players, rate_limit, standings, scorers, clean_sheets
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.middleware import RateLimitMiddleware
from app.models import match, team, player
from app.services.football_data import football_data_service
from app.services.match_service import MatchService

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FootyLive API",
    description="Live football tracker for major domestic leagues and the UEFA Champions League, powered by football-data.org",
    version="2.0.0",
    docs_url="/api/docs" if settings.DOCS_ENABLED else None,
    redoc_url="/api/redoc" if settings.DOCS_ENABLED else None,
)

app.add_middleware(RateLimitMiddleware)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if settings.ENVIRONMENT.lower() != "development":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

app.include_router(matches.router, prefix="/api/matches", tags=["matches"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])
app.include_router(players.router, prefix="/api/players", tags=["players"])
app.include_router(rate_limit.router, prefix="/api/rate-limit", tags=["rate-limit"])
app.include_router(standings.router, prefix="/api/standings", tags=["standings"])
app.include_router(scorers.router, prefix="/api/scorers", tags=["scorers"])
app.include_router(clean_sheets.router, prefix="/api/clean-sheets", tags=["clean-sheets"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        await websocket.send_text(json.dumps({"type": "connected"}))

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead.append(connection)
        for conn in dead:
            self.disconnect(conn)


manager = ConnectionManager()


async def sync_recent_matches_window():
    """Refresh a wider recent window so completed games don't stay stale if live tracking misses them."""
    from datetime import datetime, timedelta, timezone
    from app.core.competitions import MAIN_LEAGUE_CODES

    db = SessionLocal()
    try:
        match_service = MatchService(db)
        today = datetime.now(timezone.utc).date()
        date_from = (today - timedelta(days=1)).strftime("%Y-%m-%d")
        date_to = (today + timedelta(days=1)).strftime("%Y-%m-%d")

        for competition in MAIN_LEAGUE_CODES:
            matches_window = await football_data_service.fetch_matches_range(
                date_from, date_to, competition
            )
            if matches_window:
                await match_service.sync_matches(matches_window)

        db.commit()
        logger.info("Recent matches window synced.")
    finally:
        db.close()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


async def live_match_broadcaster():
    """Background task: sync live matches every 30s and push to WebSocket clients."""
    while True:
        await asyncio.sleep(settings.LIVE_UPDATE_INTERVAL)
        try:
            db = SessionLocal()
            try:
                match_service = MatchService(db)

                # One API call covers all competitions
                live_data = await football_data_service.fetch_all_live_matches()
                live_ext_ids = {m["id"] for m in live_data}

                # Detect matches the DB thinks are live but the API no longer reports as live.
                # Those matches just finished (or were suspended) — fetch their final status.
                db_live = (
                    db.query(match.Match)
                    .filter(match.Match.status.in_(["live", "half_time"]))
                    .all()
                )
                for db_match in db_live:
                    if db_match.external_id not in live_ext_ids:
                        detail = await football_data_service.fetch_match_details(
                            db_match.external_id
                        )
                        if detail:
                            await match_service.sync_matches([detail])

                if live_data:
                    await match_service.sync_matches(live_data)
                db.commit()

                # Only push to clients if anyone is connected
                if manager.active_connections:
                    live_matches = await match_service.get_live_matches()
                    payload = [m.model_dump() for m in live_matches]
                    await manager.broadcast({"type": "live_update", "matches": payload})
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Live broadcaster error: {e}")


async def today_match_syncer():
    """Background task: refresh a recent match window every 5 minutes across all leagues."""
    while True:
        await asyncio.sleep(300)  # 5 minutes
        try:
            await sync_recent_matches_window()
        except Exception as e:
            logger.error(f"Today sync error: {e}")


@app.on_event("startup")
async def startup_event():
    # Sync a recent window immediately on startup so finished games are corrected
    # even if the server was down during live play.
    try:
        await sync_recent_matches_window()
    except Exception as e:
        logger.error(f"Startup sync error: {e}")

    asyncio.create_task(live_match_broadcaster())
    asyncio.create_task(today_match_syncer())
    logger.info("FootyLive API started. Live broadcaster and today-syncer running.")


@app.get("/")
async def root():
    return {"message": "FootyLive API is running!", "version": "2.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
