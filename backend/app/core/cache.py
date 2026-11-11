import json
import logging
import time
from typing import Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Process-local fallback cache: key -> (value, expires_at)
_mem_cache: dict[str, tuple[Any, float]] = {}

# Redis is only considered available after init_cache() confirms a successful
# PING. Until then (and whenever a Redis call fails at runtime) we use _mem_cache.
_redis_client = None
REDIS_AVAILABLE = False


async def init_cache(ping_timeout: float = 2.0) -> bool:
    """Probe Redis once at startup. Returns True if Redis is reachable.

    Safe to call when the redis package is missing or the server is down; in
    both cases the in-memory cache is used instead.
    """
    global _redis_client, REDIS_AVAILABLE
    try:
        import redis.asyncio as aioredis
        client = aioredis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=ping_timeout,
            socket_timeout=ping_timeout,
        )
        await client.ping()
    except Exception as e:
        logger.info(f"Redis unavailable ({e.__class__.__name__}); using in-memory cache")
        _redis_client = None
        REDIS_AVAILABLE = False
        return False

    _redis_client = client
    REDIS_AVAILABLE = True
    logger.info(f"Redis cache connected at {settings.REDIS_URL}")
    return True


def _mem_get(key: str) -> Optional[Any]:
    entry = _mem_cache.get(key)
    if entry is None:
        return None
    value, expires_at = entry
    if time.time() < expires_at:
        return value
    _mem_cache.pop(key, None)
    return None


def _mem_set(key: str, value: Any, ttl: int) -> None:
    _mem_cache[key] = (value, time.time() + ttl)


async def cache_get(key: str) -> Optional[Any]:
    if REDIS_AVAILABLE and _redis_client is not None:
        try:
            value = await _redis_client.get(key)
            if value is not None:
                return json.loads(value)
        except Exception as e:
            logger.debug(f"Redis get failed for {key}, falling back to memory: {e}")
    return _mem_get(key)


async def cache_set(key: str, value: Any, ttl: int = settings.CACHE_TTL) -> None:
    if REDIS_AVAILABLE and _redis_client is not None:
        try:
            await _redis_client.setex(key, ttl, json.dumps(value, default=str))
            return
        except Exception as e:
            logger.debug(f"Redis set failed for {key}, falling back to memory: {e}")
    _mem_set(key, value, ttl)


async def cache_delete(key: str) -> None:
    _mem_cache.pop(key, None)
    if not REDIS_AVAILABLE or _redis_client is None:
        return
    try:
        await _redis_client.delete(key)
    except Exception as e:
        logger.debug(f"Redis delete failed for {key}: {e}")
