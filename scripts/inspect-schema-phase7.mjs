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

async function inspectSchema() {
  console.info('--- Checking tables in Supabase ---');
  const candidateTables = [
    'companies',
    'contacts',
    'opportunities',
    'outreach',
    'search_runs',
    'raw_search_results',
    'follow_ups',
    'activities',
    'notes',
    'tasks',
    'reminders',
  ];

  for (const t of candidateTables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.info(`Table '${t}': NOT FOUND or ERROR (${error.message})`);
    } else {
      console.info(`Table '${t}': EXISTS (returned ${data.length} rows)`);
      if (data.length > 0) {
        console.info(`  Sample keys for '${t}':`, Object.keys(data[0]));
      }
    }
  }

  // Also check column names of opportunities and outreach to see if follow_up or activity fields exist
  const { data: oppSample } = await supabase.from('opportunities').select('*').limit(1);
  if (oppSample && oppSample.length > 0) {
    console.info('Opportunity columns:', Object.keys(oppSample[0]));
  }

  const { data: outreachSample } = await supabase.from('outreach').select('*').limit(1);
  if (outreachSample && outreachSample.length > 0) {
    console.info('Outreach columns:', Object.keys(outreachSample[0]));
  }
}

inspectSchema().catch(console.error);
