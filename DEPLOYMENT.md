# Deployment Guide

## Frontend Deployment (Vercel)

### Prerequisites

- Vercel account
- GitHub repository connected

### Steps

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "New Project"
3. Select your repository
4. Configure:
   - Framework: Next.js
   - Root Directory: `metroflow`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.metroflow.app
   NEXT_PUBLIC_WS_URL=wss://api.metroflow.app
   ```
6. Deploy

### Custom Domain

1. Go to project settings
2. Domains tab
3. Add custom domain
4. Update DNS records

### Preview URLs

- Main: `metroflow.vercel.app`
- PRs: `metroflow-[branch].vercel.app`

## Backend Deployment (Railway/Render)

### Option 1: Railway

1. Go to [Railway](https://railway.app)
2. Create new project
3. Connect GitHub repository
4. Configure:
   - Root Directory: `backend`
   - Build Command: `npm run build`
   - Start Command: `npm run start`
5. Add Environment Variables
6. Deploy

### Option 2: Render

1. Go to [Render](https://render.com)
2. Create New > Web Service
3. Connect GitHub
4. Configure:
   - Name: `metroflow-api`
   - Runtime: `Node`
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `node dist/main`
5. Add Environment Variables
6. Deploy

## Database Setup

### PostgreSQL (Railway/Render)

1. Add PostgreSQL database
2. Get connection string
3. Update `DATABASE_URL` in backend env vars

### Alternative: External Database

- AWS RDS
- DigitalOcean Managed
- Render PostgreSQL

## Environment Variables

### Frontend (Vercel)

```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_WS_URL
NEXT_PUBLIC_SENTRY_AUTH_TOKEN
SENTRY_ORG
SENTRY_PROJECT
```

### Backend (Railway/Render)

```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=change-in-production
LOG_LEVEL=info
SENTRY_DSN=...
```

## Monitoring & Analytics

### Frontend

- Vercel Analytics (automatic)
- Sentry (configure with DSN)

### Backend

- Sentry (configure with DSN)
- Custom logging

### Database

- Backups (automatic on Render/Railway)
- Connection pooling

## CI/CD with GitHub Actions

The `.github/workflows/ci-cd.yml` file handles:

- Linting
- Type checking
- Building
- Testing
- Deployment (on merge to main)

## Security Checklist

- [ ] Enable branch protection on `main`
- [ ] Require PR reviews
- [ ] Enable status checks
- [ ] Configure Dependabot
- [ ] Set up Sentry DSN
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set secure database passwords
- [ ] Enable backups

## Performance Optimization

### Frontend

- Image optimization with Next.js Image
- Code splitting
- Route prefetching
- Response compression

### Backend

- Database indexing
- Redis caching
- Connection pooling
- Load balancing

## Scaling

### Horizontal Scaling

- Multiple backend instances
- Load balancer (Railway/Render handles this)
- Shared Redis instance

### Vertical Scaling

- Increase server resources
- Database optimization
- Query caching

## Rollback Procedure

### Frontend

```bash
vercel rollback
```

### Backend

In Railway/Render dashboard:

1. Go to Deployments
2. Select previous deployment
3. Click Rollback

## Monitoring Dashboards

- Vercel: https://vercel.com/dashboard
- Railway: https://railway.app/dashboard
- Render: https://dashboard.render.com
- Sentry: https://sentry.io/

## Support

- Issues: GitHub Issues
- Community: Discussions
- Documentation: `/docs`
