/**
 * Opportunity Hunter — Lead Deduplication & Qualification Engine
 * Deterministic matching rules to prevent duplicate companies, contacts, and opportunities.
 */

import * as crypto from 'crypto';
import type { Company, Contact, Opportunity } from '@/types/database';
import type { EvaluatedLead, LeadHuntInput, RawLocalBusiness, SanitizedRawResult } from './types';
import { buildSafeGoogleMapsUrl, sanitizeRawData, sanitizeWebsiteUrl } from './serpapi';

export const GENERIC_DOMAINS = new Set([
  'sites.google.com',
  'google.com',
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'youtube.com',
  'whatsapp.com',
  'wa.me',
  'bit.ly',
  'linktr.ee',
]);

/**
 * Normalizes a website URL into a canonical domain for company matching.
 */
export function normalizeDomain(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  try {
    let u = url.trim();
    if (!u.startsWith('http://') && !u.startsWith('https://')) {
      u = 'https://' + u;
    }
    const parsed = new URL(u);
    let hostname = parsed.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }
    return hostname;
  } catch {
    const firstPart = url.split('/')[0] || '';
    return url
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(firstPart, firstPart.trim());
  }
}

/**
 * Normalizes a company name by removing legal entity suffixes and non-alphanumeric chars.
 */
