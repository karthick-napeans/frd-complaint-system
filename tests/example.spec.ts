import { test, expect } from '@playwright/test';

test('App loads successfully', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await page.waitForLoadState('domcontentloaded');

  // Check title
  await expect(page.getByText('QA/QC Dashboard')).toBeVisible();
});

test('Login page elements visible', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('input')).toBeVisible();
});

test('Dashboard loads', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.getByText('QA/QC Dashboard')).toBeVisible();
});