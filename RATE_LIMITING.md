# Rate Limiting System

This document describes the rate limiting system implemented in FootyLive to manage API calls and prevent hitting rate limits.

## Overview

The rate limiting system provides multiple layers of protection:
- **Burst Protection**: Prevents rapid-fire requests
- **Per-minute Limits**: Controls short-term usage
- **Per-hour Limits**: Manages medium-term usage  
- **Per-day Limits**: Prevents long-term overuse

## Configuration

### Environment Variables

Set these environment variables to configure rate limits:

```bash
# Environment (development/production)
ENVIRONMENT=development

# API Plan (default/premium)
API_PLAN=default
```

### Rate Limit Tiers

#### Development (Default)
- **Minute**: 30 calls
- **Hour**: 500 calls
- **Day**: 5,000 calls
- **Burst**: 5 calls in 10 seconds

#### Production
- **Minute**: 60 calls
- **Hour**: 1,000 calls
- **Day**: 10,000 calls
- **Burst**: 10 calls in 10 seconds

#### Premium
- **Minute**: 120 calls
- **Hour**: 2,000 calls
- **Day**: 20,000 calls
- **Burst**: 20 calls in 10 seconds

## API Endpoints

### Rate Limit Monitoring

#### Get Usage Statistics
```http
GET /api/rate-limit/usage
```

Response:
```json
{
  "current_usage": {
    "minute_calls": 15,
    "minute_limit": 30,
    "hour_calls": 250,
    "hour_limit": 500,
    "day_calls": 1200,
    "day_limit": 5000,
    "minute_remaining": 15,
    "hour_remaining": 250,
    "day_remaining": 3800
  },
  "limits": {
    "minute_limit": 30,
    "hour_limit": 500,
    "day_limit": 5000,
    "burst_limit": 5,
    "burst_window": 10
  },
  "status": "healthy"
}
```

#### Get Rate Limits Configuration
```http
GET /api/rate-limit/limits
```

#### Health Check
```http
GET /api/rate-limit/health
```

## Rate Limit Headers

All API responses include rate limit headers:

```http
X-RateLimit-Limit-Minute: 30
X-RateLimit-Remaining-Minute: 15
X-RateLimit-Limit-Hour: 500
X-RateLimit-Remaining-Hour: 250
X-RateLimit-Limit-Day: 5000
X-RateLimit-Remaining-Day: 3800
```

## Error Responses

When rate limits are exceeded:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60

{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retry_after": 60
}
```

## Frontend Integration

The frontend displays rate limit status in the header:
- **Green**: Healthy usage (< 50% of limit)
- **Yellow**: Moderate usage (20-50% of limit)
- **Red**: High usage (> 80% of limit)

## Implementation Details

### Backend Components

1. **RateLimiter** (`app/core/rate_limiter.py`)
   - Core rate limiting logic
   - Tracks calls by time windows
   - Automatic cleanup of old entries

2. **RateLimitMiddleware** (`app/core/middleware.py`)
   - FastAPI middleware
   - Applies rate limiting to all endpoints
   - Adds rate limit headers to responses

3. **RateLimitConfig** (`app/core/rate_config.py`)
   - Configuration management
   - Environment-based limits
   - Endpoint-specific limits

4. **Rate Limit API** (`app/api/rate_limit.py`)
   - Monitoring endpoints
   - Usage statistics
   - Health checks

### Frontend Components

1. **RateLimitStatus** (`src/components/RateLimitStatus.tsx`)
   - Real-time usage display
   - Color-coded status indicators
   - Auto-refresh every 30 seconds

## Customization

### Adjusting Limits

Edit `app/core/rate_config.py` to modify limits:

```python
DEFAULT_LIMITS = {
    "minute_limit": 30,      # Adjust as needed
    "hour_limit": 500,       # Adjust as needed
    "day_limit": 5000,       # Adjust as needed
    "burst_limit": 5,        # Adjust as needed
    "burst_window": 10,      # Adjust as needed
}
```

### Endpoint-Specific Limits

Different endpoints can have different limits:

```python
def get_endpoint_limits(cls) -> Dict[str, Dict[str, Any]]:
    return {
        "matches": {
            "minute_limit": 15,  # More restrictive
        },
        "teams": {
            "minute_limit": 10,  # Even more restrictive
        },
        "players": {
            "minute_limit": 5,   # Most restrictive
        }
    }
```

## Monitoring

### Logs

Rate limit violations are logged:
```
WARNING: Rate limit exceeded for endpoint: matches
WARNING: Minute limit exceeded for endpoint: teams
```

### Metrics

Monitor these metrics:
- Rate limit violations per endpoint
- Average response time
- API usage patterns
- Peak usage times

## Best Practices

1. **Monitor Usage**: Check rate limit status regularly
2. **Implement Caching**: Reduce API calls with caching
3. **Batch Requests**: Combine multiple requests when possible
4. **Error Handling**: Handle 429 responses gracefully
5. **User Feedback**: Inform users about rate limits

## Troubleshooting

### Common Issues

1. **Rate Limit Exceeded**
   - Check current usage with `/api/rate-limit/usage`
   - Wait for the retry-after period
   - Consider upgrading API plan

2. **High Memory Usage**
   - Rate limiter automatically cleans old entries
   - Adjust cleanup interval if needed

3. **False Positives**
   - Check burst protection settings
   - Verify endpoint-specific limits

### Debug Mode

Enable debug logging:
```python
import logging
logging.getLogger("app.core.rate_limiter").setLevel(logging.DEBUG)
```
