import json
import logging
from typing import Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    import redis.asyncio as aioredis
    _redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    REDIS_AVAILABLE = True
except Exception:
    _redis_client = None
    REDIS_AVAILABLE = False


async def cache_get(key: str) -> Optional[Any]:
    if not REDIS_AVAILABLE or _redis_client is None:
        return None
    try:
        value = await _redis_client.get(key)
        return json.loads(value) if value else None
    except Exception as e:
        logger.debug(f"Cache get failed for {key}: {e}")
        return None


async def cache_set(key: str, value: Any, ttl: int = settings.CACHE_TTL) -> None:
    if not REDIS_AVAILABLE or _redis_client is None:
        return
    try:
        await _redis_client.setex(key, ttl, json.dumps(value, default=str))
    except Exception as e:
        logger.debug(f"Cache set failed for {key}: {e}")


async def cache_delete(key: str) -> None:
    if not REDIS_AVAILABLE or _redis_client is None:
        return
    try:
        await _redis_client.delete(key)
    except Exception as e:
        logger.debug(f"Cache delete failed for {key}: {e}")
