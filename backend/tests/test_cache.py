"""Cache fallback behaviour when Redis is unreachable."""
import pytest

from app.core import cache


@pytest.fixture(autouse=True)
def reset_cache_state(monkeypatch):
    cache._mem_cache.clear()
    monkeypatch.setattr(cache, "_redis_client", None)
    monkeypatch.setattr(cache, "REDIS_AVAILABLE", False)
    yield
    cache._mem_cache.clear()


async def test_init_cache_falls_back_when_redis_unreachable(monkeypatch):
    # Point at a port nothing listens on so the PING fails fast.
    monkeypatch.setattr(cache.settings, "REDIS_URL", "redis://127.0.0.1:1")
    assert await cache.init_cache(ping_timeout=0.5) is False
    assert cache.REDIS_AVAILABLE is False
    assert cache._redis_client is None


async def test_set_then_get_roundtrips_with_redis_unavailable(monkeypatch):
    monkeypatch.setattr(cache.settings, "REDIS_URL", "redis://127.0.0.1:1")
    await cache.init_cache(ping_timeout=0.5)

    await cache.cache_set("standings:PL", {"table": [1, 2, 3]}, ttl=60)
    assert await cache.cache_get("standings:PL") == {"table": [1, 2, 3]}


async def test_runtime_redis_failure_falls_back_to_memory(monkeypatch):
    class BrokenRedis:
        async def get(self, key):
            raise ConnectionError("redis down")

        async def setex(self, key, ttl, value):
            raise ConnectionError("redis down")

        async def delete(self, key):
            raise ConnectionError("redis down")

    # Simulate Redis that was healthy at startup but died afterwards.
    monkeypatch.setattr(cache, "_redis_client", BrokenRedis())
    monkeypatch.setattr(cache, "REDIS_AVAILABLE", True)

    await cache.cache_set("scorers:PL:20", {"scorers": ["a"]}, ttl=60)
    assert await cache.cache_get("scorers:PL:20") == {"scorers": ["a"]}

    await cache.cache_delete("scorers:PL:20")
    assert await cache.cache_get("scorers:PL:20") is None


async def test_expired_memory_entry_is_not_returned(monkeypatch):
    now = {"t": 1_000.0}
    monkeypatch.setattr(cache.time, "time", lambda: now["t"])

    await cache.cache_set("bracket:CL", {"rounds": []}, ttl=10)
    assert await cache.cache_get("bracket:CL") == {"rounds": []}

    now["t"] += 11
    assert await cache.cache_get("bracket:CL") is None
