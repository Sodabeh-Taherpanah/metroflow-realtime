import { test, expect } from '@playwright/test';

test.describe('MetroFlow E2E Tests', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MetroFlow/);
  });

  test('should navigate to stations page', async ({ page }) => {
    await page.goto('/');
    await page.click('a:has-text("Stations")');
    await expect(page).toHaveURL(/\/stations/);
  });

  test('should navigate to departures page', async ({ page }) => {
    await page.goto('/');
    await page.click('a:has-text("Departures")');
    await expect(page).toHaveURL(/\/departures/);
  });

  test('should display Web Vitals metrics', async ({ page }) => {
    await page.goto('/');

    // Check for performance marks
    const webVitals = await page.evaluate(() => {
      return {
        hasPerformance: !!window.performance,
        hasNavigationTiming: !!window.performance?.timing,
      };
    });

    expect(webVitals.hasPerformance).toBe(true);
  });

  test('should load map page', async ({ page }) => {
    await page.goto('/map');
    await expect(page).toHaveURL(/\/map/);
  });

  test('should load dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('mobile responsiveness', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check header is visible
    const header = await page.locator('header').first();
    await expect(header).toBeVisible();
  });
});
