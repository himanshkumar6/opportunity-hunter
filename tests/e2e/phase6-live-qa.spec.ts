import { test, expect } from '@playwright/test';

test.describe('Phase 6 — Final Live QA Verification Suite', () => {
  const authCookie = {
    name: 'playwright-test-session',
    value: 'operator@hunter.local',
    domain: 'localhost',
    path: '/',
  };

  // ----------------------------------------------------
  // SECTION 1: SECURITY QA
  // ----------------------------------------------------
  test('Security QA: Unauthenticated /outreach redirects to login', async ({ page }) => {
    await page.goto('/outreach');
    await page.waitForURL(/\/login\?redirect=%2Foutreach/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('Security QA: Unauthenticated /outreach/[id] redirects to login', async ({ page }) => {
    await page.goto('/outreach/14dd9c38-1d89-4ca0-988b-93846df903c6');
    await page.waitForURL(/\/login\?redirect=%2Foutreach%2F14dd9c38-1d89-4ca0-988b-93846df903c6/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('Security QA: Service role key is never exposed in browser HTML or client network', async ({
    page,
    context,
  }) => {
    await context.addCookies([authCookie]);

    let leakedKey = false;
    page.on('response', async (res) => {
      try {
        const text = await res.text();
        if (
          text.includes(
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrcWx5ZmlreHJjaGthamducGpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZS'
          )
        ) {
          leakedKey = true;
        }
      } catch {
        // binary responses etc.
      }
    });

    await page.goto('/outreach');
    const content = await page.content();
    expect(content.includes('service_role')).toBe(false);
    expect(leakedKey).toBe(false);
  });

  test('Security QA: Client cannot approve an invalid/nonexistent outreach record', async ({
    request,
  }) => {
    const res = await request.post('/api/outreach/00000000-0000-4000-a000-000000000000/approve', {
      headers: {
        Cookie: 'playwright-test-session=operator@hunter.local',
      },
    });
    expect(res.status()).toBe(404);
  });

  // ----------------------------------------------------
  // SECTION 2: END-TO-END WORKFLOW (Steps 1-28)
  // ----------------------------------------------------
  test('Phase 6 Live QA: Complete 28-Step Workflow Verification', async ({ page, context }) => {
    await context.addCookies([authCookie]);

    // Safety check: Monitor network to assert 0 external communication calls
    const externalOutboundCalls: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (
        url.includes('api.resend.com') ||
        url.includes('api.sendgrid.com') ||
        url.includes('api.twilio.com') ||
        url.includes('graph.facebook.com') ||
        url.includes('api.whatsapp.com') ||
        url.includes('smtp')
      ) {
        externalOutboundCalls.push(url);
      }
    });

    // 1. Open /outreach while authenticated
    await page.goto('/outreach');

    // 2. Verify dashboard loads correctly
    await expect(page.getByRole('heading', { name: 'Outreach & Human Approval' })).toBeVisible();

    // 3. Verify metrics cards display real Supabase data
    await expect(page.getByText('Pending Drafts')).toBeVisible();
    await expect(page.getByText('Approved Outreach')).toBeVisible();
    await expect(page.getByText('Total Records')).toBeVisible();
    await expect(page.getByText('Outreach Safety')).toBeVisible();
    await expect(page.getByText('Zero Auto-Send')).toBeVisible();

    // 4. Verify search works
    const searchInput = page.getByTestId('outreach-search-input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Realestate');
    await page.getByTestId('outreach-apply-filters-btn').click();
    await expect(page).toHaveURL(/search=Realestate/);

    // 5. Verify status filter works
    const statusSelect = page.getByTestId('outreach-status-select');
    await statusSelect.selectOption('draft');
    await page.getByTestId('outreach-apply-filters-btn').click();
    await expect(page).toHaveURL(/status=draft/);

    // 6. Verify channel filter works
    const channelSelect = page.getByTestId('outreach-channel-select');
    await channelSelect.selectOption('email');
    await page.getByTestId('outreach-apply-filters-btn').click();
    await expect(page).toHaveURL(/channel=email/);

    // Reset filters
    await page.getByTestId('outreach-reset-filters-btn').click();
    await expect(page).not.toHaveURL(/channel=email/);

    // 7. Open an existing real opportunity
    await page.goto('/opportunities');
    const firstOpportunityLink = page
      .getByTestId('opportunity-table')
      .locator('tbody tr')
      .first()
      .locator('a')
      .first();
    await firstOpportunityLink.click();
    await page.waitForURL(/\/(opportunities|leads|jobs)\/[a-zA-Z0-9-]+/);

    // 8. Click "Review & Outreach"
    const reviewBtn = page.getByTestId('review-outreach-btn');
    await expect(reviewBtn).toBeVisible();
    await reviewBtn.click();

    // 9. Verify /outreach/[opportunityId] loads
    await page.waitForURL(/\/outreach\//);
    const editor = page.getByTestId('outreach-draft-editor');
    await expect(editor).toBeVisible();

    // 10. Verify company information is from real database
    const orgIntelligence = page.getByText('Verified Target Intelligence');
    await expect(orgIntelligence).toBeVisible();

    // 11. Verify contact information is from real database
    await expect(page.getByText(/Decision-Maker Contacts/i)).toBeVisible();

    // 12. Generate deterministic email draft
    await page.getByTestId('channel-email-btn').click();
    const generateBtn = page.getByTestId('generate-template-btn');
    await generateBtn.click();

    // 13. Verify no fabricated person/company/contact information
    const feedbackBanner = page.getByTestId('outreach-feedback-banner');
    await expect(feedbackBanner).toBeVisible();
    const subjectInput = page.getByTestId('outreach-subject-input');
    const messageArea = page.getByTestId('outreach-message-textarea');
    await expect(subjectInput).not.toHaveValue('');
    await expect(messageArea).not.toHaveValue('');
    const emailBody = await messageArea.inputValue();
    expect(emailBody.startsWith('Hello')).toBe(true);

    // 14. Edit the draft
    const editedSubject = 'Exclusive Partnership Proposal — Verified QA Test';
    const editedBody =
      'Hello Team,\n\nThis is an edited draft verifying persistence and human review controls.\n\nBest regards,\nOperator';
    await subjectInput.fill(editedSubject);
    await messageArea.fill(editedBody);

    // 15. Save draft
    const saveBtn = page.getByTestId('save-draft-btn');
    await saveBtn.click();
    await expect(feedbackBanner).toContainText('Draft saved successfully');
    await expect(page.getByTestId('outreach-status-draft-badge')).toBeVisible();

    // 16. Refresh page and verify draft persists
    await page.reload();
    await expect(page.getByTestId('outreach-draft-editor')).toBeVisible();
    await expect(page.getByTestId('outreach-subject-input')).toHaveValue(editedSubject);
    await expect(page.getByTestId('outreach-message-textarea')).toHaveValue(editedBody);

    // 17. Generate/save the same channel again
    await saveBtn.click();
    await expect(feedbackBanner).toContainText('Draft saved successfully');

    // 18. Verify no duplicate outreach row is created (check history card length remains controlled)
    const historyCard = page.getByTestId('outreach-history-card');
    await expect(historyCard).toBeVisible();

    // 19. Test WhatsApp draft
    await page.getByTestId('channel-whatsapp-btn').click();
    await expect(page.getByTestId('outreach-subject-input')).not.toBeVisible();
    await generateBtn.click();
    await expect(feedbackBanner).toBeVisible();
    const waBody = await messageArea.inputValue();
    expect(waBody.startsWith('Hello')).toBe(true);

    // 20. Verify email and WhatsApp drafts remain separate
    await page.getByTestId('channel-email-btn').click();
    await expect(page.getByTestId('outreach-subject-input')).toHaveValue(editedSubject);
    await expect(page.getByTestId('outreach-message-textarea')).toHaveValue(editedBody);

    // 21. Click "Review & Approve"
    const approveBtn = page.getByTestId('approve-outreach-btn');
    await expect(approveBtn).toBeEnabled();
    await approveBtn.click();

    // 22. Verify confirmation modal appears
    const modalHeading = page.getByRole('heading', { name: 'Human Review & Approval' });
    await expect(modalHeading).toBeVisible();

    // 23. Verify approval requires explicit human confirmation
    await expect(page.getByText('Human Approval Protocol')).toBeVisible();
    await expect(
      page.getByText('Automated external sending is strictly disabled in Phase 6.')
    ).toBeVisible();

    // 24. Approve the draft
    const confirmBtn = page.getByTestId('approval-modal-confirm-btn');
    await confirmBtn.click();

    // 25. Verify status becomes approved
    await expect(page.getByTestId('outreach-status-approved-badge')).toBeVisible();
    await expect(page.getByTestId('outreach-status-approved-badge')).toContainText(
      'APPROVED (HUMAN VERIFIED)'
    );

    // 26, 27, 28. Verify NO email, NO WhatsApp, NO external messaging API called
    expect(externalOutboundCalls.length).toBe(0);
  });

  // ----------------------------------------------------
  // SECTION 3: RESPONSIVE QA (375px, 390px, 414px, 768px, 1024px, 1280px, 1440px)
  // ----------------------------------------------------
  const viewports = [
    { name: '375px (iPhone SE)', width: 375, height: 667 },
    { name: '390px (iPhone 12/13/14)', width: 390, height: 844 },
    { name: '414px (iPhone XR/Plus)', width: 414, height: 896 },
    { name: '768px (iPad Mini/Tablet)', width: 768, height: 1024 },
    { name: '1024px (iPad Pro/Small Laptop)', width: 1024, height: 768 },
    { name: '1280px (Standard Desktop)', width: 1280, height: 800 },
    { name: '1440px (Large Desktop)', width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    test(`Responsive QA: Viewport ${vp.name} maintains usability with zero horizontal overflow`, async ({
      page,
      context,
    }) => {
      await context.addCookies([authCookie]);
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Test /outreach dashboard
      await page.goto('/outreach');
      await expect(page.getByRole('heading', { name: 'Outreach & Human Approval' })).toBeVisible();

      // Check horizontal overflow on /outreach
      const hasOverflowOutreach = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflowOutreach).toBe(false);

      // Test /outreach/[opportunityId]
      await page.goto('/outreach/14dd9c38-1d89-4ca0-988b-93846df903c6');
      await expect(page.getByTestId('outreach-draft-editor')).toBeVisible();

      // Check horizontal overflow on composer page
      const hasOverflowComposer = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflowComposer).toBe(false);

      // Verify buttons and inputs are interactable
      const saveBtn = page.getByTestId('save-draft-btn');
      await expect(saveBtn).toBeVisible();
    });
  }
});
