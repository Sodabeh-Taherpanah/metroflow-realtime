# MetroFlow

MetroFlow is a real-time transit web app.

In simple words:

- Riders can see stations, departures, and moving vehicles.
- Ops and admin users can ingest routes, run simulation, and monitor service health.

## What This Project Does

1. Shows real-time transit data on map and departures pages.
2. Ingests route files (GTFS/GPX).
3. Runs simulator agents to replay movement.
4. Tracks agent history and summary charts.
5. Checks provider and backend health.

## Web App Flow (Main)

Use this order when you demo the app:

1. Home (/)

- Start point and navigation.

2. Dashboard (/dashboard)

- Quick service and health overview.

3. Map (/map)

- Live agents and stations.

4. Departures (/departures)

- Real-time departures with reliability context.

5. Stations (/stations)

- Station list plus station insights and provider health.

6. Tracking (/tracking)

- Admin flow: ingest route, run simulator, inspect logs and agents.

7. Charts (/charts)

- Product KPIs, delay impact, coverage by zone, and activity trends.

## Data Flow (Simple)

1. Frontend calls /api/...
2. Next.js proxy rewrites to backend at http://localhost:3001/api/...
3. Backend reads and writes PostgreSQL and Redis.
4. Frontend updates via REST polling and websocket events.

## Tech Stack

1. Frontend: Next.js, TypeScript, React Query.
2. Backend: NestJS, TypeORM.
3. Data: PostgreSQL and Redis.

## Run Locally

1. Start infra

```bash
docker compose up -d redis postgres
```

2. Start backend

```bash
cd backend
npm install
npm run dev
```

3. Start frontend

```bash
cd frontend
npm install
npm run dev
```

4. Open

- App: http://localhost:3000
- API: http://localhost:3001
- API docs: http://localhost:3001/api/docs

## Product Value Additions (UI-First)

1. Service coverage by zone.
2. Delay impact and passengers affected.
3. Estimated delay cost avoided.
4. Monthly report preview cards.
5. Rich departures with transfer and reliability hints.
6. Station insight text for business context.

## Quick Interview Pitch

MetroFlow is a dual-surface transit product: rider experience plus operations control. Riders get real-time map and departures. Operations teams get ingest, simulation, tracking, and health tools to validate quality before release.

## Notes

1. For realistic Berlin demos, ingest a Berlin GPX and run simulator with that route.
2. Trace charts require ENABLE_TRACES=true on backend.
