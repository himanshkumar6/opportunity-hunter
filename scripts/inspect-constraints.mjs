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

async function inspectConstraints() {
  // Let's test what constraints exist on outreach by attempting an insert with a rollback or dummy ID
  const dummyOppId = '00000000-0000-4000-a000-000000000000';
  const { data, error } = await supabase.from('outreach').insert({
    opportunity_id: dummyOppId,
    channel: 'follow_up',
    message: 'test',
    status: 'draft',
  }).select();

  console.info('Test insert with channel=follow_up:', { error: error?.message, code: error?.code });
}

inspectConstraints().catch(console.error);
