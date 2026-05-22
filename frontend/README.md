# MetroFlow Frontend

Simple web app for real-time transit monitoring.

This frontend is built with Next.js + TypeScript and connects to the backend through `/api` proxy routes.

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Run dev server

```bash
npm run dev
```

3. Open

- http://localhost:3000

## Web App Flow

This is the normal page flow in the frontend:

1. Home (`/`)

- Entry page and quick navigation to core modules.

2. Dashboard (`/dashboard`)

- High-level system health and service status.

3. Map (`/map`)

- Live vehicle movement and station view.

4. Departures (`/departures`)

- Station departure board with near real-time updates.

5. Stations (`/stations`)

- Station list and provider status checks.

6. Tracking (`/tracking`)

- Operations workflow:
- ingest route data,
- run simulation,
- inspect logs and active agents.

7. Charts (`/charts`)

- Summary analytics from tracking data (activity and counts).

## How Data Flows

1. Frontend sends requests to `/api/...`.
2. Next.js rewrites proxy these calls to backend (`http://localhost:3001/api/...`).
3. Backend returns REST data and websocket updates.
4. Pages refresh with React Query polling or live events.

## Main Frontend Stack

1. Next.js (App Router)
2. React Query
3. Axios API client
4. Recharts and map components

## Notes

1. Frontend default port: `3000`
2. Backend default port: `3001`
3. If API calls fail, first check backend is running and proxy rewrite is correct.
