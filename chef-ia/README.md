# Chef IA - Machine de Guerre

Chef IA is a standalone project, similar to analytics-lottery, focused on recipe intelligence from kitchen ingredients.

## Included
- Backend FastAPI (`chef-ia/backend`) with scoring engine and SQLite tracking
- Frontend React + Vite (`chef-ia/frontend`) with modern dashboard and recommendations UI
- One-click launcher: `chef-ia/START_ALL.bat`

## Features
- Ingredient normalization and matching
- "Photo note" ingredient extraction (MVP text parser)
- Recipe recommendations with confidence score, prep time, and reasoning
- History + stats from local SQLite database
- Responsive interface for desktop and mobile

## Run
1. Backend deps:
   - `cd chef-ia/backend`
   - `C:\Darknexus-main\analytics-lottery\backend\venv\Scripts\pip.exe install -r requirements.txt`
2. Frontend deps:
   - `cd chef-ia/frontend`
   - `npm install`
3. Start all:
   - Double-click `chef-ia/START_ALL.bat`

## Ports
- Backend: `5002`
- Frontend: `5174`

## API endpoints
- `GET /health`
- `POST /api/analyze-ingredients`
- `POST /api/analyze-photo`
- `GET /api/history?limit=10`
- `GET /api/stats`
