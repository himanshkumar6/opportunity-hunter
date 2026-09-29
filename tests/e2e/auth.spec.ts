import { test, expect } from '@playwright/test';

test.describe('Authentication & Protected Routes Suite', () => {
  test('1. Login page loads with proper UI elements', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Opportunity Hunter')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create account' })).toBeVisible();
  });

  test('2. Signup page loads with proper UI elements', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByText('Opportunity Hunter')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Confirm password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test('3. Forgot password page loads with proper UI elements', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByText('Opportunity Hunter')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to sign in' })).toBeVisible();
  });

  test('4. Empty login validation displays error alert', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();
    const alert = page.locator('[data-testid="auth-error-alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Please enter both email and password.');
  });

  test('5. Invalid login handling shows error notification', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('nonexistent_operator@test.com');
    await page.getByLabel('Password').fill('WrongPassword123!');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // The form should enter loading state and then display an error message
    const alert = page.locator('[data-testid="auth-error-alert"]');
    await expect(alert).toBeVisible({ timeout: 10000 });
  });

  test('6. Protected route redirects unauthenticated users to login with redirect param', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/login\?redirect=%2Fdashboard/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('7. Protected jobs route redirects unauthenticated users', async ({ page }) => {
    await page.goto('/jobs');
    await page.waitForURL(/\/login\?redirect=%2Fjobs/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('8. Signup password mismatch validation displays error', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Email address').fill('new_operator@test.com');
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirm password').fill('DifferentPassword456!');
    await page.getByRole('button', { name: 'Create account' }).click();

    const alert = page.locator('[data-testid="auth-error-alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Passwords do not match.');
  });

  test('9. Valid operator login authenticates and redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('operator@hunter.local');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/dashboard');
    await expect(
      page.getByRole('heading', { name: 'Opportunity Hunter Command Center' })
    ).toBeVisible();
  });
});
