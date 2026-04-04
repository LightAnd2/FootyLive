# API Setup Guide

FootyLive uses `football-data.org`.

## Quick Setup

### Automated
```bash
cd /Users/andrew/Desktop/FootyLive
python3 setup_api.py
```

### Manual
Create `backend/.env`:
```env
FOOTBALL_DATA_API_KEY=your_actual_api_key_here
ENVIRONMENT=development
API_PLAN=default
```

Get a key from:
- [football-data.org](https://www.football-data.org/)

## Run the App

### Backend
```bash
cd backend
python3 -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd frontend
npm run dev
```

### URLs
- Frontend: `http://127.0.0.1:5173`
- API docs: `http://127.0.0.1:8000/api/docs`
- Rate limits: `http://127.0.0.1:8000/api/rate-limit/usage`

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `FOOTBALL_DATA_API_KEY` | Your `football-data.org` API key | Required |
| `ENVIRONMENT` | `development` or `production` | `development` |
| `API_PLAN` | `default` or `premium` | `default` |

## Test the Setup

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/rate-limit/usage
curl "http://127.0.0.1:8000/api/matches/live?competition=PL"
```

## Notes

- Run `POST /api/matches/sync` to populate the local database.
- The free plan supports fixtures, standings, scorers, and basic match detail.
- The free plan does not include lineups or rich match stats like possession and shots.
