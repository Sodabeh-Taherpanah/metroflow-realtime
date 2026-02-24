import { test, expect } from '@playwright/test';

const mockStations = [
  {
    id: '1',
    name: 'Berlin Hauptbahnhof',
    location: { latitude: 52.525, longitude: 13.369 },
  },
  {
    id: '2',
    name: 'Potsdamer Platz',
    location: { latitude: 52.509, longitude: 13.376 },
  },
];

test.describe('Map Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API calls
    await page.route('**/api/vbb/stations*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStations),
      });
    });

    await page.goto('/map');
    await expect(page.getByRole('heading', { name: 'Live station map' })).toBeVisible();
  });

  test('should load map page with sidebar', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Find stations' })).toBeVisible();
    await expect(page.getByPlaceholder('Search location or station...')).toBeVisible();
  });

  test('should display search input and buttons', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search location or station...');
    await expect(searchInput).toBeVisible();

    const searchButton = page.getByRole('button', { name: 'Search' });
    await expect(searchButton).toBeVisible();

    const locateButton = page.getByRole('button', { name: /Locate Me/ });
    await expect(locateButton).toBeVisible();
  });

  test('should display stations list on load', async ({ page }) => {
    const stationButton = page
      .locator('button')
      .filter({ hasText: /Berlin Hauptbahnhof|Potsdamer Platz/ })
      .first();
    await expect(stationButton).toBeVisible();
  });

  test('should search for stations', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search location or station...');
    const searchButton = page.getByRole('button', { name: 'Search' });

    await searchInput.fill('Potsdamer');
    await searchButton.click();

    const result = page.locator('button').filter({ hasText: 'Potsdamer Platz' }).first();
    await expect(result).toBeVisible();
  });

  test('should show autocomplete suggestions', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search location or station...');

    await searchInput.fill('Ber');

    const dropdown = page.locator('div.absolute').locator('button').filter({
      hasText: 'Berlin Hauptbahnhof',
    });
    await expect(dropdown.first()).toBeVisible();
  });

  test('should click station from list', async ({ page }) => {
    const firstStation = page
      .locator('button[class*="rounded-lg"][class*="border"]')
      .filter({
        hasText: /Berlin|Potsdamer/,
      })
      .first();

    await expect(firstStation).toBeVisible();
    await firstStation.click();

    await expect(firstStation).toHaveClass(/border-blue-500/);
  });

  test('should show distance after locating and selecting station', async ({ page }) => {
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 52.52, longitude: 13.405 });
    await page.getByRole('button', { name: /Locate Me/ }).click();

    const distanceText = page.locator('text=/km away/').first();
    await expect(distanceText).toBeVisible();

    const firstStation = page
      .locator('button[class*="rounded-lg"][class*="border"]')
      .filter({
        hasText: /Berlin|Potsdamer/,
      })
      .first();

    await expect(firstStation).toBeVisible();
    await firstStation.click();

    await expect(firstStation).toHaveClass(/border-blue-500/);
  });
});
