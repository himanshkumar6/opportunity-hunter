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

async function dumpDefinitions() {
  const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`;
  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  const spec = await res.json();
  for (const [table, def] of Object.entries(spec.definitions || {})) {
    console.info(`\n=== Table: ${table} ===`);
    for (const [col, colDef] of Object.entries(def.properties || {})) {
      console.info(`  ${col}: ${colDef.type} (${colDef.format || ''}) ${colDef.description || ''}`);
    }
  }
}

dumpDefinitions().catch(console.error);
