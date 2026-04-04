import os
from pydantic_settings import BaseSettings


def _split_env_list(raw: str | None, default: list[str]) -> list[str]:
    if not raw:
        return default
    return [item.strip() for item in raw.split(",") if item.strip()]


DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

DEFAULT_ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
]

class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "FootyLive"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Database
    DATABASE_URL: str = "sqlite:///./footylive.db"

    # football-data.org API (free tier — https://www.football-data.org)
    FOOTBALL_DATA_API_KEY: str = os.getenv("FOOTBALL_DATA_API_KEY", "")
    FOOTBALL_DATA_BASE_URL: str = "https://api.football-data.org/v4"
    PREMIER_LEAGUE_CODE: str = "PL"
    PREMIER_LEAGUE_ID: int = 2021  # football-data.org league ID for Premier League

    # Redis (for caching)
    REDIS_URL: str = "redis://localhost:6379"

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = _split_env_list(
        os.getenv("BACKEND_CORS_ORIGINS"),
        DEFAULT_CORS_ORIGINS,
    )
    ALLOWED_HOSTS: list[str] = _split_env_list(
        os.getenv("ALLOWED_HOSTS"),
        DEFAULT_ALLOWED_HOSTS,
    )
    DOCS_ENABLED: bool = os.getenv(
        "DOCS_ENABLED",
        "true" if os.getenv("ENVIRONMENT", "development").lower() == "development" else "false",
    ).lower() in {"1", "true", "yes", "on"}

    # Update intervals
    LIVE_UPDATE_INTERVAL: int = 30  # seconds
    CACHE_TTL: int = 60  # seconds (shorter for live data)

    class Config:
        env_file = ".env"

settings = Settings()
