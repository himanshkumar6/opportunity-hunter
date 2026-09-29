import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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

async function checkSample() {
  const { data: opps } = await supabase
    .from('opportunities')
    .select('id, title, location, company_id, company:companies(id, name, location, website)')
    .not('company_id', 'is', null)
    .limit(5);

  console.info('Sample opportunities with company:');
  for (const o of opps || []) {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, name, role, email, phone')
      .eq('company_id', o.company_id);
    console.info({
      oppId: o.id,
      title: o.title,
      company: o.company?.name,
      contactsCount: contacts?.length || 0,
      contacts: contacts || []
    });
  }
}

checkSample().catch(console.error);
