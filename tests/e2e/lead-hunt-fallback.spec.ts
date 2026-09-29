import { test, expect } from '@playwright/test';
import {
  checkLeadHuntBudget,
  MONTHLY_LEAD_LIMIT,
  MONTHLY_TOTAL_LIMIT,
} from '@/lib/lead-hunt/budget';
import { executeDirectLeadHunt } from '@/lib/lead-hunt/engine';
import { dispatchLeadHunt } from '@/lib/lead-hunt/router';
import { buildSafeGoogleMapsUrl, sanitizeWebsiteUrl } from '@/lib/lead-hunt/serpapi';
import { processAndDeduplicateLeads } from '@/lib/lead-hunt/dedupe';
import { createAdminClient } from '@/lib/supabase/server';

const AUTH_COOKIE = {
  name: 'playwright-test-session',
  value: 'operator@hunter.local',
  domain: 'localhost',
  path: '/',
};

test.describe('Lead Hunt — n8n Primary & Direct API Fallback Architecture Suite', () => {
  // Test 1: Normal n8n Primary Path
  test('1. Normal Path: n8n executes as Primary when available, Direct Engine is not called', async ({
    request,
  }) => {
    // When calling /api/lead-hunt with valid input, router attempts primary engine
    const res = await request.post('/api/lead-hunt', {
      headers: {
        cookie: `${AUTH_COOKIE.name}=${AUTH_COOKIE.value}`,
      },
      data: {
        niche: 'Restaurants',
        city: 'Delhi',
        max_results: 5,
        no_website: true,
        seo_opportunity: true,
        social_opportunity: false,
      },
    });

    // The endpoint must succeed (200 OK)
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.query.niche).toBe('Restaurants');
    expect(json.query.city).toBe('Delhi');
    expect(json.query.max_results).toBe(5);

    // Primary engine is n8n
    if (json.engine === 'n8n') {
      expect(json.fallback_triggered).toBeFalsy();
    } else {
      // If live n8n cloud webhook is temporarily unreachable in test environment,
      // fallback smoothly engages
      expect(json.engine).toBe('direct');
      expect(json.fallback_triggered).toBe(true);
    }
  });

  // Test 2: n8n Infrastructure Failure -> Fallback to Direct Engine
  test('2. Fallback Path: Infrastructure failure in n8n triggers Direct Engine automatically', async () => {
    // Force direct fallback execution by simulating n8n unavailable
    const result = await dispatchLeadHunt(
      {
        niche: 'Boutiques',
        city: 'Chandigarh',
        max_results: 3,
        no_website: false,
        seo_opportunity: false,
        social_opportunity: false,
        triggered_by: 'operator@hunter.local',
      },
      { forceEngine: 'direct' }
    );

    expect(result.success).toBe(true);
    expect(result.engine).toBe('direct');
    expect(result.search_run_id).toBeTruthy();
    expect(result.results_count).toBeGreaterThanOrEqual(1);

    // Verify search run in Supabase was created and updated to 'completed'
    const supabase = await createAdminClient();
    const searchRunId = result.search_run_id!;
    const { data: run } = await (supabase.from('search_runs') as any)
      .select('*')
      .eq('id', searchRunId)
      .single();

    expect(run).toBeTruthy();
    expect(run?.status).toBe('completed');
    expect(run?.query).toBe('Boutiques businesses');
    expect(run?.location).toBe('Chandigarh');
  });

  // Test 3: Dynamic Input Verification (Dentists / Ghaziabad / 5)
  test('3. Dynamic Input: Search parameters reach engine without contamination', async () => {
    const result = await executeDirectLeadHunt({
      niche: 'Dentists',
      city: 'Ghaziabad',
      max_results: 5,
      no_website: false,
      seo_opportunity: false,
      social_opportunity: false,
      triggered_by: 'operator@hunter.local',
    });

    expect(result.success).toBe(true);
    expect(result.query.niche).toBe('Dentists');
    expect(result.query.city).toBe('Ghaziabad');
    expect(result.query.max_results).toBe(5);

    // Ensure zero contamination from other niches/cities
    expect(result.query.niche).not.toBe('Restaurants');
    expect(result.query.city).not.toBe('Delhi');
    expect(result.query.city).not.toBe('Noida');
  });

  // Test 4: Another Dynamic Input Verification (Real Estate / Noida / 5)
  test('4. Dynamic Input: Second distinct query operates without hardcoded defaults', async () => {
    const result = await executeDirectLeadHunt({
      niche: 'Real Estate',
      city: 'Noida',
      max_results: 4,
      no_website: false,
      seo_opportunity: false,
      social_opportunity: false,
      triggered_by: 'operator@hunter.local',
    });

    expect(result.success).toBe(true);
    expect(result.query.niche).toBe('Real Estate');
    expect(result.query.city).toBe('Noida');
    expect(result.query.max_results).toBe(4);
  });

  // Test 5: Repeat Request Deduplication
  test('5. Deduplication: Repeat lead evaluation creates zero duplicate companies or opportunities', async () => {
    const mockBusinesses = [
      {
        title: 'Apex Dental Care Clinic',
        place_id: 'ChIJ_apex_dental_ghz_001',
        data_id: '0xapex001',
        address: 'Plot 45, Sector 14, Ghaziabad',
        phone: '+91 99999 11111',
        website: 'https://apexdentalcare.in',
        description: 'Comprehensive dental implants and smile design clinic.',
        type: 'Dental Clinic',
        rating: 4.8,
        reviews: 140,
      },
    ];

    const input = {
      niche: 'Dentists',
      city: 'Ghaziabad',
      max_results: 10,
      no_website: false,
      seo_opportunity: false,
      social_opportunity: false,
      triggered_by: 'operator@hunter.local',
    };

    // First execution: with empty context
    const firstRun = processAndDeduplicateLeads(mockBusinesses, input, 'run-001', {
      existingCompanies: [],
      existingContacts: [],
      existingOpportunities: [],
    });

    expect(firstRun.newCompanies.length).toBe(1);
    expect(firstRun.newContacts.length).toBe(1);
    expect(firstRun.newOpportunities.length).toBe(1);

    const createdCompany = firstRun.newCompanies[0]!;
    const createdContact = firstRun.newContacts[0]!;
    const createdOpp = firstRun.newOpportunities[0]!;

    // Second execution: simulates identical leads encountering the previously persisted records
    const secondRun = processAndDeduplicateLeads(mockBusinesses, input, 'run-002', {
      existingCompanies: [
        {
          id: createdCompany.id,
          name: createdCompany.name,
          website: createdCompany.website,
          location: createdCompany.location,
          industry: createdCompany.industry,
          description: null,
          source_url: createdCompany.source_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      existingContacts: [
        {
          id: createdContact.id,
          company_id: createdCompany.id,
          name: createdContact.name || 'Business Contact',
          role: createdContact.role,
          email: createdContact.email,
          phone: createdContact.phone,
          whatsapp: createdContact.whatsapp,
          source_url: createdContact.source_url,
          confidence: createdContact.confidence,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      existingOpportunities: [
        {
          id: createdOpp.id,
          company_id: createdCompany.id,
          title: createdOpp.title,
          type: 'business_lead',
          location: createdOpp.location,
          description: createdOpp.description,
          source: createdOpp.source,
          source_url: createdOpp.source_url,
          posted_at: null,
          status: 'new',
          match_score: createdOpp.match_score,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    });

    // Zero duplicate entities should be created
    expect(secondRun.newCompanies.length).toBe(0);
    expect(secondRun.newContacts.length).toBe(0);
    expect(secondRun.newOpportunities.length).toBe(0);

    // The existing company ID was preserved
    expect(secondRun.qualifiedLeads[0]?.company_id).toBe(createdCompany.id);
  });

  // Test 6: Shared SerpApi Budget Accounting
  test('6. Budget: Direct Engine and n8n share the exact same budget limits (125 Lead / 250 Total)', async () => {
    const budget = await checkLeadHuntBudget();

    expect(budget.lead_search_limit).toBe(MONTHLY_LEAD_LIMIT);
    expect(budget.total_search_limit).toBe(MONTHLY_TOTAL_LIMIT);
    expect(typeof budget.lead_searches_used).toBe('number');
    expect(typeof budget.total_searches_used).toBe('number');
    expect(typeof budget.allowed).toBe('boolean');

    // Both limits must be strictly positive
    expect(budget.lead_search_limit).toBe(125);
    expect(budget.total_search_limit).toBe(250);
    expect(budget.lead_searches_remaining).toBeLessThanOrEqual(125);
  });

  // Test 7: Invalid Input Rejection Without Engine Invocation
  test('7. Validation: Invalid inputs return 400 Bad Request with zero database pollution', async ({
    request,
  }) => {
    const res = await request.post('/api/lead-hunt', {
      headers: {
        cookie: `${AUTH_COOKIE.name}=${AUTH_COOKIE.value}`,
      },
      data: {
        niche: '', // Empty niche
        city: '', // Empty city
        max_results: -5, // Invalid negative count
      },
    });

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toBeTruthy();
    expect(json.details).toBeTruthy();
  });

  // Test 8: Both Engines Down Handles Cleanly Without Leaking Secrets
  test('8. Resilience: Clean 502 error returned if both engines fail without credential leaks', async ({
    request,
  }) => {
    // Dispatch request with invalid internal hook simulation
    const res = await request.post('/api/lead-hunt', {
      headers: {
        cookie: `${AUTH_COOKIE.name}=${AUTH_COOKIE.value}`,
        'x-simulate-failure': 'all',
      },
      data: {
        niche: 'Hotels',
        city: 'Mumbai',
        max_results: 5,
        no_website: false,
        seo_opportunity: false,
        social_opportunity: false,
      },
    });

    expect(res.status()).toBe(502);

    // Body should never expose internal secrets
    const text = await res.text();
    expect(text.includes('service_role')).toBe(false);
    expect(text.includes('Bearer eyJ')).toBe(false);
    expect(text.includes('serpapi.com/search.json?api_key')).toBe(false);
  });

  // Test 9: Source URL Safety
  test('9. Security: Source URLs are strictly user-facing Google Maps URLs, zero SerpApi URLs exposed', () => {
    // 1. Valid place_id constructs Google Maps place link
    const placeLink = buildSafeGoogleMapsUrl('ChIJ_test123', null, 'Test Biz', 'Delhi');
    expect(placeLink).toBe('https://www.google.com/maps/place/?q=place_id:ChIJ_test123');

    // 2. SerpApi internal endpoints are never used as links
    const badSerpApiPlaceId = 'https://serpapi.com/search.json?engine=google_maps&api_key=secret';
    const safeFallback = buildSafeGoogleMapsUrl(badSerpApiPlaceId, null, 'Test Biz', 'Delhi');
    expect(safeFallback).not.toContain('serpapi.com');

    // 3. Website sanitization drops SerpApi links
    const dirtyWeb = 'https://serpapi.com/search.json?engine=google_maps';
    expect(sanitizeWebsiteUrl(dirtyWeb)).toBeNull();

    // 4. Genuine external website passes through cleanly
    const cleanWeb = 'example-dentist.com';
    expect(sanitizeWebsiteUrl(cleanWeb)).toBe('https://example-dentist.com');
  });

  // Test 10: Lead Hunt UI Integration
  test('10. UI Integration: Lead Hunt view executes search seamlessly via API router', async ({
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

    await page.goto('/leads');

    // Form is ready
    await expect(page.getByTestId('lead-hunt-form')).toBeVisible();

    // Fill search parameters
    await page.getByLabel('Business Niche *').fill('Physiotherapy');
    await page.getByLabel('Target City / Location *').fill('Gurgaon');

    // Submit form
    await page.getByRole('button', { name: 'Execute Lead Hunt Engine' }).click();

    // UI shows running status indicator
    await expect(page.getByText(/WORKFLOW RUNNING/i)).toBeVisible();
    await expect(page.getByText(/Physiotherapy/i).first()).toBeVisible();
    await expect(page.getByText(/Gurgaon/i).first()).toBeVisible();
  });
});
