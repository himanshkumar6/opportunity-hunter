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

async function inspectDb() {
  console.info('=== SUPABASE DATABASE AUDIT ===\n');

  const { count: outreachCount, data: outreachRows, error: oErr } = await supabase
    .from('outreach')
    .select('*', { count: 'exact' });

  const { count: companyCount, error: cErr } = await supabase
    .from('companies')
    .select('id', { count: 'exact', head: true });

  const { count: oppCount, error: oppErr } = await supabase
    .from('opportunities')
    .select('id', { count: 'exact', head: true });

  const { count: contactCount, error: conErr } = await supabase
    .from('contacts')
    .select('id', { count: 'exact', head: true });

  console.info(`Companies total: ${companyCount}`);
  console.info(`Opportunities total: ${oppCount}`);
  console.info(`Contacts total: ${contactCount}`);
  console.info(`Outreach rows total: ${outreachCount}\n`);

  console.info('Recent Outreach Records:');
  (outreachRows || []).slice(-10).forEach((r) => {
    console.info(`- ID: ${r.id} | OppID: ${r.opportunity_id} | Channel: ${r.channel} | Status: ${r.status} | Created: ${r.created_at} | Updated: ${r.updated_at}`);
  });
}

inspectDb().catch(console.error);
