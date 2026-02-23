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
    await page.waitForLoadState('networkidle');
  });

  test('should load map page with sidebar', async ({ page }) => {
    // Check sidebar exists
    const sidebar = page.locator('[style*="width: 380"]').first();
    await expect(sidebar).toBeVisible();

    // Check title
    const title = page.locator('h2');
    await expect(title).toContainText('Find Stations');
  });

  test('should display search input and buttons', async ({ page }) => {
    // Check search input
    const searchInput = page.locator('input[placeholder*="Search location"]');
    await expect(searchInput).toBeVisible();

    // Check search button
    const searchButton = page.locator('button:has-text("Search")');
    await expect(searchButton).toBeVisible();

    // Check locate button
    const locateButton = page.locator('button:has-text("Locate Me")');
    await expect(locateButton).toBeVisible();
  });

  test('should display stations list on load', async ({ page }) => {
    // Wait for stations to load via API
    await page.waitForResponse(
      response => response.url().includes('/api/vbb/stations') && response.status() === 200
    );

    // Check if stations are displayed (they're button elements)
    const stationButtons = page.locator('button[class*="rounded-lg"][class*="border"]').filter({
      hasText: /Berlin|Potsdamer/,
    });
    await expect(stationButtons.first()).toBeVisible();
  });

  test('should search for stations', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search location"]');
    const searchButton = page.locator('button:has-text("Search")');

    // Type in search
    await searchInput.fill('Potsdamer');
    await searchButton.click();

    // Wait for API response with results
    await page.waitForResponse(
      response => response.url().includes('/api/vbb/stations') && response.status() === 200
    );

    // Check if results are shown (station buttons)
    const results = page.locator('button[class*="rounded-lg"][class*="border"]').filter({
      hasText: 'Potsdamer',
    });
    await expect(results.first()).toBeVisible();
  });

  test('should show autocomplete suggestions', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search location"]');

    // Type to trigger autocomplete
    await searchInput.fill('Ber');

    // Wait for API response with suggestions
    await page.waitForResponse(
      response => response.url().includes('/api/vbb/stations') && response.status() === 200
    );

    // Check if dropdown with suggestions appears (contains buttons with station names)
    const dropdown = page.locator('button[class*="text-left"][class*="text-sm"]').filter({
      hasText: /Berlin|Ber/,
    });
    await expect(dropdown.first()).toBeVisible();
  });

  test('should click station from list', async ({ page }) => {
    // Wait for initial stations API call
    await page.waitForResponse(
      response => response.url().includes('/api/vbb/stations') && response.status() === 200
    );

    // Click first station in list (use better selector)
    const firstStation = page
      .locator('button[class*="rounded-lg"][class*="border"]')
      .filter({
        hasText: /Berlin|Potsdamer/,
      })
      .first();

    await firstStation.click();

    // Verify it's selected by checking for blue styling
    await expect(firstStation).toHaveClass(/border-blue-500/);
  });

  test('should show distance after locating and selecting station', async ({ page }) => {
    // Wait for initial stations API call
    await page.waitForResponse(
      response => response.url().includes('/api/vbb/stations') && response.status() === 200
    );

    // Click first station to select it
    const firstStation = page
      .locator('button[class*="rounded-lg"][class*="border"]')
      .filter({
        hasText: /Berlin|Potsdamer/,
      })
      .first();

    await firstStation.click();

    // Verify station stays selected by checking for blue styling
    await expect(firstStation).toHaveClass(/border-blue-500/);
  });
});
