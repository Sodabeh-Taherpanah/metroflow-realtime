import { test, expect } from '@playwright/test';

test.describe('Map Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
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
    // Wait for stations to load
    await page.waitForTimeout(2000);

    // Check if stations are displayed
    const stationItems = page.locator('div[style*="padding: 12"]').first();
    await expect(stationItems).toBeVisible();
  });

  test('should search for stations', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search location"]');
    const searchButton = page.locator('button:has-text("Search")');

    // Type in search
    await searchInput.fill('Potsdamer');
    await searchButton.click();

    // Wait for results
    await page.waitForTimeout(1500);

    // Check if results are shown
    const results = page.locator('div[style*="padding: 12"]').first();
    await expect(results).toBeVisible();
  });

  test('should show autocomplete suggestions', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search location"]');

    // Type to trigger autocomplete
    await searchInput.fill('Ber');
    await page.waitForTimeout(1000);

    // Check if dropdown appears
    const dropdown = page.locator('div[style*="position: absolute"]').first();
    await expect(dropdown).toBeVisible();
  });

  test('should click station from list', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Click first station in list
    const firstStation = page.locator('div[style*="padding: 12"]').first();
    await firstStation.click();

    // Verify it's selected (blue background)
    await expect(firstStation).toHaveCSS('background-color', /rgb.*219.*238.*254|#dbeafe/);
  });

  test('should display red track line when station selected', async ({ page }) => {
    // Enable geolocation mock
    await page.context().addInitScript(() => {
      navigator.geolocation.getCurrentPosition = callback => {
        callback({
          coords: {
            latitude: 52.52,
            longitude: 13.405,
            accuracy: 100,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as GeolocationPosition);
      };
    });

    // Click locate button
    const locateButton = page.locator('button:has-text("Locate Me")');
    await locateButton.click();

    // Wait for location and stations to load
    await page.waitForTimeout(2000);

    // Click a station
    const firstStation = page.locator('div[style*="padding: 12"]').nth(0);
    await firstStation.click();

    // Check if polyline (track line) is rendered
    const polyline = page.locator('polyline');
    await expect(polyline).toBeVisible();
  });
});
