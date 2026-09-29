/**
 * Opportunity Hunter — Direct SerpApi Google Maps Client
 * Secure, server-side client with URL sanitization and pagination control.
 */

import type { RawLocalBusiness } from './types';
import { logger } from '@/lib/logger';

export interface SerpApiSearchOptions {
  query: string;
  location: string;
  max_results: number;
}

export interface SerpApiResponse {
  local_results: RawLocalBusiness[];
  total_results?: number;
  pagination?: {
    next?: string;
    current?: number;
  };
}

/**
 * Builds a safe, user-facing Google Maps URL for a business.
 * NEVER returns internal SerpApi endpoints or API URLs.
 */
export function buildSafeGoogleMapsUrl(
  placeId?: string | null,
  dataId?: string | null,
  title?: string | null,
  address?: string | null
): string | null {
  if (placeId && typeof placeId === 'string' && !placeId.includes('serpapi')) {
    return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
  }
  if (dataId && typeof dataId === 'string' && !dataId.includes('serpapi')) {
    return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(dataId)}`;
  }
  if (title && typeof title === 'string') {
    const q = [title.trim(), address?.trim()].filter(Boolean).join(' ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }
  return null;
}

/**
 * Sanitizes a business website URL, preventing accidental exposure of
 * SerpApi proxy URLs, Google Maps links, or embedded API keys.
 */
export function sanitizeWebsiteUrl(rawWebsite?: string | null): string | null {
  if (!rawWebsite || typeof rawWebsite !== 'string') return null;
  const trimmed = rawWebsite.trim();
  if (
    trimmed.includes('serpapi.com') ||
    trimmed.includes('api_key') ||
    trimmed.includes('google.com/maps')
  ) {
    return null;
  }
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Sanitizes raw result data from SerpApi, stripping out internal
 * SerpApi URLs and API keys before database persistence.
 */
export function sanitizeRawData(business: RawLocalBusiness): Record<string, unknown> {
  const sanitized = { ...business };

  // Remove SerpApi internal query links
  delete sanitized.place_id_search;

  // Clean website
  sanitized.website = sanitizeWebsiteUrl(sanitized.website as string);

  // Construct genuine Maps link
  const safeMapsUrl = buildSafeGoogleMapsUrl(
    sanitized.place_id,
    sanitized.data_id,
    sanitized.title,
    sanitized.address
  );
  sanitized.google_maps_url = safeMapsUrl;

  return sanitized as Record<string, unknown>;
}

/**
 * Queries SerpApi Google Maps endpoint with strict pagination and budget conservation.
 */
export async function fetchSerpApiGoogleMaps(
  options: SerpApiSearchOptions
): Promise<RawLocalBusiness[]> {
  const { query, location, max_results } = options;
  const apiKey = process.env.SERPAPI_KEY;

  // Test / Mock mode support for reliable automated CI testing
  if (
    process.env.SERPAPI_MOCK === 'true' ||
    !apiKey ||
    apiKey.startsWith('mock_') ||
    apiKey.startsWith('test_')
  ) {
    return generateMockSerpApiResults(query, location, max_results);
  }

  const results: RawLocalBusiness[] = [];
  let currentStart = 0;
  const pageSize = 20;

  while (results.length < max_results) {
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google_maps');
    url.searchParams.set('type', 'search');
    url.searchParams.set('q', `${query} in ${location}`);
    url.searchParams.set('start', String(currentStart));
    url.searchParams.set('api_key', apiKey);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'No response body');
      logger.error('SerpApi Google Maps request failed:', {
        status: res.status,
        query,
        location,
        error: errText.slice(0, 300),
      });
      throw new Error(`SerpApi request failed with status ${res.status}`);
    }

    const data = (await res.json()) as SerpApiResponse;
    const batch = Array.isArray(data.local_results) ? data.local_results : [];

    if (batch.length === 0) {
      break;
    }

    results.push(...batch);

    // Stop if we satisfied max_results or no more pages exist
    if (results.length >= max_results || !data.pagination?.next) {
      break;
    }

    currentStart += pageSize;
  }

  return results.slice(0, max_results);
}

/**
 * Generates deterministic mock business data for testing without external network dependencies.
 */
export function generateMockSerpApiResults(
  query: string,
  location: string,
  count: number
): RawLocalBusiness[] {
  const cleanCount = Math.max(1, Math.min(count, 50));
  const businesses: RawLocalBusiness[] = [];

  for (let i = 1; i <= cleanCount; i++) {
    const placeId = `ChIJ_mock_${Buffer.from(`${query}_${location}_${i}`).toString('base64url')}`;
    const name = `${query.replace(/\sbusinesses$/i, '')} Pro ${location} #${i}`;
    const hasWebsite = i % 3 !== 0; // 1 in 3 has no website
    const hasSocial = i % 2 === 0;

    businesses.push({
      position: i,
      title: name,
      place_id: placeId,
      data_id: `0xmock${i}`,
      address: `${100 + i}, Commercial Complex, Sector ${i * 2}, ${location}`,
      phone: `+91 98765 4321${i % 10}`,
      website: hasWebsite ? `https://${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : null,
      description: `Premier provider of ${query} solutions and services in ${location}.`,
      type: `${query} Service`,
      types: [query, 'Business Service'],
      rating: 4.2 + (i % 8) * 0.1,
      reviews: 15 + i * 12,
      facebook: hasSocial ? `https://facebook.com/biz${i}` : undefined,
      instagram: hasSocial ? `https://instagram.com/biz${i}` : undefined,
    });
  }

  return businesses;
}
