# Testing Guide for project

## Frontend Testing

### Unit Tests

```bash
npm run test
npm run test:watch
```

### E2E Tests

```bash
npm run test:e2e
```

### Coverage Report

```bash
npm run test:cov
```

## Backend Testing

### Unit Tests

```bash
npm run test
npm run test:watch
```

### E2E Tests

```bash
npm run test:e2e
```

### Coverage Report

```bash
npm run test:cov
```

## Test Structure

### Frontend (Jest + React Testing Library)

```
frontend/
└── __tests__/
    ├── components/
    ├── hooks/
    └── utils/
```

### Backend (Jest + Supertest)

```
backend/
└── test/
    ├── units/
    ├── e2e/
    └── fixtures/
```

## Writing Tests

### Frontend Component Test

```typescript
import { render, screen } from '@testing-library/react';
import Button from '@/components/ui/button';

describe('Button', () => {
  it('renders button text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### Backend Controller Test

```typescript
import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = module.get(AppController);
    service = module.get(AppService);
  });

  it('should return hello', () => {
    expect(controller.getHello()).toHaveProperty('message');
  });
});
```

## CI/CD Testing

Tests run automatically on:

- Pull requests
- Commits to `develop`
- Commits to `main`

View results in GitHub Actions.

## Coverage Targets

- Frontend: 80%+
- Backend: 75%+
