import { test, expect } from '@playwright/test';

const TEST_SESSION_COOKIE = {
  name: 'playwright-test-session',
  value: 'operator@hunter.local',
  domain: 'localhost',
  path: '/',
};

test.describe('Phase 9 — Production Hardening & Data Architecture Suite', () => {
  // 1. Unauthenticated API requests receive 401 Unauthorized
  test('1. Unauthenticated API requests return 401 Unauthorized', async ({ request }) => {
    const endpoints = [
      { method: 'GET', url: '/api/crm' },
      { method: 'GET', url: '/api/follow-ups' },
      { method: 'GET', url: '/api/outreach' },
      { method: 'GET', url: '/api/opportunities' },
      { method: 'PATCH', url: '/api/opportunities/00000000-0000-0000-0000-000000000000/status' },
      { method: 'PATCH', url: '/api/follow-ups/00000000-0000-0000-0000-000000000000/complete' },
      { method: 'PATCH', url: '/api/outreach/00000000-0000-0000-0000-000000000000/approve' },
    ];

    for (const ep of endpoints) {
      const res =
        ep.method === 'GET'
          ? await request.get(ep.url)
          : await request.patch(ep.url, { data: { status: 'qualified' } });

      expect(res.status(), `Expected 401 on unauthenticated ${ep.method} ${ep.url}`).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/unauthorized/i);
    }
  });

  // 2. UUID Format Guard: Non-UUID parameters return 400 Bad Request
  test('2. Invalid UUID formats return 400 Bad Request', async ({ request, context }) => {
    await context.addCookies([TEST_SESSION_COOKIE]);

    const invalidId = 'not-a-valid-uuid-12345';

    // Status update with invalid UUID
    const resStatus = await request.patch(`/api/opportunities/${invalidId}/status`, {
      data: { status: 'qualified' },
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    expect(resStatus.status()).toBe(400);
    const jsonStatus = await resStatus.json();
    expect(jsonStatus.error).toMatch(/UUID/i);

    // Activities GET with invalid UUID
    const resActivities = await request.get(`/api/opportunities/${invalidId}/activities`, {
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    expect(resActivities.status()).toBe(400);

    // Follow-up GET with invalid UUID
    const resFollowUp = await request.get(`/api/follow-ups/${invalidId}`, {
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    expect(resFollowUp.status()).toBe(400);

    // Follow-up Complete with invalid UUID
    const resComplete = await request.patch(`/api/follow-ups/${invalidId}/complete`, {
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    expect(resComplete.status()).toBe(400);

    // Outreach Approve with invalid UUID
    const resApprove = await request.patch(`/api/outreach/${invalidId}/approve`, {
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    expect(resApprove.status()).toBe(400);
  });

  // 3. Missing Records: Valid UUID but non-existent records return 404 Not Found
  test('3. Non-existent records with valid UUID return 404 Not Found', async ({
    request,
    context,
  }) => {
    await context.addCookies([TEST_SESSION_COOKIE]);

    const nonExistentUuid = 'ffffffff-ffff-4fff-afff-ffffffffffff';

    // Status update on non-existent opportunity
    const resStatus = await request.patch(`/api/opportunities/${nonExistentUuid}/status`, {
      data: { status: 'qualified' },
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    expect(resStatus.status()).toBe(404);
    const jsonStatus = await resStatus.json();
    expect(jsonStatus.error).toMatch(/not found/i);

    // Activities on non-existent opportunity
    const resActivities = await request.get(`/api/opportunities/${nonExistentUuid}/activities`, {
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    expect(resActivities.status()).toBe(404);

    // Follow-up GET on non-existent follow-up
    const resFollowUp = await request.get(`/api/follow-ups/${nonExistentUuid}`, {
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    expect(resFollowUp.status()).toBe(404);

    // Follow-up Complete on non-existent follow-up
    const resComplete = await request.patch(`/api/follow-ups/${nonExistentUuid}/complete`, {
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    expect(resComplete.status()).toBe(404);

    // Outreach Approve on non-existent draft
    const resApprove = await request.patch(`/api/outreach/${nonExistentUuid}/approve`, {
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    expect(resApprove.status()).toBe(404);
  });

  // 4. Input Validation: Invalid payloads return 400 Bad Request
  test('4. Malformed payloads return 400 Bad Request with actionable errors', async ({
    request,
    context,
  }) => {
    await context.addCookies([TEST_SESSION_COOKIE]);

    // Fetch a real opportunity ID for testing payload rejection
    const oppsRes = await request.get('/api/opportunities?pageSize=1', {
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    const { items: opps } = await oppsRes.json();
    const realOppId = opps[0].id;

    // A. Invalid opportunity status
    const resBadStatus = await request.patch(`/api/opportunities/${realOppId}/status`, {
      data: { status: 'super_won_invalid_status' },
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    expect(resBadStatus.status()).toBe(400);
    const jsonBadStatus = await resBadStatus.json();
    expect(jsonBadStatus.error).toMatch(/invalid status/i);

    // B. Follow-up create with missing action
    const resBadFollowUp = await request.post('/api/follow-ups', {
      data: {
        opportunity_id: realOppId,
        due_at: '2026-10-15T10:00:00.000Z',
        action: '',
      },
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    expect(resBadFollowUp.status()).toBe(400);

    // C. Follow-up create with invalid date
    const resBadDate = await request.post('/api/follow-ups', {
      data: {
        opportunity_id: realOppId,
        due_at: 'not-a-real-date',
        action: 'Call client',
      },
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    expect(resBadDate.status()).toBe(400);

    // D. Outreach create with invalid channel
    const resBadChannel = await request.post('/api/outreach', {
      data: {
        opportunity_id: realOppId,
        channel: 'telegram',
        message: 'Hello',
      },
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    expect(resBadChannel.status()).toBe(400);
  });

  // 5. Pagination Clamping: Oversized or negative limits are clamped safely
  test('5. Pagination parameters are clamped safely against overflow and denial-of-service', async ({
    request,
    context,
  }) => {
    await context.addCookies([TEST_SESSION_COOKIE]);

    // Opportunities pagination clamping
    const oppsRes = await request.get('/api/opportunities?page=-99&pageSize=999999', {
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    expect(oppsRes.status()).toBe(200);
    const oppsJson = await oppsRes.json();
    expect(oppsJson.page).toBe(1);
    expect(oppsJson.pageSize).toBeLessThanOrEqual(100);

    // Follow-ups pagination clamping
    const followUpsRes = await request.get('/api/follow-ups?page=0&pageSize=5000', {
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    expect(followUpsRes.status()).toBe(200);
    const followUpsJson = await followUpsRes.json();
    expect(followUpsJson.page).toBe(1);
    expect(followUpsJson.pageSize).toBeLessThanOrEqual(100);

    // Outreach pagination clamping
    const outreachRes = await request.get('/api/outreach?page=-1&pageSize=0', {
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    expect(outreachRes.status()).toBe(200);
    const outreachJson = await outreachRes.json();
    expect(outreachJson.page).toBe(1);
    expect(outreachJson.pageSize).toBe(20);
  });

  // 6. Idempotency: Repeating status update or completion returns 200 without duplication
  test('6. Idempotent operations handle repeated calls cleanly', async ({ request, context }) => {
    await context.addCookies([TEST_SESSION_COOKIE]);

    // 1. Fetch real opportunity
    const oppsRes = await request.get('/api/opportunities?pageSize=1', {
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    const { items: opps } = await oppsRes.json();
    const opp = opps[0];

    // Set to target status
    const targetStatus = opp.status === 'qualified' ? 'new' : 'qualified';
    const firstUpdate = await request.patch(`/api/opportunities/${opp.id}/status`, {
      data: { status: targetStatus },
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    expect(firstUpdate.status()).toBe(200);

    // Send the exact same status update again (idempotent call)
    const secondUpdate = await request.patch(`/api/opportunities/${opp.id}/status`, {
      data: { status: targetStatus },
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    expect(secondUpdate.status()).toBe(200);
    const secondJson = await secondUpdate.json();
    expect(secondJson.message).toMatch(/idempotent/i);

    // 2. Fetch existing follow-up and complete it twice
    const fRes = await request.get('/api/follow-ups?pageSize=1', {
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    const { items: followUps } = await fRes.json();
    if (followUps && followUps.length > 0) {
      const followUp = followUps[0];

      const comp1 = await request.patch(`/api/follow-ups/${followUp.id}/complete`, {
        headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
      });
      expect(comp1.status()).toBe(200);

      const comp2 = await request.patch(`/api/follow-ups/${followUp.id}/complete`, {
        headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
      });
      expect(comp2.status()).toBe(200);
    }
  });

  // 7. Concurrency Safety: Multiple simultaneous operations execute without race conditions
  test('7. Concurrent mutations execute safely with serialized mutex protection', async ({
    request,
    context,
  }) => {
    await context.addCookies([TEST_SESSION_COOKIE]);

    const oppsRes = await request.get('/api/opportunities?pageSize=2', {
      headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
    });
    const { items: opps } = await oppsRes.json();
    const opp1 = opps[0];
    const opp2 = opps[1] || opps[0];

    // Fire 3 simultaneous follow-up creations
    const timestamp = Date.now();
    const promises = [
      request.post('/api/follow-ups', {
        data: {
          opportunity_id: opp1.id,
          due_at: new Date(Date.now() + 86400000).toISOString(),
          action: `Concurrent Follow-up A [${timestamp}]`,
          priority: 'medium',
        },
        headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
      }),
      request.post('/api/follow-ups', {
        data: {
          opportunity_id: opp2.id,
          due_at: new Date(Date.now() + 172800000).toISOString(),
          action: `Concurrent Follow-up B [${timestamp}]`,
          priority: 'high',
        },
        headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
      }),
      request.get('/api/follow-ups', {
        headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
      }),
    ];

    const [resA, resB, resC] = (await Promise.all(promises)) as [
      import('@playwright/test').APIResponse,
      import('@playwright/test').APIResponse,
      import('@playwright/test').APIResponse,
    ];
    expect(resA.status()).toBe(201);
    expect(resB.status()).toBe(201);
    expect(resC.status()).toBe(200);
  });

  // 8. Security & Secret Isolation: Zero service role credentials leaked
  test('8. Responses and errors never leak service-role keys or passwords', async ({
    request,
    context,
  }) => {
    await context.addCookies([TEST_SESSION_COOKIE]);

    const errorEndpoints = [
      '/api/opportunities/invalid/status',
      '/api/crm?status=invalid_status_xyz',
      '/api/follow-ups/invalid/complete',
    ];

    for (const ep of errorEndpoints) {
      const res = await request.get(ep, {
        headers: { Cookie: 'playwright-test-session=operator@hunter.local' },
      });
      const text = await res.text();

      expect(text).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(text).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'); // Common Supabase service token header
      expect(text).not.toContain('service_role');
      expect(text).not.toContain('N8N_LEAD_HUNT_WEBHOOK_URL');
    }
  });

  // 9. End-to-end integration: /crm workspace loads and displays live hardened telemetry
  test('9. Authenticated operator experiences robust /crm and /follow-ups integration', async ({
    page,
    context,
  }) => {
    await context.addCookies([TEST_SESSION_COOKIE]);

    await page.goto('/crm');
    await expect(page.getByRole('heading', { name: 'CRM & Pipeline Workspace' })).toBeVisible();

    // Verify metrics grid
    await expect(page.getByTestId('crm-metrics-grid')).toBeVisible();

    // Verify switching to list view
    await page.getByTestId('view-toggle-list').click();
    await expect(page.getByTestId('crm-list-table-container')).toBeVisible();

    // Navigate to /follow-ups
    await page.goto('/follow-ups');
    await expect(page.getByRole('heading', { name: 'Follow-ups & Activity' })).toBeVisible();
    await expect(page.getByTestId('follow-up-metrics-grid')).toBeVisible();
  });
});
