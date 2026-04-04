"""
Rate limiting configuration for different API plans and environments.
"""
import os
from typing import Dict, Any

class RateLimitConfig:
    """Configuration for rate limiting based on environment and API plan."""

    DEFAULT_LIMITS = {
        "minute_limit": 30,
        "hour_limit": 500,
        "day_limit": 5000,
        "burst_limit": 5,
        "burst_window": 10,
    }

    PRODUCTION_LIMITS = {
        "minute_limit": 60,
        "hour_limit": 1000,
        "day_limit": 10000,
        "burst_limit": 10,
        "burst_window": 10,
    }

    PREMIUM_LIMITS = {
        "minute_limit": 120,
        "hour_limit": 2000,
        "day_limit": 20000,
        "burst_limit": 20,
        "burst_window": 10,
    }

    @classmethod
    def get_limits(cls) -> Dict[str, Any]:
        """Get rate limits based on environment variables."""
        environment = os.getenv("ENVIRONMENT", "development").lower()
        api_plan = os.getenv("API_PLAN", "default").lower()

        if environment == "production":
            if api_plan == "premium":
                return cls.PREMIUM_LIMITS
            return cls.PRODUCTION_LIMITS

        return cls.DEFAULT_LIMITS

    @classmethod
    def get_endpoint_limits(cls) -> Dict[str, Dict[str, Any]]:
        """Get specific rate limits for different endpoints."""
        base_limits = cls.get_limits()

        return {
            "matches": {
                **base_limits,
                "minute_limit": base_limits["minute_limit"] // 2,
            },
            "teams": {
                **base_limits,
                "minute_limit": base_limits["minute_limit"] // 3,
            },
            "players": {
                **base_limits,
                "minute_limit": base_limits["minute_limit"] // 4,
            },
            "live": {
                **base_limits,
                "minute_limit": base_limits["minute_limit"] // 2,
            },
            "default": base_limits
        }

    @classmethod
    def get_retry_after(cls, limit_type: str = "minute") -> int:
        """Get retry-after time in seconds based on limit type."""
        retry_times = {
            "burst": 10,
            "minute": 60,
            "hour": 3600,
            "day": 86400,
        }
        return retry_times.get(limit_type, 60)
