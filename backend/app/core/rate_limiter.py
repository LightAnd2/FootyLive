from datetime import datetime, timedelta
from typing import Dict, Optional
import asyncio
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    """
    Rate limiter to control API calls and prevent hitting rate limits.
    Supports multiple rate limiting strategies:
    - Per-minute limits
    - Per-hour limits  
    - Per-day limits
    - Burst protection
    """
    
    def __init__(self):
        # Track API calls by time window
        self.calls_per_minute: Dict[str, list] = defaultdict(list)
        self.calls_per_hour: Dict[str, list] = defaultdict(list)
        self.calls_per_day: Dict[str, list] = defaultdict(list)
        
        self.minute_limit = 60
        self.hour_limit = 1000
        self.day_limit = 10000
        
        # Burst protection
        self.burst_limit = 10  # Max 10 calls in 10 seconds
        self.burst_window = 10  # 10 seconds
        
        # Cleanup interval
        self.cleanup_interval = 300  # 5 minutes
        self.last_cleanup = datetime.now()
    
    async def is_allowed(self, endpoint: str = "default") -> bool:
        """
        Check if API call is allowed based on rate limits.
        
        Args:
            endpoint: The API endpoint being called
            
        Returns:
            bool: True if call is allowed, False if rate limited
        """
        now = datetime.now()
        
        # Cleanup old entries periodically
        if (now - self.last_cleanup).total_seconds() > self.cleanup_interval:
            await self._cleanup_old_entries()
            self.last_cleanup = now
        
        # Check burst protection
        if not await self._check_burst_limit(endpoint, now):
            logger.warning(f"Burst limit exceeded for endpoint: {endpoint}")
            return False
        
        # Check minute limit
        if not await self._check_minute_limit(endpoint, now):
            logger.warning(f"Minute limit exceeded for endpoint: {endpoint}")
            return False
        
        # Check hour limit
        if not await self._check_hour_limit(endpoint, now):
            logger.warning(f"Hour limit exceeded for endpoint: {endpoint}")
            return False
        
        # Check day limit
        if not await self._check_day_limit(endpoint, now):
            logger.warning(f"Day limit exceeded for endpoint: {endpoint}")
            return False
        
        # Record the call
        await self._record_call(endpoint, now)
        return True
    
    async def _check_burst_limit(self, endpoint: str, now: datetime) -> bool:
        """Check if burst limit is exceeded."""
        cutoff = now - timedelta(seconds=self.burst_window)
        recent_calls = [
            call_time for call_time in self.calls_per_minute[endpoint]
            if call_time > cutoff
        ]
        return len(recent_calls) < self.burst_limit
    
    async def _check_minute_limit(self, endpoint: str, now: datetime) -> bool:
        """Check if minute limit is exceeded."""
        cutoff = now - timedelta(minutes=1)
        recent_calls = [
            call_time for call_time in self.calls_per_minute[endpoint]
            if call_time > cutoff
        ]
        return len(recent_calls) < self.minute_limit
    
    async def _check_hour_limit(self, endpoint: str, now: datetime) -> bool:
        """Check if hour limit is exceeded."""
        cutoff = now - timedelta(hours=1)
        recent_calls = [
            call_time for call_time in self.calls_per_hour[endpoint]
            if call_time > cutoff
        ]
        return len(recent_calls) < self.hour_limit
    
    async def _check_day_limit(self, endpoint: str, now: datetime) -> bool:
        """Check if day limit is exceeded."""
        cutoff = now - timedelta(days=1)
        recent_calls = [
            call_time for call_time in self.calls_per_day[endpoint]
            if call_time > cutoff
        ]
        return len(recent_calls) < self.day_limit
    
    async def _record_call(self, endpoint: str, now: datetime) -> None:
        """Record an API call."""
        self.calls_per_minute[endpoint].append(now)
        self.calls_per_hour[endpoint].append(now)
        self.calls_per_day[endpoint].append(now)
    
    async def _cleanup_old_entries(self) -> None:
        """Clean up old entries to prevent memory leaks."""
        now = datetime.now()
        cutoff_minute = now - timedelta(minutes=1)
        cutoff_hour = now - timedelta(hours=1)
        cutoff_day = now - timedelta(days=1)
        
        for endpoint in list(self.calls_per_minute.keys()):
            self.calls_per_minute[endpoint] = [
                call_time for call_time in self.calls_per_minute[endpoint]
                if call_time > cutoff_minute
            ]
            self.calls_per_hour[endpoint] = [
                call_time for call_time in self.calls_per_hour[endpoint]
                if call_time > cutoff_hour
            ]
            self.calls_per_day[endpoint] = [
                call_time for call_time in self.calls_per_day[endpoint]
                if call_time > cutoff_day
            ]
            
            # Remove empty entries
            if not any([
                self.calls_per_minute[endpoint],
                self.calls_per_hour[endpoint],
                self.calls_per_day[endpoint]
            ]):
                del self.calls_per_minute[endpoint]
                del self.calls_per_hour[endpoint]
                del self.calls_per_day[endpoint]
    
    async def get_usage_stats(self, endpoint: str = "default") -> Dict[str, int]:
        """Get current usage statistics for an endpoint."""
        now = datetime.now()
        
        minute_calls = len([
            call_time for call_time in self.calls_per_minute[endpoint]
            if call_time > now - timedelta(minutes=1)
        ])
        
        hour_calls = len([
            call_time for call_time in self.calls_per_hour[endpoint]
            if call_time > now - timedelta(hours=1)
        ])
        
        day_calls = len([
            call_time for call_time in self.calls_per_day[endpoint]
            if call_time > now - timedelta(days=1)
        ])
        
        return {
            "minute_calls": minute_calls,
            "minute_limit": self.minute_limit,
            "hour_calls": hour_calls,
            "hour_limit": self.hour_limit,
            "day_calls": day_calls,
            "day_limit": self.day_limit,
            "minute_remaining": self.minute_limit - minute_calls,
            "hour_remaining": self.hour_limit - hour_calls,
            "day_remaining": self.day_limit - day_calls
        }

# Global rate limiter instance
rate_limiter = RateLimiter()
