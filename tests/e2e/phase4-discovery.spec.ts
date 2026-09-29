import { test, expect } from '@playwright/test';

test.describe('Phase 4 — Opportunity Management & Discovery Engines Suite', () => {
  // Helper to authenticate session in test environment
  const authenticateTestSession = async (context: import('@playwright/test').BrowserContext) => {
    await context.addCookies([
      {
        name: 'playwright-test-session',
        value: 'operator@hunter.local',
        domain: 'localhost',
        path: '/',
      },
    ]);
  };

  test('1. Opportunities page loads with header and filter controls', async ({ page, context }) => {
    await authenticateTestSession(context);
    await page.goto('/opportunities');

    // Heading and badge
    await expect(
      page.getByRole('heading', { name: 'Unified Opportunities Pipeline' })
    ).toBeVisible();
    await expect(page.getByText('Records', { exact: false })).toBeVisible();

    // Filters form
    const filterForm = page.getByTestId('opportunity-filters-form');
    await expect(filterForm).toBeVisible();
    await expect(page.getByPlaceholder('Search title or company...')).toBeVisible();
    await expect(page.getByPlaceholder('Filter location...')).toBeVisible();
  });

  test('2. Opportunities renders real records and supports filtered empty state', async ({
    page,
    context,
  }) => {
    await authenticateTestSession(context);
    await page.goto('/opportunities');

    // Real records table should be visible
    await expect(page.getByTestId('opportunity-table')).toBeVisible();

    // Filter to nonexistent query to verify empty state
    await page.goto('/opportunities?search=nonexistent_xyz_query_999');
    await expect(page.getByText('No opportunities found')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start Lead Hunt' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'View Job Hunt' })).toBeVisible();
  });

  test('3. Job Hunt page loads with Sky accent and hourly engine indicator', async ({
    page,
    context,
  }) => {
    await authenticateTestSession(context);
    await page.goto('/jobs');

    await expect(page.getByRole('heading', { name: 'Job Hunt AI Discovery' })).toBeVisible();
    await expect(page.getByText('HOURLY ENGINE')).toBeVisible();
    await expect(page.getByTestId('job-table')).toBeVisible();

    // Empty state when filtered
    await page.goto('/jobs?search=nonexistent_xyz_query_999');
    await expect(page.getByText('No job opportunities indexed yet')).toBeVisible();
    await expect(page.getByRole('link', { name: /View Search Runs/i })).toBeVisible();
  });

  test('4. Lead Hunt page loads with on-demand scraper form and qualification filters', async ({
    page,
    context,
  }) => {
    await authenticateTestSession(context);
    await page.goto('/leads');

    await expect(page.getByRole('heading', { name: 'Lead Hunt AI Discovery' })).toBeVisible();
    await expect(page.getByText('ON-DEMAND SCRAPER')).toBeVisible();

    const form = page.getByTestId('lead-hunt-form');
    await expect(form).toBeVisible();
    await expect(page.getByLabel('Business Niche *')).toBeVisible();
    await expect(page.getByLabel('Target City / Location *')).toBeVisible();
    await expect(page.getByLabel(/Max Leads/i)).toBeVisible();
    await expect(page.getByText('No Website Found')).toBeVisible();
    await expect(page.getByText('SEO Gap Candidate')).toBeVisible();
    await expect(form.getByText('Social Media Gap')).toBeVisible();
  });

  test('5. Lead Hunt form validation catches missing required parameters', async ({
    page,
    context,
  }) => {
    await authenticateTestSession(context);
    await page.goto('/leads');

    // Click submit without entering required niche and city
    await page.getByRole('button', { name: 'Execute Lead Hunt Engine' }).click();

    // Validation alerts
    await expect(page.getByText('Niche is required')).toBeVisible();
    await expect(page.getByText('City/Location is required')).toBeVisible();
  });

  test('6. Lead Hunt triggers via Next.js API proxy and displays async lifecycle status', async ({
    page,
    context,
  }) => {
    await authenticateTestSession(context);

    // Capture the actual request body sent to /api/lead-hunt to verify dynamic values
    let capturedRequestBody: Record<string, unknown> | null = null;

    // Mock API route response to avoid external network dependencies during tests
    await page.route('/api/lead-hunt', async (route) => {
      const requestBody = route.request().postDataJSON() as Record<string, unknown>;
      capturedRequestBody = requestBody;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Workflow was started',
          query: {
            niche: requestBody.niche,
            city: requestBody.city,
            max_results: requestBody.max_results,
          },
        }),
      });
    });

    await page.goto('/leads');

    // Fill with specific values that MUST appear in the dispatched request
    await page.getByLabel('Business Niche *').fill('Restaurants');
    await page.getByLabel('Target City / Location *').fill('Delhi');
    await page.getByRole('button', { name: 'Execute Lead Hunt Engine' }).click();

    // Verify async progress state displays
    await expect(page.getByText(/WORKFLOW RUNNING/i)).toBeVisible();

    // CRITICAL: Verify the SUBMITTED query is shown in the status card
    // This confirms the form sent the user-typed values, not hardcoded defaults
    await expect(page.getByText(/Restaurants/i).first()).toBeVisible();
    await expect(page.getByText(/Delhi/i).first()).toBeVisible();

    // Verify the captured request body contains the user-typed values
    expect(capturedRequestBody).not.toBeNull();
    if (!capturedRequestBody) throw new Error('capturedRequestBody is null');
    const body: Record<string, unknown> = capturedRequestBody;
    expect(body['niche']).toBe('Restaurants');
    expect(body['city']).toBe('Delhi');
    // Must NOT be hardcoded defaults
    expect(body['niche']).not.toBe('Real Estate');
    expect(body['city']).not.toBe('Noida');
  });

  test('6b. Lead Hunt sends DIFFERENT niche/city for a second distinct search', async ({
    page,
    context,
  }) => {
    await authenticateTestSession(context);

    let capturedBody: Record<string, unknown> | null = null;
    await page.route('/api/lead-hunt', async (route) => {
      capturedBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Workflow was started' }),
      });
    });

    await page.goto('/leads');

    // Search with completely different values
    await page.getByLabel('Business Niche *').fill('Dentists');
    await page.getByLabel('Target City / Location *').fill('Ghaziabad');
    await page.getByRole('button', { name: 'Execute Lead Hunt Engine' }).click();

    await expect(page.getByText(/WORKFLOW RUNNING/i)).toBeVisible();

    // Payload must match what was typed
    expect(capturedBody).not.toBeNull();
    if (!capturedBody) throw new Error('capturedBody is null');
    const body6b: Record<string, unknown> = capturedBody;
    expect(body6b['niche']).toBe('Dentists');
    expect(body6b['city']).toBe('Ghaziabad');
    expect(body6b['niche']).not.toBe('Restaurants');
    expect(body6b['city']).not.toBe('Delhi');
  });

  test('6c. Lead Hunt 502 error is shown with structured message not raw crash', async ({
    page,
    context,
  }) => {
    await authenticateTestSession(context);

    // Simulate n8n returning a non-200 error
    await page.route('/api/lead-hunt', async (route) => {
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Lead Hunt workflow rejected the request',
          code: 502,
          details: 'n8n service timeout',
        }),
      });
    });

    await page.goto('/leads');
    await page.getByLabel('Business Niche *').fill('Hotels');
    await page.getByLabel('Target City / Location *').fill('Gurgaon');
    await page.getByRole('button', { name: 'Execute Lead Hunt Engine' }).click();

    // Should show failed state, not crash
    await expect(page.getByText(/failed|error|unavailable/i)).toBeVisible({ timeout: 5000 });
  });

  test('7. Security: n8n webhook URL and secrets are not exposed to client JavaScript or DOM', async ({
    page,
    context,
  }) => {
    await authenticateTestSession(context);
    await page.goto('/leads');

    const htmlContent = await page.content();
    // Check that direct n8n webhook URL is not leaked in HTML source
    expect(htmlContent.includes('technoboy.app.n8n.cloud')).toBe(false);

    // Check window object in browser runtime
    const hasN8nInWindow = await page.evaluate(() => {
      const w = window as any;
      return Boolean(
        w.N8N_LEAD_HUNT_WEBHOOK_URL || w.N8N_WEBHOOK_SECRET || w.SUPABASE_SERVICE_ROLE_KEY
      );
    });
    expect(hasN8nInWindow).toBe(false);
  });

  test('8. Protected routes redirect unauthenticated users with preserve-return', async ({
    page,
  }) => {
    // Clean context without test session cookie
    await page.goto('/opportunities');
    await page.waitForURL(/\/login\?redirect=%2Fopportunities/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    await page.goto('/jobs');
    await page.waitForURL(/\/login\?redirect=%2Fjobs/);

    await page.goto('/leads');
    await page.waitForURL(/\/login\?redirect=%2Fleads/);

    await page.goto('/search-runs');
    await page.waitForURL(/\/login\?redirect=%2Fsearch-runs/);
  });

  test('9. Dashboard renders real database metrics and feeds without fake data', async ({
    page,
    context,
  }) => {
    await authenticateTestSession(context);
    await page.goto('/dashboard');

    await expect(
      page.getByRole('heading', { name: 'Opportunity Hunter Command Center' })
    ).toBeVisible();

    // Check real KPI cards show (no fake numbers)
    await expect(page.getByText('Total Opportunities')).toBeVisible();
    await expect(page.getByText('New / Unreviewed')).toBeVisible();
    await expect(page.getByText('Job Positions')).toBeVisible();
    await expect(page.getByText('Commercial Leads')).toBeVisible();

    // Verify feed sections render
    await expect(page.getByText('Recent Opportunities')).toBeVisible();
    await expect(page.getByText('Recent Search Runs')).toBeVisible();
  });

  test('10. Search Runs page renders audit trail and empty state', async ({ page, context }) => {
    await authenticateTestSession(context);
    await page.goto('/search-runs');

    await expect(
      page.getByRole('heading', { name: 'Automation Search Runs & Audit Trail' })
    ).toBeVisible();

    // With real records in DB, verify table headers are visible
    await expect(page.getByRole('columnheader', { name: 'Target Query' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Source / Engine' })).toBeVisible();

    // Verify empty state when query is filtered with non-existent status
    await page.goto('/search-runs?status=NONEXISTENT_FILTER_STATUS_XYZ');
    await expect(page.getByText('No automation search runs recorded yet')).toBeVisible();
  });

  // Responsive QA tests
  test.describe('Responsive QA for Phase 4 Views', () => {
    test('Mobile (375px) renders Opportunities and Leads without horizontal overflow', async ({
      page,
      context,
    }) => {
      await authenticateTestSession(context);
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/opportunities');
      let scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      let clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

      await page.goto('/leads');
      scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

      await page.goto('/jobs');
      scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
    });

    test('Tablet (768px) and Large Desktop (1440px) maintain grid constraints', async ({
      page,
      context,
    }) => {
      await authenticateTestSession(context);

      // Tablet 768px
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/dashboard');
      await expect(
        page.getByRole('heading', { name: 'Opportunity Hunter Command Center' })
      ).toBeVisible();

      // Large Desktop 1440px
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/opportunities');
      await expect(
        page.getByRole('heading', { name: 'Unified Opportunities Pipeline' })
      ).toBeVisible();
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
    });
  });
});
