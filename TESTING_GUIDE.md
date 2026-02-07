# Testing Guide - MetroFlow

Complete testing setup for frontend and backend with unit, component, and E2E tests.

## Overview

- **Frontend Unit Tests**: Vitest + Testing Library
- **Frontend E2E Tests**: Playwright
- **Backend Unit Tests**: Jest
- **Backend E2E Tests**: Jest + Supertest

---

## Frontend Testing

### 1. Unit Tests with Vitest

**Setup:** ✅ Already configured in `vitest.config.ts`

**Run unit tests:**

```bash
cd frontend
npm run test                # Run once
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
```

**Test location:** Any file with `.spec.ts` or `.spec.tsx` extension

**Example test:**

```typescript
// utils/__tests__/validation.spec.ts
import { describe, it, expect } from 'vitest';

describe('Validation Utils', () => {
  it('should validate email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('invalid')).toBe(false);
  });
});
```

### 2. Component Tests with Testing Library

**Integrated** with Vitest setup.

**Run:**

```bash
npm run test -- components/__tests__
```

**Example test:**

```typescript
// components/__tests__/Header.spec.tsx
import { render, screen } from '@testing-library/react';
import Header from '../Header';

describe('Header Component', () => {
  it('should render header', () => {
    render(<Header />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('should have navigation', () => {
    render(<Header />);
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });
});
```

### 3. E2E Tests with Playwright

**Setup:** ✅ Already configured in `playwright.config.ts`

**Run E2E tests:**

```bash
cd frontend
npm run test:e2e           # Run all E2E tests
npm run test:e2e:debug     # Debug mode (opens browser)
npm run test:e2e:ui        # Interactive UI
```

**Test location:** `e2e/*.spec.ts`

**Example test:**

```typescript
// e2e/map.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Map Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
  });

  test('should load map with sidebar', async ({ page }) => {
    const sidebar = page.locator('[style*="width: 380"]').first();
    await expect(sidebar).toBeVisible();

    const title = page.locator('h2');
    await expect(title).toContainText('Find Stations');
  });

  test('should search for stations', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    const searchButton = page.locator('button:has-text("Search")');

    await searchInput.fill('Potsdamer');
    await searchButton.click();

    await page.waitForTimeout(1500);
    const results = page.locator('div[style*="padding: 12"]').first();
    await expect(results).toBeVisible();
  });

  test('should show autocomplete suggestions', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Ber');
    await page.waitForTimeout(1000);

    const dropdown = page.locator('div[style*="position: absolute"]').first();
    await expect(dropdown).toBeVisible();
  });
});
```

**Common Playwright patterns:**

```typescript
// Navigation
await page.goto('/path');

// Selectors
page.locator('button:has-text("text")');
page.getByRole('button', { name: 'text' });
page.getByLabel('Label');

// Interactions
await page.click('button');
await page.fill('input', 'text');
await page.press('Enter');

// Assertions
await expect(page.locator('h1')).toContainText('Title');
await expect(page.locator('input')).toHaveValue('text');
await expect(page.locator('button')).toBeVisible();
```

---

## Backend Testing

### 1. Unit Tests with Jest

**Setup:** ✅ Already configured in `package.json` and `tsconfig.json`

**Run unit tests:**

```bash
cd backend
npm run test                # Run once
npm run test:watch         # Watch mode
npm run test:cov           # With coverage
npm run test:debug         # Debug mode
```

**Test location:** Any file with `.spec.ts` extension in `src/`

**Example test:**

```typescript
// src/vbb/vbb.service.spec.ts
import { describe, it, expect, beforeAll } from '@jest/globals';
import { VbbService } from './vbb.service';

describe('VbbService (unit)', () => {
  let service: VbbService;
  let mockHttpService: any;

  beforeAll(() => {
    mockHttpService = {
      get: jest.fn(),
    };
    service = new VbbService(mockHttpService);
  });

  describe('getStations', () => {
    it('should return stations array', async () => {
      const mockData = [
        {
          id: '1',
          name: 'Test Station',
          location: { latitude: 52.52, longitude: 13.405 },
        },
      ];

      mockHttpService.get.mockReturnValue({
        toPromise: jest.fn().mockResolvedValue({ data: mockData }),
      });

      const result = await service.getStations('Test', 10);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    it('should handle API errors', async () => {
      mockHttpService.get.mockReturnValue({
        toPromise: jest.fn().mockRejectedValue(new Error('API Error')),
      });

      await expect(service.getStations('Test', 10)).rejects.toThrow(
        'API Error',
      );
    });
  });
});
```