export function normalizeName(name?: string | null): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/\bpvt\b/g, '')
    .replace(/\bltd\b/g, '')
    .replace(/\bprivate\b/g, '')
    .replace(/\blimited\b/g, '')
    .replace(/\bllp\b/g, '')
    .replace(/\binc\b/g, '')
    .replace(/\bcorp\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Normalizes a phone number to its last 10 digits.
 */
export function normalizePhone(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Generates the deterministic deduplication key for a company.
 * Domain is prioritized if not a generic social/builder domain;
 * otherwise normalized business name is used.
 */
export function getEntityKey(name?: string | null, website?: string | null): string {
  const domain = normalizeDomain(website);
  const normName = normalizeName(name);
  if (domain && !GENERIC_DOMAINS.has(domain)) {
    return 'domain:' + domain;
  }
  return 'name:' + normName;
}

export interface DeduplicationContext {
  existingCompanies: Company[];
  existingContacts: Contact[];
  existingOpportunities: Opportunity[];
}

export interface DeduplicationResult {
  sanitizedRawResults: SanitizedRawResult[];
  qualifiedLeads: EvaluatedLead[];
  newCompanies: Array<{
    id: string;
    name: string;
    website: string | null;
    location: string | null;
    industry: string | null;
    source_url: string | null;
  }>;
  newContacts: Array<{
    id: string;
    company_id: string;
    name: string | null;
    role: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    source_url: string | null;
    confidence: number | null;
  }>;
  newOpportunities: Array<{
    id: string;
    company_id: string;
    title: string;
    type: 'business_lead';
    location: string | null;
    description: string;
    source: 'google_maps';
    source_url: string | null;
    match_score: number;
    status: 'new';
  }>;
}

/**
 * Evaluates raw SerpApi results, applies qualification rules, and deduplicates against
 * existing database state.
 */
export function processAndDeduplicateLeads(
  rawBusinesses: RawLocalBusiness[],
  input: LeadHuntInput,
  searchRunId: string,
  context: DeduplicationContext
): DeduplicationResult {
  const { existingCompanies, existingContacts, existingOpportunities } = context;
  const {
    max_results,
    no_website: filterNoWebsite,
    seo_opportunity: filterSeoOpp,
    social_opportunity: filterSocialOpp,
  } = input;

  // 1. Build lookup index for existing companies
  const companyLookup = new Map<string, Company>();
  for (const c of existingCompanies) {
    const key = getEntityKey(c.name, c.website);
    if (!companyLookup.has(key)) {
      companyLookup.set(key, c);
    }
  }

  // 2. Build lookup index for existing contacts (company_id + normalized phone)
  const contactLookup = new Set<string>();
  for (const c of existingContacts) {
    if (c.company_id && c.phone) {
      const p = normalizePhone(c.phone);
      if (p) contactLookup.add(`${c.company_id}|${p}`);
    }
  }

  // 3. Build lookup index for existing business_lead opportunities
  const opportunityLookup = new Set<string>();
  for (const o of existingOpportunities) {
    if (o.company_id && (o.type === 'business_lead' || o.type === 'website_opportunity')) {
      opportunityLookup.add(o.company_id);
    }
  }

  const sanitizedRawResults: SanitizedRawResult[] = [];
  const qualifiedLeads: EvaluatedLead[] = [];
  const newCompanies: DeduplicationResult['newCompanies'] = [];
  const newContacts: DeduplicationResult['newContacts'] = [];
  const newOpportunities: DeduplicationResult['newOpportunities'] = [];

  const seenInCurrentRun = new Set<string>();

  for (let index = 0; index < rawBusinesses.length; index++) {
    const raw = rawBusinesses[index];
    if (!raw) continue;

    const title = String(raw.title || '').trim();
    if (!title) continue;

    const placeId = raw.place_id || null;
    const dataId = raw.data_id || null;
    const address = raw.address || null;
    const phone = raw.phone || null;
    const industry = raw.type || (Array.isArray(raw.types) ? raw.types[0] : null) || null;
    const location = address || input.city || null;

    // Clean website & Google Maps URL
    const website = sanitizeWebsiteUrl(raw.website || raw.link);
    const googleMapsUrl = buildSafeGoogleMapsUrl(placeId, dataId, title, address);

    const sanitizedData = sanitizeRawData(raw);

    // Save raw result
    sanitizedRawResults.push({
      search_run_id: searchRunId,
      title,
      url: website,
      google_maps_url: googleMapsUrl,
      snippet: raw.description || address || raw.type || null,
      position: raw.position || index + 1,
      raw_data: sanitizedData,
    });

    // Deduplicate within the current execution run
    const entityKey = getEntityKey(title, website);
    if (seenInCurrentRun.has(entityKey)) {
      continue;
    }
    seenInCurrentRun.add(entityKey);

    // Stop qualification if we've satisfied max_results
    if (qualifiedLeads.length >= max_results) {
      continue;
    }

    // Qualification 1: Website
    const trimmedWeb = String(website || '').trim();
    let websiteStatus: 'found' | 'not_found' | 'unknown' = 'not_found';
    let websiteOpp = false;
    if (trimmedWeb) {
      if (trimmedWeb.startsWith('http://') || trimmedWeb.startsWith('https://')) {
        websiteStatus = 'found';
      } else {
        websiteStatus = 'unknown';
      }
    }
    if (websiteStatus === 'not_found') {
      websiteOpp = true;
    }

    // Qualification 2: SEO
    const rating = Number(raw.rating || 0);
    const reviews = Number(raw.reviews || 0);
    let seoOpp = false;
    const seoReasons: string[] = [];
    if (websiteStatus === 'not_found') {
      seoOpp = true;
      seoReasons.push('No website found');
    }
    if (websiteStatus === 'found') {
      seoReasons.push('Website found - SEO audit pending');
    }
    if (rating >= 4 && reviews >= 20) {
      seoReasons.push('Established Google Maps presence');
    }

    // Qualification 3: Social
    const possibleLinks = [
      raw.facebook,
      raw.instagram,
      raw.linkedin,
      raw.youtube,
      raw.twitter,
      raw.x,
      raw.social_links,
    ];
    const socialLinks: string[] = [];
    for (const v of possibleLinks) {
      if (Array.isArray(v))
        socialLinks.push(...v.filter((x): x is string => typeof x === 'string' && Boolean(x)));
      else if (typeof v === 'string' && v.trim()) socialLinks.push(v.trim());
    }
    const uniqueSocial = [...new Set(socialLinks)];
    const socialStatus: 'found' | 'not_found' = uniqueSocial.length > 0 ? 'found' : 'not_found';
    const socialOpp = uniqueSocial.length === 0;
    const socialReason = socialOpp
      ? 'No social profile found in business data'
      : 'Social profile found';

    // Lead scoring
    let score = 0;
    const reasons: string[] = [];
    if (websiteStatus === 'not_found') {
      score += 30;
      reasons.push('No website found');
    }
    if (seoOpp) {
      score += 25;
      reasons.push('SEO opportunity detected');
    }
    if (socialOpp) {
      score += 20;
      reasons.push('Social media opportunity detected');
    }
    if (phone) {
      score += 10;
      reasons.push('Phone number available');
    }
    if (rating >= 4.5) {
      score += 10;
      reasons.push(`Strong Google rating (${rating})`);
    }
    if (reviews >= 100) {
      score += 5;
      reasons.push(`Strong review volume (${reviews})`);
    }

    let priority: 'high' | 'medium' | 'low' = 'low';
    if (score >= 70) priority = 'high';
    else if (score >= 40) priority = 'medium';

    // Respect user-selected qualification filters
    if (filterNoWebsite && websiteStatus !== 'not_found') {
      continue;
    }
    if (filterSeoOpp && !seoOpp) {
      continue;
    }
    if (filterSocialOpp && !socialOpp) {
      continue;
    }

    // Deduplicate / Reuse Company
    let companyId: string;
    let isNewCompany = false;
    if (companyLookup.has(entityKey)) {
      const existing = companyLookup.get(entityKey)!;
      companyId = existing.id;
    } else {
      companyId = crypto.randomUUID();
      isNewCompany = true;
      const newComp = {
        id: companyId,
        name: title,
        website,
        location,
        industry,
        source_url: googleMapsUrl,
      };
      companyLookup.set(entityKey, newComp as Company);
      newCompanies.push(newComp);
    }

    // Deduplicate / Create Contact
    let isNewContact = false;
    let contactId: string | null = null;
    const normP = normalizePhone(phone);
    if (normP) {
      const contactKey = `${companyId}|${normP}`;
      if (!contactLookup.has(contactKey)) {
        isNewContact = true;
        contactId = crypto.randomUUID();
        contactLookup.add(contactKey);
        newContacts.push({
          id: contactId,
          company_id: companyId,
          name: null,
          role: null,
          email: null,
          phone,
          whatsapp: null,
          source_url: googleMapsUrl,
          confidence: phone ? 0.8 : null,
        });
      }
    }

    // Deduplicate / Create Opportunity
    let isNewOpportunity = false;
    let opportunityId: string | null = null;
    if (!opportunityLookup.has(companyId)) {
      isNewOpportunity = true;
      opportunityId = crypto.randomUUID();
      opportunityLookup.add(companyId);
      newOpportunities.push({
        id: opportunityId,
        company_id: companyId,
        title: `${priority.toUpperCase()} Lead Opportunity`,
        type: 'business_lead',
        location,
        description: reasons.join('; '),
        source: 'google_maps',
        source_url: googleMapsUrl,
        match_score: score,
        status: 'new',
      });
    }

    qualifiedLeads.push({
      search_run_id: searchRunId,
      company_id: companyId,
      contact_id: contactId,
      opportunity_id: opportunityId,
      is_new_company: isNewCompany,
      is_new_contact: isNewContact,
      is_new_opportunity: isNewOpportunity,

      company_name: title,
      website,
      phone,
      address,
      location,
      industry,
      source_url: googleMapsUrl,
      raw_data: sanitizedData,

      website_status: websiteStatus,
      website_opportunity: websiteOpp,

      google_rating: rating || null,
      google_reviews: reviews,
      seo_opportunity: seoOpp,
      seo_reason: seoReasons.join('; '),

      social_status: socialStatus,
      social_opportunity: socialOpp,
      social_links: uniqueSocial,
      social_reason: socialReason,

      lead_score: score,
      lead_priority: priority,
      score_reasons: reasons.join('; '),

      contact_name: null,
      contact_role: null,
      contact_email: null,
      contact_phone: phone,
      contact_whatsapp: null,
      contact_confidence: phone ? 0.8 : null,

      opp_title: `${priority.toUpperCase()} Lead Opportunity`,
      opp_type: 'business_lead',
      opp_match_score: score,
    });
  }

  return {
    sanitizedRawResults,
    qualifiedLeads,
    newCompanies,
    newContacts,
    newOpportunities,
  };
}
