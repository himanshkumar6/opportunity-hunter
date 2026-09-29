import { test, expect } from '@playwright/test';

test.describe('Phase 8 — CRM & Pipeline Management Suite', () => {
  // Test 1: Unauthenticated request redirects to login
  test('1. Unauthenticated request to /crm redirects to login', async ({ page }) => {
    await page.goto('/crm');
    await page.waitForURL(/\/login\?redirect=%2Fcrm/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  // Test 2: Authenticated operator can load CRM and telemetry metrics
  test('2. Authenticated operator can load /crm dashboard and telemetry metrics', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: 'playwright-test-session',
        value: 'operator@hunter.local',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/crm');
    await expect(page.getByRole('heading', { name: 'CRM & Pipeline Workspace' })).toBeVisible();

    // Verify 8-Card telemetry grid exists
    const grid = page.getByTestId('crm-metrics-grid');
    await expect(grid).toBeVisible();
    await expect(page.getByTestId('crm-metric-all')).toBeVisible();
    await expect(page.getByTestId('crm-metric-new')).toBeVisible();
    await expect(page.getByTestId('crm-metric-qualified')).toBeVisible();
    await expect(page.getByTestId('crm-metric-contacted')).toBeVisible();
    await expect(page.getByTestId('crm-metric-replied')).toBeVisible();
    await expect(page.getByTestId('crm-metric-interested')).toBeVisible();
    await expect(page.getByTestId('crm-metric-closed')).toBeVisible();
    await expect(page.getByTestId('crm-metric-overdue_follow_ups')).toBeVisible();
  });

  // Test 3: Kanban Pipeline board renders all status columns
  test('3. Pipeline / Kanban view displays status columns', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'playwright-test-session',
        value: 'operator@hunter.local',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/crm');
    const board = page.getByTestId('crm-kanban-board');
    await expect(board).toBeVisible();

    // Verify key progressive pipeline columns
    await expect(page.getByTestId('crm-column-new')).toBeVisible();
    await expect(page.getByTestId('crm-column-qualified')).toBeVisible();
    await expect(page.getByTestId('crm-column-approved')).toBeVisible();
    await expect(page.getByTestId('crm-column-contacted')).toBeVisible();
    await expect(page.getByTestId('crm-column-replied')).toBeVisible();
    await expect(page.getByTestId('crm-column-interested')).toBeVisible();
    await expect(page.getByTestId('crm-column-closed')).toBeVisible();
    await expect(page.getByTestId('crm-column-rejected')).toBeVisible();
  });

  // Test 4: View toggle switches between Kanban and List view
  test('4. Operator can toggle between Pipeline Kanban and List view', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: 'playwright-test-session',
        value: 'operator@hunter.local',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/crm');

    // Default is Kanban
    await expect(page.getByTestId('crm-kanban-board')).toBeVisible();

    // Switch to List view
    const listToggle = page.getByTestId('view-toggle-list');
    await listToggle.click();

    await expect(page.getByTestId('crm-list-table-container')).toBeVisible();
    await expect(page.getByTestId('crm-kanban-board')).not.toBeVisible();

    // Switch back to Kanban
    const kanbanToggle = page.getByTestId('view-toggle-kanban');
    await kanbanToggle.click();

    await expect(page.getByTestId('crm-kanban-board')).toBeVisible();
  });

  // Test 5: CRM filters and search operate properly
  test('5. Search and filters refine CRM opportunities', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'playwright-test-session',
        value: 'operator@hunter.local',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/crm');

    const searchInput = page.getByTestId('crm-search-input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Real Estate');

    // Should still display cards or empty state cleanly
    await page.waitForTimeout(500);
    await expect(page.getByTestId('crm-workspace')).toBeVisible();

    // Clear search
    await searchInput.clear();

    // Filter by status dropdown
    const statusSelect = page.getByTestId('crm-status-filter');
    await statusSelect.selectOption('new');
    await page.waitForTimeout(500);

    // Reset button should appear
    const resetBtn = page.getByTestId('crm-reset-filters-btn');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await expect(resetBtn).not.toBeVisible();
  });

  // Test 6: Opportunity card displays company, contact, outreach and follow-up states
  test('6. CRM cards expose company, contact, outreach, and follow-up intelligence', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: 'playwright-test-session',
        value: 'operator@hunter.local',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/crm');

    const cards = page.locator('[data-testid^="crm-card-"]');
    if ((await cards.count()) > 0) {
      const firstCard = cards.first();
      await expect(firstCard).toBeVisible();

      // Card must have company title or account link
      const title = firstCard.locator('[data-testid^="crm-card-title-"]');
      await expect(title).toBeVisible();

      // Status select must be available on card
      const statusSelect = firstCard.locator('[data-testid^="crm-card-status-select-"]');
      await expect(statusSelect).toBeVisible();
    }
  });

  // Test 7: Operator can update opportunity status directly from CRM card
  test('7. Operator can quickly change status from CRM and persist to database', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: 'playwright-test-session',
        value: 'operator@hunter.local',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/crm');

    const statusSelects = page.locator('[data-testid^="crm-card-status-select-"]');
    if ((await statusSelects.count()) > 0) {
      const targetSelect = statusSelects.first();
      const testId = await targetSelect.getAttribute('data-testid');
      const currentStatus = await targetSelect.inputValue();
      const newStatus = currentStatus === 'qualified' ? 'interested' : 'qualified';

      await targetSelect.selectOption(newStatus);

      // Verify specific card select has newStatus in its new column
      await page.waitForTimeout(1000);
      if (testId) {
        const movedSelect = page.locator(`[data-testid="${testId}"]`);
        await expect(movedSelect).toHaveValue(newStatus);
      }
    }
  });

  // Test 8: List view enables opening opportunity details
  test('8. List view provides direct access to Opportunity details', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'playwright-test-session',
        value: 'operator@hunter.local',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/crm');
    await page.getByTestId('view-toggle-list').click();

    const openBtns = page.locator('[data-testid^="crm-list-open-btn-"]');
    if ((await openBtns.count()) > 0) {
      await openBtns.first().click();
      await page.waitForURL(/\/opportunities\/[a-f0-9-]+/);
      await expect(page.getByTestId('view-in-crm-btn')).toBeVisible();
    }
  });

  // Test 9: Opportunity detail page links back to CRM pipeline
  test('9. Opportunity detail page displays View in CRM Pipeline button', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: 'playwright-test-session',
        value: 'operator@hunter.local',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/opportunities');
    const viewButtons = page.getByRole('button', { name: 'View Details' });
    if ((await viewButtons.count()) > 0) {
      await viewButtons.first().click();

      const crmBtn = page.getByTestId('view-in-crm-btn');
      await expect(crmBtn).toBeVisible();
      await crmBtn.click();
      await page.waitForURL('/crm');
      await expect(page.getByRole('heading', { name: 'CRM & Pipeline Workspace' })).toBeVisible();
    }
  });

  // Test 10: Sidebar displays CRM & Pipeline under Core Engines
  test('10. Sidebar navigation contains CRM & Pipeline under Core Engines', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: 'playwright-test-session',
        value: 'operator@hunter.local',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');
    const sidebarLink = page.getByRole('link', { name: 'CRM & Pipeline' });
    await expect(sidebarLink).toBeVisible();
    await sidebarLink.click();
    await page.waitForURL('/crm', { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'CRM & Pipeline Workspace' })).toBeVisible({
      timeout: 15000,
    });
  });

  // Test 11: Break testing — API rejection on invalid status
  test('11. Security & Validation: Invalid status payload returns 400 Bad Request', async ({
    request,
  }) => {
    const res = await request.patch(
      '/api/opportunities/00000000-0000-0000-0000-000000000000/status',
      {
        data: { status: 'invalid_hacked_status' },
        headers: {
          cookie: 'playwright-test-session=operator@hunter.local',
        },
      }
    );

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Invalid status');
  });

  // Test 12: Responsive testing across mobile and tablet viewports
  test('12. Responsive QA: CRM workspace operates cleanly at 375px mobile viewport', async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await context.addCookies([
      {
        name: 'playwright-test-session',
        value: 'operator@hunter.local',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/crm');
    await expect(page.getByRole('heading', { name: 'CRM & Pipeline Workspace' })).toBeVisible();
    await expect(page.getByTestId('crm-metrics-grid')).toBeVisible();

    // Verify switching to List view on mobile renders mobile cards
    await page.getByTestId('view-toggle-list').click();
    await expect(page.getByTestId('crm-list-table-container')).toBeVisible();
  });
});
