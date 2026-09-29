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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: companies } = await supabase.from('companies').select('id, name, website, source_url');
  const { data: opportunities } = await supabase.from('opportunities').select('id, title, source_url');

  const leakedCompanies = (companies || []).filter(c =>
    (c.source_url && (c.source_url.includes('serpapi') || c.source_url.includes('api_key'))) ||
    (c.website && (c.website.includes('serpapi') || c.website.includes('api_key')))
  );

  const leakedOpps = (opportunities || []).filter(o =>
    o.source_url && (o.source_url.includes('serpapi') || o.source_url.includes('api_key'))
  );

  console.info('=== SECURITY VERIFICATION ===');
  console.info(`Total companies checked: ${companies?.length || 0}`);
  console.info(`Companies with SerpApi or API keys: ${leakedCompanies.length}`);
  console.info(`Total opportunities checked: ${opportunities?.length || 0}`);
  console.info(`Opportunities with SerpApi or API keys: ${leakedOpps.length}`);

  if (leakedCompanies.length === 0 && leakedOpps.length === 0) {
    console.info('PASSED: Zero SerpApi or API key leaks found in Supabase database.');
  } else {
    console.error('FAILED: Leaks still detected!');
    process.exit(1);
  }
}

check().catch(console.error);
