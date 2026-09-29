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

async function testEndpoints() {
  const urls = [
    `${env.NEXT_PUBLIC_SUPABASE_URL}/pg/query`,
    `${env.NEXT_PUBLIC_SUPABASE_URL}/pg/meta`,
    `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`,
    `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/execute`,
    `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/run_query`,
    `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/query`,
    `${env.NEXT_PUBLIC_SUPABASE_URL}/api/v1/query`,
  ];
  for (const u of urls) {
    try {
      const res = await fetch(u, {
        method: 'POST',
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: 'SELECT 1;' }),
      });
      console.info(`${u} -> status: ${res.status}`);
      if (res.ok) {
        console.info(`RESPONSE: ${await res.text()}`);
      }
    } catch (e) {
      console.info(`${u} -> error: ${e.message}`);
    }
  }
}

testEndpoints().catch(console.error);
