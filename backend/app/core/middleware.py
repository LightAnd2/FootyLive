from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import time
import logging
from .rate_limiter import rate_limiter

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware to apply rate limiting to all API endpoints.
    """
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks and static files
        if request.url.path in ["/health", "/docs", "/openapi.json", "/favicon.ico"]:
            return await call_next(request)
        
        # Extract endpoint identifier
        endpoint = f"{request.method}:{request.url.path}"
        
        # Check rate limit
        if not await rate_limiter.is_allowed(endpoint):
            logger.warning(f"Rate limit exceeded for {endpoint}")
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": "Too many requests. Please try again later.",
                    "retry_after": 60  # seconds
                },
                headers={"Retry-After": "60"}
            )
        
        # Add rate limit headers to response
        response = await call_next(request)
        
        # Get usage stats and add headers
        stats = await rate_limiter.get_usage_stats(endpoint)
        response.headers["X-RateLimit-Limit-Minute"] = str(stats["minute_limit"])
        response.headers["X-RateLimit-Remaining-Minute"] = str(stats["minute_remaining"])
        response.headers["X-RateLimit-Limit-Hour"] = str(stats["hour_limit"])
        response.headers["X-RateLimit-Remaining-Hour"] = str(stats["hour_remaining"])
        response.headers["X-RateLimit-Limit-Day"] = str(stats["day_limit"])
        response.headers["X-RateLimit-Remaining-Day"] = str(stats["day_remaining"])
        
        return response

def rate_limit(endpoint: str = "default"):
    """
    Decorator to apply rate limiting to specific endpoints.
    
    Usage:
        @rate_limit("matches")
        async def get_matches():
            ...
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            if not await rate_limiter.is_allowed(endpoint):
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "Rate limit exceeded",
                        "message": f"Too many requests for {endpoint}. Please try again later.",
                        "retry_after": 60
                    }
                )
            return await func(*args, **kwargs)
        return wrapper
    return decorator
