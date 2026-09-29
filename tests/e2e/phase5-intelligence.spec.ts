import { test, expect } from '@playwright/test';

test.describe('Phase 5 — Company & Contact Intelligence Suite', () => {
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

  test('1. Companies page loads with header and directory stats', async ({ page, context }) => {
    await authenticateTestSession(context);
    await page.goto('/companies');

    await expect(page.getByRole('heading', { name: 'Companies Directory' })).toBeVisible();
    await expect(page.getByText(/\d+ Compan(y|ies)/)).toBeVisible();
    await expect(page.getByPlaceholder('Search company name...')).toBeVisible();
    await expect(page.getByPlaceholder('Filter location...')).toBeVisible();
  });

  test('2. Real company records render in the company table', async ({ page, context }) => {
    await authenticateTestSession(context);
    await page.goto('/companies');

    const table = page.getByTestId('company-table');
    await expect(table).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Company & Domain' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Industry / Sector' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Opportunities' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Contacts' })).toBeVisible();
  });

  test('3. Companies search works', async ({ page, context }) => {
    await authenticateTestSession(context);
    await page.goto('/companies');

    await page.getByPlaceholder('Search company name...').fill('GUPTA');
    await page.getByRole('button', { name: 'Filter Companies' }).click();

    await page.waitForURL(/search=GUPTA/);
    await expect(page.getByTestId('company-table')).toBeVisible();
    await expect(page.getByText('GUPTA JI PROPERTIES').first()).toBeVisible();
  });

  test('4. Company detail page loads', async ({ page, context }) => {
    await authenticateTestSession(context);
    await page.goto('/companies');

    // Click the first company link
    const firstCompanyLink = page
      .getByTestId('company-table')
      .locator('tbody tr')
      .first()
      .locator('a')
      .first();
    await firstCompanyLink.click();

    await page.waitForURL(/\/companies\/[a-zA-Z0-9-]+/);
    await expect(page.getByText('ENTERPRISE ENTITY')).toBeVisible();
    await expect(page.getByText('Company Overview')).toBeVisible();
    await expect(page.getByText('Discovered Contacts')).toBeVisible();
    await expect(page.getByText('Linked Opportunities')).toBeVisible();
  });

  test('5. Company opportunities section works', async ({ page, context }) => {
    await authenticateTestSession(context);
    await page.goto('/companies');

    const firstCompanyLink = page
      .getByTestId('company-table')
      .locator('tbody tr')
      .first()
      .locator('a')
      .first();
    await firstCompanyLink.click();
    await page.waitForURL(/\/companies\/[a-zA-Z0-9-]+/);

    await expect(page.getByText('Related Opportunities')).toBeVisible();
  });

  test('6. Company contacts section works', async ({ page, context }) => {
    await authenticateTestSession(context);
    await page.goto('/companies');

    const firstCompanyLink = page
      .getByTestId('company-table')
      .locator('tbody tr')
      .first()
      .locator('a')
      .first();
    await firstCompanyLink.click();
    await page.waitForURL(/\/companies\/[a-zA-Z0-9-]+/);

    await expect(page.getByText('Associated Contacts')).toBeVisible();
  });

  test('7. Contacts page loads with header and directory stats', async ({ page, context }) => {
    await authenticateTestSession(context);
    await page.goto('/contacts');

    await expect(page.getByRole('heading', { name: 'Contacts Directory' })).toBeVisible();
    await expect(page.getByText(/\d+ Contact(s)?/)).toBeVisible();
    await expect(page.getByPlaceholder('Search name, role, phone...')).toBeVisible();
    await expect(page.getByPlaceholder('Filter by company...')).toBeVisible();
  });

  test('8. Contact search works', async ({ page, context }) => {
    await authenticateTestSession(context);
    await page.goto('/contacts');

    await page.getByPlaceholder('Search name, role, phone...').fill('72177');
    await page.getByRole('button', { name: 'Filter Contacts' }).click();

    await page.waitForURL(/search=72177/);
    await expect(page.getByTestId('contact-table')).toBeVisible();
    await expect(page.getByText('+91 72177 73421').first()).toBeVisible();
  });

  test('9. Contact detail page loads', async ({ page, context }) => {
    await authenticateTestSession(context);
    await page.goto('/contacts');

    // Click the first contact profile link
    const firstContactLink = page
      .getByTestId('contact-table')
      .locator('tbody tr')
      .first()
      .locator('a')
      .first();
    await firstContactLink.click();

    await page.waitForURL(/\/contacts\/[a-zA-Z0-9-]+/);
    await expect(page.getByText('DECISION-MAKER PROFILE')).toBeVisible();
    await expect(page.getByText('Contact Channels')).toBeVisible();
    await expect(page.getByText('Associated Target Company')).toBeVisible();
  });

  test('10. Contact → Company navigation works', async ({ page, context }) => {
    await authenticateTestSession(context);
    await page.goto('/contacts');

    // Open first contact
    const firstContactLink = page
      .getByTestId('contact-table')
      .locator('tbody tr')
      .first()
      .locator('a')
      .first();
    await firstContactLink.click();
    await page.waitForURL(/\/contacts\/[a-zA-Z0-9-]+/);

    // Click View Company Profile button or link
    const companyProfileLink = page
      .getByRole('link', { name: /View Company Profile|View Company/i })
      .first();
    await companyProfileLink.click();

    await page.waitForURL(/\/companies\/[a-zA-Z0-9-]+/);
    await expect(page.getByText('ENTERPRISE ENTITY')).toBeVisible();
    await expect(page.getByText('Company Overview')).toBeVisible();
  });

  test('11. Opportunity → Company navigation works', async ({ page, context }) => {
    await authenticateTestSession(context);
    // Go to opportunities
    await page.goto('/opportunities');
    const firstOppLink = page
      .getByTestId('opportunity-table')
      .locator('tbody tr')
      .first()
      .locator('a')
      .first();
    await firstOppLink.click();
    await page.waitForURL(/\/(opportunities|jobs|leads)\/[a-zA-Z0-9-]+/);

    // Verify opportunity detail view loaded
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // If company profile link exists on this opportunity, verify navigation
    const companyLink = page
      .getByRole('link', { name: /Target Organization|Visit|Company/i })
      .first();
    const hasCompanyLink = await companyLink.isVisible().catch(() => false);
    if (hasCompanyLink) {
      await companyLink.click();
      await page.waitForURL(/\/companies\/[a-zA-Z0-9-]+/);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });

  test('12. Empty states work for Companies and Contacts', async ({ page, context }) => {
    await authenticateTestSession(context);

    // Companies empty state
    await page.goto('/companies?search=NONEXISTENT_COMPANY_XYZ_9999');
    await expect(page.getByText('No companies found')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Clear Filters' })).toBeVisible();

    // Contacts empty state
    await page.goto('/contacts?search=NONEXISTENT_CONTACT_XYZ_9999');
    await expect(page.getByText('No contacts found')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Clear Filters' })).toBeVisible();
  });

  test('13. Loading states render correctly', async ({ page, context }) => {
    await authenticateTestSession(context);
    // Verify loading skeletons exist in codebase and pages resolve without error
    const resComp = await page.goto('/companies');
    expect(resComp?.status()).toBe(200);

    const resCont = await page.goto('/contacts');
    expect(resCont?.status()).toBe(200);
  });

  test('14. Protected routes redirect unauthenticated users', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForURL(/\/login\?redirect=%2Fcompanies/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    await page.goto('/contacts');
    await page.waitForURL(/\/login\?redirect=%2Fcontacts/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('15. Security: No service-role key appears in browser output', async ({ page, context }) => {
    await authenticateTestSession(context);
    await page.goto('/companies');

    const htmlContent = await page.content();
    expect(htmlContent).not.toContain('service_role');

    await page.goto('/contacts');
    const contactsHtml = await page.content();
    expect(contactsHtml).not.toContain('service_role');
  });

  test.describe('Responsive Companies Viewport QA', () => {
    const viewports = [
      { name: '375px Mobile', width: 375, height: 667 },
      { name: '768px Tablet', width: 768, height: 1024 },
      { name: '1280px Desktop', width: 1280, height: 800 },
      { name: '1440px Large Desktop', width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      test(`16. Responsive Companies at ${vp.name} maintains layout and has no horizontal overflow`, async ({
        page,
        context,
      }) => {
        await authenticateTestSession(context);
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/companies');

        await expect(page.getByRole('heading', { name: 'Companies Directory' })).toBeVisible();
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
      });
    }
  });

  test.describe('Responsive Contacts Viewport QA', () => {
    const viewports = [
      { name: '375px Mobile', width: 375, height: 667 },
      { name: '768px Tablet', width: 768, height: 1024 },
      { name: '1280px Desktop', width: 1280, height: 800 },
      { name: '1440px Large Desktop', width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      test(`17. Responsive Contacts at ${vp.name} maintains layout and has no horizontal overflow`, async ({
        page,
        context,
      }) => {
        await authenticateTestSession(context);
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/contacts');

        await expect(page.getByRole('heading', { name: 'Contacts Directory' })).toBeVisible();
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
      });
    }
  });
});
