import json
import logging
import time
from typing import Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

_mem_cache: dict[str, tuple[Any, float]] = {}

try:
    import redis.asyncio as aioredis
    _redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    REDIS_AVAILABLE = True
except Exception:
    _redis_client = None
    REDIS_AVAILABLE = False


async def cache_get(key: str) -> Optional[Any]:
    if REDIS_AVAILABLE and _redis_client is not None:
        try:
            value = await _redis_client.get(key)
            return json.loads(value) if value else None
        except Exception as e:
            logger.debug(f"Cache get failed for {key}: {e}")
            return None
    entry = _mem_cache.get(key)
    if entry and time.time() < entry[1]:
        return entry[0]
    return None


async def cache_set(key: str, value: Any, ttl: int = settings.CACHE_TTL) -> None:
    if REDIS_AVAILABLE and _redis_client is not None:
        try:
            await _redis_client.setex(key, ttl, json.dumps(value, default=str))
            return
        except Exception as e:
            logger.debug(f"Cache set failed for {key}: {e}")
    _mem_cache[key] = (value, time.time() + ttl)


async def cache_delete(key: str) -> None:
    _mem_cache.pop(key, None)
    if not REDIS_AVAILABLE or _redis_client is None:
        return
    try:
        await _redis_client.delete(key)
    except Exception as e:
        logger.debug(f"Cache delete failed for {key}: {e}")