### 2. E2E Tests with Supertest + Jest

**Setup:** ✅ Configured in `test/jest-e2e.json`

**Run E2E tests:**

```bash
cd backend
npm run test:e2e           # Run E2E tests
npm run test:e2e:debug     # Debug mode
```

**Test location:** `test/*.e2e-spec.ts`

**Example test:**

```typescript
// test/app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /vbb/stations', () => {
    it('should return stations array', () => {
      return request(app.getHttpServer())
        .get('/vbb/stations?query=Berlin&limit=5')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('name');
          }
        });
    });

    it('should respect limit parameter', () => {
      return request(app.getHttpServer())
        .get('/vbb/stations?query=Berlin&limit=3')
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toBeLessThanOrEqual(3);
        });
    });
  });

  describe('GET /vbb/departures', () => {
    it('should return departures', () => {
      return request(app.getHttpServer())
        .get('/vbb/departures?stationId=900029305&duration=60')
        .expect(200);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent route', () => {
      return request(app.getHttpServer()).get('/non-existent').expect(404);
    });
  });
});
```

**Common Supertest patterns:**

```typescript
// GET request
request(app.getHttpServer())
  .get('/api/path')
  .expect(200);

// POST request with body
request(app.getHttpServer())
  .post('/api/path')
  .send({ key: 'value' })
  .expect(201);

// Custom assertions
.expect(res => {
  expect(res.body).toHaveProperty('id');
  expect(res.headers['content-type']).toMatch(/json/);
});

// Authentication
.set('Authorization', 'Bearer token');
```

---

## Coverage Reports

### Frontend Coverage

```bash
cd frontend
npm run test:coverage
# Opens: coverage/index.html
```

### Backend Coverage

```bash
cd backend
npm run test:cov
# Report in: coverage/
```

---

## Test Structure

```
frontend/
├── components/__tests__/
│   ├── Header.spec.tsx
│   └── ...
├── utils/__tests__/
│   ├── validation.spec.ts
│   └── ...
└── e2e/
    ├── map.spec.ts
    └── smoke.spec.ts

backend/
├── src/
│   ├── vbb/
│   │   ├── vbb.service.spec.ts
│   │   └── vbb.service.ts
│   └── ...
└── test/
    ├── app.e2e-spec.ts
    └── jest-e2e.json
```

---

## Best Practices

### ✅ DO

- Write tests as you code
- Test behavior, not implementation
- Keep tests focused and isolated
- Mock external dependencies
- Use descriptive test names
- Aim for 80%+ coverage on critical paths
- Test user workflows in E2E
- Test edge cases and errors

### ❌ DON'T

- Test implementation details
- Create flaky tests (time-dependent, real network calls)
- Skip E2E tests for user flows
- Ignore test failures
- Over-mock (lose integration testing)
- Test third-party libraries
- Make tests too strict on styling

---

## Debugging Tests

### Frontend

```bash
# Vitest with Node debugger
npm run test -- --inspect-brk

# Playwright interactive debug
npm run test:e2e:debug

# Playwright headed mode
npx playwright test --headed --debug
```

### Backend

```bash
# Jest with Node debugger
npm run test:debug

# E2E with Node debugger
npm run test:e2e:debug
```

---

## Quick Commands Reference

```bash
# ===== FRONTEND =====
cd frontend

# Unit tests
npm run test                    # Run all
npm run test -- --watch       # Watch mode
npm run test -- --coverage    # With coverage

# E2E tests
npm run test:e2e              # Run all
npm run test:e2e:debug        # Interactive
npm run test:e2e:ui           # UI mode

# ===== BACKEND =====
cd backend

# Unit tests
npm run test                   # Run all
npm run test:watch            # Watch mode
npm run test:cov              # With coverage

# E2E tests
npm run test:e2e              # Run all
npm run test:e2e:debug        # Debug mode
```

---

## Resources

- [Vitest](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- [Playwright](https://playwright.dev)
- [Jest](https://jestjs.io)
- [Supertest](https://github.com/visionmedia/supertest)

---

Last updated: February 5, 2026
