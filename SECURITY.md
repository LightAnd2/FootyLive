# Security Guide

Keep secrets out of the repo.

## Never Commit

- `.env`
- `backend/.env`
- `frontend/.env`
- files containing API keys or tokens

## Required Backend Variables

```env
FOOTBALL_DATA_API_KEY=your_api_key_here
ENVIRONMENT=development
API_PLAN=default
DATABASE_URL=sqlite:///./footylive.db
```

## Checks

```bash
git status
git check-ignore backend/.env
git ls-files | grep -E "\\.(env|key|pem)$"
```

## If a Secret Was Committed

1. Remove it from the repo history.
2. Rotate the exposed key immediately.
3. Verify the replacement secret is only stored in environment variables.

## Production Notes

- Use your host's secret manager or environment variable system.
- Use a separate production API key.
- Audit the repo regularly for committed secrets.
