import { test, expect } from '@playwright/test';

test.describe('Opportunity Hunter Smoke Test', () => {
  test('landing page loads and renders title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Opportunity Hunter/);
    await expect(page.getByText('Opportunity Hunter', { exact: true }).first()).toBeVisible();
  });
});
