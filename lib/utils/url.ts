/**
 * URL Utilities & Security Sanitization
 *
 * Guarantees that:
 * 1. SerpApi request URLs, internal endpoints, and API keys are NEVER exposed or rendered.
 * 2. Real Google Maps Place / Search URLs are constructed for business entities.
 * 3. Business websites and Google Maps URLs are kept strictly separated.
 * 4. Fallbacks return null / 'Google Maps unavailable' when no legitimate URL can be formed.
 */

// Blocklist patterns for sensitive, internal, or third-party search provider endpoints
const BLOCKED_URL_PATTERNS = [
  /serpapi\.com/i,
  /api\.serpapi\.com/i,
  /api_key=/i,
  /apikey=/i,
  /service_role/i,
  /supabase\.co\/rest/i,
  /supabase\.co\/auth/i,
  /localhost:\d+/i,
  /127\.0\.0\.1/i,
];

/**
 * Checks if a string contains SerpApi domains, API keys, or internal API endpoints.
 */
export function isInternalOrSecretUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return BLOCKED_URL_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Extracts Google Maps place_id from any string or URL (including legacy SerpApi place_id_search URLs).
 */
export function extractGoogleMapsPlaceId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  // Case 1: place_id parameter in query string (e.g. ?...&place_id=ChIJ...)
  const placeIdParamMatch = url.match(/[?&]place_id=([^\s/?&#"']+)/i);
  if (placeIdParamMatch && placeIdParamMatch[1]) {
    const candidate = decodeURIComponent(placeIdParamMatch[1]).trim();
    if (candidate && !candidate.includes('http') && !candidate.includes('serpapi')) {
      return candidate;
    }
  }

  // Case 2: data_id parameter in query string
  const dataIdParamMatch = url.match(/[?&]data_id=([^\s/?&#"']+)/i);
  if (dataIdParamMatch && dataIdParamMatch[1]) {
    const candidate = decodeURIComponent(dataIdParamMatch[1]).trim();
    if (candidate && !candidate.includes('http') && !candidate.includes('serpapi')) {
      return candidate;
    }
  }

  // Case 3: Google Maps place URL (/maps/place/.../place_id:ChIJ... or /place/?q=place_id:ChIJ...)
  const placeIdMatch = url.match(/place_id:([^\s/?&#"']+)/i);
  if (placeIdMatch && placeIdMatch[1]) {
    const candidate = decodeURIComponent(placeIdMatch[1]).trim();
    if (candidate && !candidate.includes('http') && !candidate.includes('serpapi')) {
      return candidate;
    }
  }

  return null;
}

/**
 * Validates whether a URL is a legitimate public Google Maps URL.
 */
export function isGoogleMapsUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  if (isInternalOrSecretUrl(url)) return false;
  return (
    url.includes('google.com/maps') ||
    url.includes('maps.google.com') ||
    url.includes('goo.gl/maps') ||
    url.includes('maps.app.goo.gl')
  );
}

export interface ResolveGoogleMapsOptions {
  sourceUrl?: string | null;
  placeId?: string | null;
  name?: string | null;
  location?: string | null;
  address?: string | null;
}

/**
 * Resolves a safe, direct Google Maps URL.
 * Never returns a SerpApi URL or API key under any circumstance.
 *
 * Order of priority:
 * 1. If sourceUrl is already a valid Google Maps URL, return it.
 * 2. If sourceUrl contains a place_id parameter (even from legacy SerpApi query), extract place_id and build direct Google Maps Place URL.
 * 3. If explicit placeId is provided, build direct Google Maps Place URL.
 * 4. If business name is provided, construct a Google Maps search URL with name + location.
 * 5. Otherwise return null.
 */
export function resolveGoogleMapsUrl(options: ResolveGoogleMapsOptions): string | null {
  const { sourceUrl, placeId, name, location, address } = options;

  // 1. Check if sourceUrl is already a valid, clean Google Maps URL
  if (sourceUrl && isGoogleMapsUrl(sourceUrl)) {
    return sourceUrl;
  }

  // 2. Check if sourceUrl contains a place_id we can rescue (even if from legacy SerpApi URL)
  const extractedPlaceId = extractGoogleMapsPlaceId(sourceUrl);
  if (extractedPlaceId) {
    return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(extractedPlaceId)}`;
  }

  // 3. Check explicit placeId
  if (placeId && typeof placeId === 'string' && placeId.trim().length > 0) {
    return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId.trim())}`;
  }

  // 4. Construct search URL from business name + location/address if available
  const cleanName = (name || '').trim();
  if (cleanName) {
    const loc = (location || address || '').trim();
    const query = loc ? `${cleanName} ${loc}` : cleanName;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  // 5. No reliable Google Maps target can be determined
  return null;
}

/**
 * Sanitizes a general external website URL (for company website, social links, etc.).
 * Strips blocked domains, credentials, or internal URLs.
 * Ensures http/https protocol.
 */
export function sanitizeExternalUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Block sensitive, SerpApi, or internal endpoints
  if (isInternalOrSecretUrl(trimmed)) {
    return null;
  }

  // Ensure valid protocol
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

/**
 * Sanitizes a company website specifically.
 * Business website must NEVER be a Google Maps URL or SerpApi URL.
 */
export function sanitizeCompanyWebsite(url: string | null | undefined): string | null {
  const sanitized = sanitizeExternalUrl(url);
  if (!sanitized) return null;

  // Company website should not be a Google Maps URL
  if (isGoogleMapsUrl(sanitized)) {
    return null;
  }

  return sanitized;
}
