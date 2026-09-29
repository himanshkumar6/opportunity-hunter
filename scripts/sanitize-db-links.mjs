import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function extractPlaceId(url) {
  if (!url || typeof url !== 'string') return null;
  const placeIdParam = url.match(/[?&]place_id=([^\s/?&#"']+)/i);
  if (placeIdParam && placeIdParam[1]) {
    const c = decodeURIComponent(placeIdParam[1]).trim();
    if (c && !c.includes('http') && !c.includes('serpapi')) return c;
  }
  const dataIdParam = url.match(/[?&]data_id=([^\s/?&#"']+)/i);
  if (dataIdParam && dataIdParam[1]) {
    const c = decodeURIComponent(dataIdParam[1]).trim();
    if (c && !c.includes('http') && !c.includes('serpapi')) return c;
  }
  const placeIdMatch = url.match(/place_id:([^\s/?&#"']+)/i);
  if (placeIdMatch && placeIdMatch[1]) {
    const c = decodeURIComponent(placeIdMatch[1]).trim();
    if (c && !c.includes('http') && !c.includes('serpapi')) return c;
  }
  return null;
}

function resolveCleanMapsUrl(sourceUrl, name, location) {
  const placeId = extractPlaceId(sourceUrl);
  if (placeId) {
    return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
  }
  if (sourceUrl && (sourceUrl.includes('google.com/maps') || sourceUrl.includes('maps.google.com')) && !sourceUrl.includes('serpapi')) {
    return sourceUrl;
  }
  if (name) {
    const q = [name, location].filter(Boolean).join(' ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }
  return null;
}

async function run() {
  console.info('=== SANITIZING SUPABASE DATABASE RECORDS ===\n');

  // 1. Sanitize companies
  console.info('Inspecting companies...');
  const { data: companies, error: compErr } = await supabase.from('companies').select('*');
  if (compErr) {
    console.error('Error fetching companies:', compErr.message);
  } else {
    let updatedCompanies = 0;
    for (const comp of companies || []) {
      const hasSerpSource = comp.source_url && (comp.source_url.includes('serpapi.com') || comp.source_url.includes('%20https'));
      const hasSerpWeb = comp.website && comp.website.includes('serpapi.com');

      if (hasSerpSource || hasSerpWeb) {
        const cleanMapsUrl = resolveCleanMapsUrl(comp.source_url, comp.name, comp.location);
        const cleanWeb = hasSerpWeb ? null : comp.website;

        const { error: updateErr } = await supabase
          .from('companies')
          .update({
            source_url: cleanMapsUrl,
            website: cleanWeb,
            updated_at: new Date().toISOString(),
          })
          .eq('id', comp.id);

        if (updateErr) {
          console.error(`Failed to update company ${comp.name} (${comp.id}):`, updateErr.message);
        } else {
          updatedCompanies++;
          console.info(`Updated company: ${comp.name} -> Maps: ${cleanMapsUrl}`);
        }
      }
    }
    console.info(`Companies sanitized: ${updatedCompanies}\n`);
  }

  // 2. Sanitize opportunities
  console.info('Inspecting opportunities...');
  const { data: opportunities, error: oppErr } = await supabase.from('opportunities').select('*, company:companies(name, location)');
  if (oppErr) {
    console.error('Error fetching opportunities:', oppErr.message);
  } else {
    let updatedOpps = 0;
    for (const opp of opportunities || []) {
      const hasSerpSource = opp.source_url && (opp.source_url.includes('serpapi.com') || opp.source_url.includes('%20https'));

      if (hasSerpSource) {
        const compName = opp.company?.name || opp.title;
        const compLoc = opp.location || opp.company?.location;
        const cleanMapsUrl = resolveCleanMapsUrl(opp.source_url, compName, compLoc);

        const { error: updateErr } = await supabase
          .from('opportunities')
          .update({
            source_url: cleanMapsUrl,
            source: 'google_maps',
            updated_at: new Date().toISOString(),
          })
          .eq('id', opp.id);

        if (updateErr) {
          console.error(`Failed to update opportunity ${opp.id}:`, updateErr.message);
        } else {
          updatedOpps++;
          console.info(`Updated opportunity: ${opp.title} (${opp.id}) -> Maps: ${cleanMapsUrl}`);
        }
      }
    }
    console.info(`Opportunities sanitized: ${updatedOpps}\n`);
  }

  console.info('=== SANITIZATION COMPLETE ===');
}

run().catch(console.error);
