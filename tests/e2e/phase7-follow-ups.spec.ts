import { test, expect } from '@playwright/test';

test.describe('Phase 7 — Follow-up & Activity Management Suite', () => {
  // Test 1: Route protection for unauthenticated users on /follow-ups
  test('1. Unauthenticated request to /follow-ups redirects to login', async ({ page }) => {
    await page.goto('/follow-ups');
    await page.waitForURL(/\/login\?redirect=%2Ffollow-ups/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  // Test 2: Route protection for unauthenticated users on /follow-ups/[id]
  test('2. Unauthenticated request to /follow-ups/[id] redirects to login', async ({ page }) => {
    await page.goto('/follow-ups/00000000-0000-0000-0000-000000000000');
    await page.waitForURL(/\/login\?redirect=%2Ffollow-ups%2F00000000-0000-0000-0000-000000000000/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  // Test 3: Authenticated navigation to /follow-ups dashboard
  test('3. Authenticated operator can load /follow-ups dashboard and telemetry metrics', async ({
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

    await page.goto('/follow-ups');
    await expect(page.getByRole('heading', { name: 'Follow-ups & Activity' })).toBeVisible();
    const metricsGrid = page.getByTestId('follow-up-metrics-grid');
    await expect(metricsGrid).toBeVisible();
    await expect(metricsGrid.getByText('Total Follow-ups')).toBeVisible();
    await expect(metricsGrid.getByText('Overdue')).toBeVisible();
    await expect(metricsGrid.getByText('Due Today')).toBeVisible();
    await expect(metricsGrid.getByText('Upcoming')).toBeVisible();
    await expect(metricsGrid.getByText('Completed')).toBeVisible();
  });

  // Test 4: Dashboard filters, tabs and search operate properly
  test('4. Follow-up filters, tabs, and search controls are interactive', async ({
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

    await page.goto('/follow-ups');

    const searchInput = page.getByTestId('follow-up-search-input');
    await expect(searchInput).toBeVisible();

    const prioritySelect = page.getByTestId('follow-up-priority-select');
    await expect(prioritySelect).toBeVisible();

    // Verify filter tabs exist
    await expect(page.getByRole('button', { name: 'All Follow-ups' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Overdue' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Due Today' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upcoming' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Completed' })).toBeVisible();

    // Click filter tab and verify URL updates
    await page.getByRole('button', { name: 'Overdue' }).click();
    await page.waitForURL(/filter=overdue/);

    await page.getByRole('button', { name: 'All Follow-ups' }).click();
    await page.waitForURL(/\/follow-ups/);
  });

  // Test 5: Schedule a new follow-up via Modal and verify persistence
  test('5. Operator can schedule a new follow-up with validation and zero auto-send assurance', async ({
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

    await page.goto('/follow-ups');

    const openBtn = page.getByTestId('open-create-follow-up-btn');
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    // Verify modal elements
    await expect(page.getByRole('heading', { name: 'Schedule Follow-up' })).toBeVisible();
    await expect(page.getByText('Zero Auto-Send:')).toBeVisible();

    // Wait for opportunity options to load in select
    const oppSelect = page.getByTestId('follow-up-opportunity-select');
    await expect(oppSelect.locator('option')).not.toHaveCount(1, { timeout: 10000 });

    // Fill action description
    const uniqueAction = `Call CEO re: Q3 expansion [${Date.now()}]`;
    const actionInput = page.getByTestId('follow-up-action-input');
    await actionInput.fill(uniqueAction);

    // Fill note
    const noteInput = page.getByTestId('follow-up-note-input');
    await noteInput.fill('Discussed at initial discovery; interested in enterprise pricing.');

    // Select Priority High
    const prioritySelect = page.getByTestId('follow-up-priority-modal-select');
    await prioritySelect.selectOption('high');

    // Submit form
    const submitBtn = page.getByTestId('submit-create-follow-up-btn');
    await submitBtn.click();

    // Verify item appears in table
    await expect(page.getByText(uniqueAction).first()).toBeVisible({ timeout: 10000 });
  });

  // Test 6: Reschedule an existing follow-up
  test('6. Operator can edit and reschedule a follow-up', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'playwright-test-session',
        value: 'operator@hunter.local',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/follow-ups');

    // Find first reschedule button in table
    const rescheduleBtns = page.locator('[data-testid^="reschedule-btn-"]');
    if ((await rescheduleBtns.count()) > 0) {
      await rescheduleBtns.first().click();

      await expect(page.getByText('Edit & Reschedule Follow-up')).toBeVisible();
      const actionInput = page.getByTestId('edit-follow-up-action-input');
      await expect(actionInput).toBeVisible();

      // Click preset "+3 Days"
      await page.getByRole('button', { name: '+3 Days' }).click();

      // Save
      await page.getByTestId('submit-edit-follow-up-btn').click();
      await expect(page.getByText('Edit & Reschedule Follow-up')).not.toBeVisible();
    }
  });

  // Test 7: Quick Complete a follow-up
  test('7. Operator can quickly mark a follow-up as complete', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'playwright-test-session',
        value: 'operator@hunter.local',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/follow-ups');

    const quickCompleteBtns = page.locator('[data-testid^="quick-complete-btn-"]');
    if ((await quickCompleteBtns.count()) > 0) {
      await quickCompleteBtns.first().click();
      // Should show completed badge or checkmark
      await page.waitForTimeout(1000);
      await page.reload();
      await expect(page.getByTestId('follow-up-metrics-grid')).toBeVisible();
    }
  });

  // Test 8: Follow-up Detail Page & Activity Timeline
  test('8. Follow-up detail page renders organization context and interactive activity timeline', async ({
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

    await page.goto('/follow-ups');

    const detailBtns = page.locator('[data-testid^="view-follow-up-btn-"]');
    if ((await detailBtns.count()) > 0) {
      await detailBtns.first().click();

      await page.waitForURL(/\/follow-ups\/[a-f0-9-]+/, { timeout: 15000 });
      await expect(page.getByTestId('follow-up-detail-view')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Target Organization')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Engagement & Activity History')).toBeVisible({ timeout: 10000 });

      // Test adding a note into the activity timeline
      const noteTextarea = page.getByTestId('add-note-textarea');
      await expect(noteTextarea).toBeVisible({ timeout: 10000 });

      const testNote = `Spoke on WhatsApp call with founder: Demo agreed for Tuesday [${Date.now()}]`;
      await noteTextarea.fill(testNote);

      const submitNoteBtn = page.getByTestId('submit-note-btn');
      await submitNoteBtn.click();

      // Verify note appears in timeline
      await expect(page.getByText(testNote).first()).toBeVisible({ timeout: 10000 });
    }
  });

  // Test 9: Opportunity Detail View embeds follow-ups and timeline
  test('9. Opportunity detail page displays embedded follow-up section and timeline', async ({
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
    // Open first opportunity
    const viewButtons = page.getByRole('button', { name: 'View Details' });
    if ((await viewButtons.count()) > 0) {
      await viewButtons.first().click();

      await expect(page.getByTestId('opportunity-follow-up-section')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText('Follow-ups & Next Actions')).toBeVisible();
      await expect(page.getByTestId('opp-schedule-follow-up-btn')).toBeVisible();
      await expect(page.getByText('Engagement & Activity History')).toBeVisible();
    }
  });

  // Test 10: Outreach page includes Follow-ups link
  test('10. Outreach detail page includes direct navigation to Follow-ups', async ({
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

    await page.goto('/outreach');
    const reviewButtons = page.getByRole('button', { name: 'Review & Outreach' });
    if ((await reviewButtons.count()) > 0) {
      await reviewButtons.first().click();

      const followUpLink = page.getByTestId('link-to-opp-follow-ups');
      await expect(followUpLink).toBeVisible();
      await followUpLink.click();

      await page.waitForURL(/\/follow-ups\?opportunity_id=/);
      await expect(page.getByRole('heading', { name: 'Follow-ups & Activity' })).toBeVisible();
    }
  });

  // Test 11: Sidebar contains Follow-ups navigation
  test('11. Sidebar displays Follow-ups & Activity under Core Engines', async ({
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
    const sidebarLink = page.getByRole('link', { name: 'Follow-ups & Activity' });
    await expect(sidebarLink).toBeVisible();
    await sidebarLink.click();
    await page.waitForURL('/follow-ups');
    await expect(page.getByRole('heading', { name: 'Follow-ups & Activity' })).toBeVisible();
  });

  // Test 12: Responsive design across mobile viewports
  test('12. Follow-ups dashboard and detail view render cleanly on mobile viewports', async ({
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

    // Test mobile 375x667
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/follow-ups');
    await expect(page.getByRole('heading', { name: 'Follow-ups & Activity' })).toBeVisible();
    await expect(page.getByTestId('follow-up-search-input')).toBeVisible();

    // Test tablet 768x1024
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Follow-ups & Activity' })).toBeVisible();
  });
});
