# Backend Architecture

## Project Structure

```
backend/
├── src/
│   ├── app.module.ts       # Root module
│   ├── app.controller.ts   # Root controller
│   ├── app.service.ts      # Root service
│   ├── main.ts             # Application entry
│   ├── modules/
│   │   ├── providers/      # External API providers (VBB, BVG, DB)
│   │   ├── stations/       # Station management
│   │   ├── routes/         # Route management
│   │   └── realtime/       # Real-time updates (WebSocket)
│   └── common/
│       ├── filters/        # Exception filters
│       ├── guards/         # Route guards
│       ├── interceptors/   # Request/response interceptors
│       ├── logger/         # Logging service
│       └── config/         # Configuration
├── test/
├── Dockerfile
└── package.json
```

## Module Architecture

### Providers Module

Integrates with external transport data providers:

- VBB (Verkehrsverbund Berlin-Brandenburg)
- BVG (Berliner Verkehrsbetriebe)
- DB (Deutsche Bahn)

### Stations Module

- `GET /stations` - List all stations
- `GET /stations/:id` - Get station details
- `POST /stations` - Create station
- `PUT /stations/:id` - Update station

### Routes Module

- Route planning and optimization
- Fare calculation
- Journey suggestions

### Realtime Module

WebSocket gateway for real-time transport updates:

- Subscribe to station updates
- Stream live vehicle locations
- Receive delay notifications

## Key Features

### 1. Modular Architecture

Each feature is isolated in its own module with:

- Controller
- Service
- DTO (Data Transfer Object)
- Entity

### 2. Validation

- Class-validator for request validation
- Zod for complex validations
- Global validation pipe

### 3. Error Handling

- Global exception filter
- Custom HTTP exceptions
- Centralized error logging

### 4. Logging

- Pino for structured logging
- Request/response logging
- Error stack traces

### 5. Documentation

- Swagger/OpenAPI docs
- Auto-generated API documentation
- Interactive API explorer

### 6. Security

- Helmet for security headers
- JWT authentication (ready)
- Rate limiting (ready)
- CORS configuration

## Development

### Starting Development Server

```bash
npm run dev
```

### Running Tests

```bash
npm run test
npm run test:watch
npm run test:cov
```

### Building

```bash
npm run build
npm run prod
```

## API Documentation

Visit `http://localhost:3001/api/docs` for interactive Swagger documentation.

## Database

### Setup

```bash
npm run typeorm migration:generate -- -n InitialSchema
npm run typeorm migration:run
```

### Entities

Define database entities in `src/modules/*/entities/` folder.

## Cron Jobs

Schedule background tasks:

- GTFS-RT data refresh
- Cache invalidation
- Data synchronization

## Deployment

### Docker

```bash
docker build -t metroflow-backend .
docker run -p 3001:3001 metroflow-backend
```

### Environment Variables

Create `.env` file (see `.env.example`)

### Platforms

- Railway
- Render
- AWS
- GCP
- DigitalOcean
