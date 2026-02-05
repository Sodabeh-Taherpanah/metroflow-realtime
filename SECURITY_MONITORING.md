Backend install (optional — run in backend folder):

```bash
cd backend
npm install @nestjs/throttler@^5.0.0 @nestjs/terminus@^10.0.0 @sentry/node prom-client helmet
```

Frontend install (optional — run in frontend folder):

```bash
cd frontend
# Sentry is already present in package.json; if not:
# npm install @sentry/nextjs
```

Notes:

- The code uses guarded requires for Sentry and prom-client; startup will not fail if those packages are not installed, but features will be disabled.
- For production HTTPS enforcement, set `ENFORCE_HTTPS=true` and ensure a proper proxy sets `X-Forwarded-Proto`.
- The Next.js middleware rate limiter is an in-memory example for dev; use a shared store (Redis) for production.
- To enable NestJS throttling, install `@nestjs/throttler`.

Quick commands:

```bash
# Start backend
cd backend
npm run dev

# Start frontend
cd frontend
npm run dev
```
