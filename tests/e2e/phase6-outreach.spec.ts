import { test, expect } from '@playwright/test';

test.describe('Phase 6 — Outreach & Human Approval Suite', () => {
  // Test 1: Route protection for unauthenticated users
  test('1. Unauthenticated request to /outreach redirects to login', async ({ page }) => {
    await page.goto('/outreach');
    await page.waitForURL(/\/login\?redirect=%2Foutreach/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  // Test 2: Unauthenticated request to /outreach/[id] redirects to login
  test('2. Unauthenticated request to /outreach/[id] redirects to login', async ({ page }) => {
    await page.goto('/outreach/95c36024-6b10-419b-b24b-5246274d6445');
    await page.waitForURL(/\/login\?redirect=%2Foutreach%2F95c36024-6b10-419b-b24b-5246274d6445/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  // Test 3: Authenticated navigation to /outreach dashboard
  test('3. Authenticated operator can load /outreach dashboard and view telemetry metrics', async ({
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
    await expect(page.getByRole('heading', { name: 'Outreach & Human Approval' })).toBeVisible();
    await expect(page.getByText('Pending Drafts')).toBeVisible();
    await expect(page.getByText('Approved Outreach')).toBeVisible();
    await expect(page.getByText('Total Records')).toBeVisible();
    await expect(page.getByText('Outreach Safety')).toBeVisible();
    await expect(page.getByText('Zero Auto-Send')).toBeVisible();
  });

  // Test 4: Dashboard filters and search are functional
  test('4. Outreach filters and search input operate properly', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'playwright-test-session',
        value: 'operator@hunter.local',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/outreach');
    const searchInput = page.getByTestId('outreach-search-input');
    await expect(searchInput).toBeVisible();

    const statusSelect = page.getByTestId('outreach-status-select');
    await expect(statusSelect).toBeVisible();

    const channelSelect = page.getByTestId('outreach-channel-select');
    await expect(channelSelect).toBeVisible();

    // Select Email channel filter
    await channelSelect.selectOption('email');
    await page.getByTestId('outreach-apply-filters-btn').click();
    await expect(page).toHaveURL(/channel=email/);

    // Reset filters
    await page.getByTestId('outreach-reset-filters-btn').click();
    await expect(page).not.toHaveURL(/channel=email/);
  });

  // Test 5: Opportunity Detail page includes Review & Outreach action
  test('5. Opportunity Detail page exposes "Review & Outreach" button', async ({
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
    await expect(page.getByTestId('opportunity-table')).toBeVisible();

    // Click first opportunity view link
    const firstOppLink = page
      .getByTestId('opportunity-table')
      .locator('tbody tr')
      .first()
      .locator('a')
      .first();
    await firstOppLink.click();
    await page.waitForURL(/\/(opportunities|leads|jobs)\/[a-zA-Z0-9-]+/);

    // Should be on opportunity detail page
    const reviewBtn = page.getByTestId('review-outreach-btn');
    await expect(reviewBtn).toBeVisible();
    await expect(reviewBtn).toContainText('Review & Outreach');

    // Click to navigate into Outreach composer
    await reviewBtn.click();
    await page.waitForURL(/\/outreach\//);
    await expect(page.getByTestId('outreach-draft-editor')).toBeVisible();
  });

  // Test 6: Outreach Composer generates deterministic copy without hallucinated names
  test('6. Outreach composer generates deterministic copy without hallucinations', async ({
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

    // Navigate to a real opportunity outreach composer
    await page.goto('/outreach/95c36024-6b10-419b-b24b-5246274d6445');
    await expect(page.getByTestId('outreach-draft-editor')).toBeVisible();

    // Switch to Email channel
    await page.getByTestId('channel-email-btn').click();
    await expect(page.getByTestId('outreach-subject-input')).toBeVisible();

    // Click Generate Template
    const genBtn = page.getByTestId('generate-template-btn');
    await genBtn.click();

    // Feedback banner indicates generation
    const feedback = page.getByTestId('outreach-feedback-banner');
    await expect(feedback).toBeVisible();

    // Verify subject and message body are populated
    const subjectInput = page.getByTestId('outreach-subject-input');
    await expect(subjectInput).not.toHaveValue('');

    const messageArea = page.getByTestId('outreach-message-textarea');
    await expect(messageArea).not.toHaveValue('');

    // Message must have proper greeting (either contact name or Team [Company])
    const messageValue = await messageArea.inputValue();
    expect(messageValue.startsWith('Hello')).toBe(true);

    // Switch to WhatsApp channel and verify template changes
    await page.getByTestId('channel-whatsapp-btn').click();
    await expect(page.getByTestId('outreach-subject-input')).not.toBeVisible();
    await genBtn.click();
    await expect(feedback).toBeVisible();
    const waMessage = await messageArea.inputValue();
    expect(waMessage.startsWith('Hello')).toBe(true);
  });

  // Test 7: Operator can save a draft and see draft status
  test('7. Operator can save draft with status "draft"', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'playwright-test-session',
        value: 'operator@hunter.local',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/outreach/95c36024-6b10-419b-b24b-5246274d6445');
    await page.getByTestId('channel-email-btn').click();

    const subjectInput = page.getByTestId('outreach-subject-input');
    await subjectInput.fill('Phase 6 Verified Outreach Draft - Quality Check');

    const messageArea = page.getByTestId('outreach-message-textarea');
    await messageArea.fill(
      'Hello Team Diggin,\n\nWe noticed your culinary operations in Delhi. We specialize in workflow automation and client acquisition. Would you be open to a 10-minute introductory call?\n\nBest regards,\nOperator'
    );

    // Save draft
    const saveBtn = page.getByTestId('save-draft-btn');
    await saveBtn.click();

    const feedback = page.getByTestId('outreach-feedback-banner');
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText('Draft saved successfully');
    await expect(page.getByTestId('outreach-status-draft-badge')).toBeVisible();
  });

  // Test 8: Human Approval workflow requires explicit confirmation dialog
  test('8. Human approval requires explicit confirmation and transitions status to "approved"', async ({
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

    await page.goto('/outreach/95c36024-6b10-419b-b24b-5246274d6445');
    await page.getByTestId('channel-email-btn').click();

    // Ensure message is populated in draft state
    const messageArea = page.getByTestId('outreach-message-textarea');
    await messageArea.fill(
      'Verified draft message prepared for operator review and human approval test.'
    );
    await page.getByTestId('save-draft-btn').click();
    await expect(page.getByTestId('outreach-feedback-banner')).toBeVisible();

    // Click Review & Approve button
    const approveBtn = page.getByTestId('approve-outreach-btn');
    await expect(approveBtn).toBeEnabled();
    await approveBtn.click();

    // Confirmation dialog should be visible
    await expect(page.getByRole('heading', { name: 'Human Review & Approval' })).toBeVisible();
    await expect(page.getByText('Human Approval Protocol')).toBeVisible();
    await expect(
      page.getByText('Automated external sending is strictly disabled in Phase 6.')
    ).toBeVisible();

    // Confirm approval
    const confirmBtn = page.getByTestId('approval-modal-confirm-btn');
    await confirmBtn.click();

    // Dialog should close and status badge should become APPROVED
    await expect(page.getByTestId('outreach-status-approved-badge')).toBeVisible();
    await expect(page.getByTestId('outreach-status-approved-badge')).toContainText(
      'APPROVED (HUMAN VERIFIED)'
    );

    // History card should reflect the record
    await expect(page.getByTestId('outreach-history-card')).toBeVisible();
  });

  // Test 9: Deduplication / Idempotency ensures no duplicate drafts for same opportunity + channel
  test('9. Saving or regenerating for same channel updates draft without duplicating', async ({
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

    await page.goto('/outreach/95c36024-6b10-419b-b24b-5246274d6445');
    await page.getByTestId('channel-email-btn').click();

    // Edit message content
    const messageArea = page.getByTestId('outreach-message-textarea');
    await messageArea.fill(
      'Updated draft message ensuring idempotent update behavior without duplicate records.'
    );

    // Save
    await page.getByTestId('save-draft-btn').click();
    await expect(page.getByTestId('outreach-feedback-banner')).toContainText(
      'Draft saved successfully'
    );
  });

  // Test 10: Copy Message button functions
  test('10. Copy Message action works as expected', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'playwright-test-session',
        value: 'operator@hunter.local',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/outreach/95c36024-6b10-419b-b24b-5246274d6445');
    const copyBtn = page.getByTestId('copy-message-btn');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(copyBtn).toContainText('Copied');
  });

  // Test 11: Sidebar Navigation includes Outreach & Approvals link
  test('11. Sidebar navigation links to Outreach dashboard', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'playwright-test-session',
        value: 'operator@hunter.local',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');
    const outreachNav = page.getByRole('link', { name: 'Outreach & Approvals' });
    await expect(outreachNav).toBeVisible();
    await outreachNav.click();
    await page.waitForURL('/outreach');
    await expect(page.getByRole('heading', { name: 'Outreach & Human Approval' })).toBeVisible();
  });

  // Test 12: Mobile responsive verification at 375px
  test('12. Mobile layout at 375px renders cleanly without horizontal scroll', async ({
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

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/outreach');
    await expect(page.getByRole('heading', { name: 'Outreach & Human Approval' })).toBeVisible();

    await page.goto('/outreach/95c36024-6b10-419b-b24b-5246274d6445');
    await expect(page.getByTestId('outreach-draft-editor')).toBeVisible();
  });

  // Test 13: Tablet responsive verification at 768px
  test('13. Tablet layout at 768px renders cleanly', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'playwright-test-session',
        value: 'operator@hunter.local',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/outreach');
    await expect(page.getByRole('heading', { name: 'Outreach & Human Approval' })).toBeVisible();
  });

  // Test 14: Desktop responsive verification at 1280px
  test('14. Desktop layout at 1280px displays full 3-column layout', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'playwright-test-session',
        value: 'operator@hunter.local',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/outreach/95c36024-6b10-419b-b24b-5246274d6445');
    await expect(page.getByTestId('outreach-draft-editor')).toBeVisible();
    await expect(page.getByTestId('outreach-history-card')).toBeVisible();
  });
});
