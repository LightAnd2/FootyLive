from fastapi import APIRouter, HTTPException
from app.core.rate_limiter import rate_limiter
from app.core.rate_config import RateLimitConfig
from typing import Dict, Any

router = APIRouter()

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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get usage stats: {str(e)}")

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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get rate limits: {str(e)}")

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
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "message": "Rate limiting system has issues"
        }
