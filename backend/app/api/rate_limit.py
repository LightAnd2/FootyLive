import logging
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.core.rate_config import RateLimitConfig
from app.core.rate_limiter import rate_limiter

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/usage")
async def get_rate_limit_usage() -> Dict[str, Any]:
    """
    Get current rate limit usage statistics.
    """
    try:
        stats = await rate_limiter.get_usage_stats()
        limits = RateLimitConfig.get_limits()
        
        return {
            "current_usage": stats,
            "limits": limits,
            "status": "healthy" if stats["minute_remaining"] > 0 else "rate_limited"
        }
    except Exception:
        logger.exception("Failed to get rate limit usage stats")
        raise HTTPException(status_code=500, detail="Failed to get usage stats")

@router.get("/limits")
async def get_rate_limits() -> Dict[str, Any]:
    """
    Get current rate limits configuration.
    """
    try:
        limits = RateLimitConfig.get_limits()
        endpoint_limits = RateLimitConfig.get_endpoint_limits()
        
        return {
            "global_limits": limits,
            "endpoint_limits": endpoint_limits,
            "environment": {
                "env": "production" if limits["minute_limit"] >= 60 else "development",
                "plan": "premium" if limits["minute_limit"] >= 120 else "default"
            }
        }
    except Exception:
        logger.exception("Failed to get rate limit configuration")
        raise HTTPException(status_code=500, detail="Failed to get rate limits")

@router.get("/health")
async def rate_limit_health() -> Dict[str, Any]:
    """
    Health check for rate limiting system.
    """
    try:
        test_allowed = await rate_limiter.is_allowed("health_check")
        stats = await rate_limiter.get_usage_stats()
        
        return {
            "status": "healthy",
            "rate_limiter_working": test_allowed,
            "current_usage": stats,
            "message": "Rate limiting system is operational"
        }
    except Exception:
        logger.exception("Rate limiting health check failed")
        return {
            "status": "unhealthy",
            "error": "Rate limiting system unavailable",
            "message": "Rate limiting system has issues"
        }
