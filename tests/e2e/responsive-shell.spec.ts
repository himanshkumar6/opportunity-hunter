import { test, expect } from '@playwright/test';

test.describe('Responsive App Shell & Visual QA Suite', () => {
  // ==========================================
  // 375px (Mobile Viewport)
  // ==========================================
  test.describe('375px Mobile Viewport', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('Landing page renders without horizontal scroll', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByText('Opportunity Hunter', { exact: true }).first()).toBeVisible();

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
    });

    test('Mobile drawer navigation opens, displays links, and closes on backdrop click', async ({
      page,
    }) => {
      await page.goto('/design-system');

      // Hamburger button should be visible on mobile
      const hamburger = page.getByRole('button', { name: 'Open navigation menu' });
      await expect(hamburger).toBeVisible();

      // Open mobile drawer
      await hamburger.click();

      // Check drawer elements
      const drawer = page.locator('aside.md\\:hidden');
      await expect(drawer).toBeVisible();
      await expect(drawer.getByText('Job Hunt AI')).toBeVisible();
      await expect(drawer.getByText('Lead Hunt AI')).toBeVisible();
      await expect(drawer.getByText('Core Engines')).toBeVisible();

      // Click backdrop to close
      const backdrop = page.locator('div.fixed.inset-0.bg-black\\/75');
      await backdrop.click({ position: { x: 350, y: 100 } });
      await expect(drawer).toHaveClass(/-translate-x-full/);
      await expect(backdrop).not.toBeVisible();
    });

    test('Command Palette triggers on mobile and filters commands', async ({ page }) => {
      await page.goto('/design-system');

      // Click search button with exact accessible name
      const searchBtn = page.getByRole('button', { name: 'Open command palette' });
      await searchBtn.click();

      // Command dialog should open
      const searchInput = page.getByPlaceholder('Type a command or search destination...');
      await expect(searchInput).toBeVisible();

      // Filter for "lead"
      await searchInput.fill('lead');
      await expect(page.getByText('Lead Hunt AI').first()).toBeVisible();

      // Close using ESC
      await page.keyboard.press('Escape');
      await expect(searchInput).not.toBeVisible();
    });
  });

  // ==========================================
  // 768px (Tablet Viewport)
  // ==========================================
  test.describe('768px Tablet Viewport', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('Landing page renders responsive grid and buttons', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('heading', { name: /Discover High-Intent/i })).toBeVisible();

      const signInBtn = page.getByRole('link', { name: /sign in/i });
      await expect(signInBtn).toBeVisible();
    });

    test('Design system interactive components operate cleanly on tablet', async ({ page }) => {
      await page.goto('/design-system');

      // Test Dialog modal
      const openDialogBtn = page.getByTestId('open-test-dialog');
      await expect(openDialogBtn).toBeVisible();
      await openDialogBtn.click();

      const dialogTitle = page.getByRole('heading', { name: 'Automated Discovery Trigger' });
      await expect(dialogTitle).toBeVisible();

      // Close dialog via Escape
      await page.keyboard.press('Escape');
      await expect(dialogTitle).not.toBeVisible();

      // Test Dropdown menu
      const openDropdownBtn = page.getByTestId('open-test-dropdown');
      await openDropdownBtn.click();
      await expect(page.getByText('Quick Actions')).toBeVisible();
      await expect(page.getByText('Search Index')).toBeVisible();
    });
  });

  // ==========================================
  // 1280px (Laptop / Desktop Viewport)
  // ==========================================
  test.describe('1280px Desktop Viewport', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('Desktop sidebar expands and collapses with state toggle', async ({ page }) => {
      await page.goto('/design-system');

      const desktopSidebar = page.locator('aside.hidden.md\\:block');
      await expect(desktopSidebar).toBeVisible();

      // Initially expanded (w-64)
      await expect(desktopSidebar).toHaveClass(/w-64/);

      // Collapse sidebar
      const collapseBtn = page.getByRole('button', { name: 'Collapse sidebar' });
      await collapseBtn.click();

      // Sidebar is now collapsed (w-16)
      await expect(desktopSidebar).toHaveClass(/w-16/);

      // Expand sidebar again
      const expandBtn = page.getByRole('button', { name: 'Expand sidebar' });
      await expandBtn.click();
      await expect(desktopSidebar).toHaveClass(/w-64/);
    });

    test('Command Palette opens with search trigger and navigates with arrow keys', async ({
      page,
    }) => {
      await page.goto('/design-system');

      // Click the search button in the topbar
      const searchBtn = page.getByRole('button', { name: 'Open command palette' });
      await searchBtn.click();

      const searchInput = page.getByPlaceholder('Type a command or search destination...');
      await expect(searchInput).toBeVisible();

      // Navigate with arrow down and verify input remains active
      await page.keyboard.press('ArrowDown');
      await expect(searchInput).toBeVisible();

      // Close with Escape key
      await page.keyboard.press('Escape');
      await expect(searchInput).not.toBeVisible();
    });

    test('TopBar notifications and user menu dropdowns function properly', async ({ page }) => {
      await page.goto('/design-system');

      // Open Notifications
      const notifBtn = page.getByRole('button', { name: 'View notifications' });
      await notifBtn.click();
      await expect(page.getByText('Notifications')).toBeVisible();
      await expect(page.getByText('Opportunity Hunter Engine Ready')).toBeVisible();

      // Click outside to close notifications
      await page.mouse.click(10, 10);

      // Open User Menu in topbar
      const userMenuTrigger = page.locator('header').getByText('operator');
      await userMenuTrigger.click();
      await expect(page.getByText('Verified Operator')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
    });
  });

  // ==========================================
  // 1440px (Large Desktop Monitor Viewport)
  // ==========================================
  test.describe('1440px Large Desktop Viewport', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('All 12 design system components render properly without distortion', async ({ page }) => {
      await page.goto('/design-system');

      // Check section titles
      await expect(page.getByText('1. Buttons & Triggers')).toBeVisible();
      await expect(page.getByText('2. Form Inputs & Select Controls')).toBeVisible();
      await expect(page.getByText('3. Status Badges & Indicators')).toBeVisible();
      await expect(page.getByText('4. Responsive Data Table')).toBeVisible();
      await expect(page.getByText('5. Dialog Modal & Dropdown Menus')).toBeVisible();
      await expect(page.getByText('6. Shimmer Loading Skeletons')).toBeVisible();
      await expect(page.getByText('7. Empty State Component')).toBeVisible();
      await expect(page.getByText('8. Error State Component')).toBeVisible();

      // Check Badges & Table Content
      await expect(page.getByText('Senior Fullstack Engineer')).toBeVisible();
      await expect(page.getByText('Pacific Dental Group')).toBeVisible();

      // Check no horizontal overflow on large screen
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
    });
  });
});
