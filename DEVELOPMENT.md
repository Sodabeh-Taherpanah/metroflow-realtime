# Development Guide

## Prerequisites

- Node.js 18+ (use `nvm` to manage versions)
- npm 9+
- Git
- Docker (optional)
- PostgreSQL 15+ (or use Docker)

## Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/metroflow.git
cd frontend
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Frontend: http://localhost:3000

### 3. Backend Setup

```bash
cd ../backend
npm install
cp .env.example .env
npm run dev
```

Backend: http://localhost:3001
Swagger: http://localhost:3001/api/docs

## Development Workflow

### Creating a Feature

1. Create branch from `develop`:

   ```bash
   git checkout develop
   git pull
   git checkout -b feature/feature-name
   ```

2. Make changes following project structure

3. Test locally:

   ```bash
   # Frontend
   npm run lint
   npm run type-check

   # Backend
   npm run lint
   npm run test
   ```

4. Format code:

   ```bash
   npm run format
   ```

5. Commit:

   ```bash
   git add .
   git commit -m "feat: add feature description"
   ```

6. Push and create Pull Request

### Code Style

#### Frontend

- Use TypeScript
- Follow ESLint rules
- Use absolute imports
- Component names in PascalCase
- File names in kebab-case
- Hooks in camelCase

#### Backend

- Use TypeScript strict mode
- Follow NestJS conventions
- Use dependency injection
- Service names: `*.service.ts`
- Controller names: `*.controller.ts`
- Module names: `*.module.ts`

### Testing

#### Frontend

```bash
npm run test
npm run test:watch
```

#### Backend

```bash
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
```

## Docker Development

### Build Images

```bash
docker build -t metroflow-frontend:dev -f frontend.Dockerfile .
docker build -t metroflow-backend:dev backend/
```

### Run Services

```bash
docker-compose up
```

### Stop Services

```bash
docker-compose down
```

## Database Management

### Create Migration

```bash
cd backend
npm run typeorm migration:generate -- -n CreateUsersTable
```

### Run Migrations

```bash
npm run typeorm migration:run
```

### Revert Migration

```bash
npm run typeorm migration:revert
```

## Debugging

### Frontend

- Use Chrome DevTools
- Install React Developer Tools
- Set breakpoints in VS Code

### Backend

```bash
npm run debug
# Then open chrome://inspect in Chrome
```

## Common Issues

### Port Already in Use

```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database Connection Error

Check `.env` file and ensure PostgreSQL is running:

```bash
docker-compose ps
```

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Useful Commands

### Frontend

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Run production build
npm run lint             # Check code style
npm run format           # Format code
npm run type-check       # TypeScript check
```

### Backend

```bash
npm run dev              # Start with watch
npm run build            # Compile TypeScript
npm run start            # Run production build
npm run lint             # Check code style
npm run test             # Run tests
npm run test:watch       # Watch mode tests
npm run test:cov         # Coverage report
npm run debug            # Debug mode
```

## Resources

- [Next.js 15 Docs](https://nextjs.org/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [ShadCN UI](https://ui.shadcn.com)
