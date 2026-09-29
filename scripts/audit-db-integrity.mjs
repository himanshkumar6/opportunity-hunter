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

async function runAudit() {
  console.info('=== START DATABASE INTEGRITY AUDIT ===\n');

  // 1. Fetch all records
  const { data: companies, error: cErr } = await supabase.from('companies').select('*');
  const { data: contacts, error: conErr } = await supabase.from('contacts').select('*');
  const { data: opportunities, error: oppErr } = await supabase.from('opportunities').select('*');
  const { data: outreach, error: outErr } = await supabase.from('outreach').select('*');
  const { data: searchRuns, error: srErr } = await supabase.from('search_runs').select('*');

  console.info(`Fetched counts:`);
  console.info(`- Companies: ${companies?.length} (error: ${cErr?.message || 'none'})`);
  console.info(`- Contacts: ${contacts?.length} (error: ${conErr?.message || 'none'})`);
  console.info(`- Opportunities: ${opportunities?.length} (error: ${oppErr?.message || 'none'})`);
  console.info(`- Outreach: ${outreach?.length} (error: ${outErr?.message || 'none'})`);
  console.info(`- Search Runs: ${searchRuns?.length} (error: ${srErr?.message || 'none'})\n`);

  const companyIdSet = new Set(companies?.map((c) => c.id) || []);
  const contactIdSet = new Set(contacts?.map((c) => c.id) || []);
  const opportunityIdSet = new Set(opportunities?.map((o) => o.id) || []);

  // 2. Orphan Checks
  const orphanContacts = (contacts || []).filter((c) => c.company_id && !companyIdSet.has(c.company_id));
  const orphanOpportunities = (opportunities || []).filter((o) => o.company_id && !companyIdSet.has(o.company_id));
  const orphanOutreachOpp = (outreach || []).filter((o) => o.opportunity_id && !opportunityIdSet.has(o.opportunity_id));
  const orphanOutreachContact = (outreach || []).filter((o) => o.contact_id && !contactIdSet.has(o.contact_id));

  console.info('--- Orphan Relationships ---');
  console.info(`- Contacts with non-existent company_id: ${orphanContacts.length}`);
  console.info(`- Opportunities with non-existent company_id: ${orphanOpportunities.length}`);
  console.info(`- Outreach with non-existent opportunity_id: ${orphanOutreachOpp.length}`);
  console.info(`- Outreach with non-existent contact_id: ${orphanOutreachContact.length}\n`);

  // 3. Status Validation
  const validOpportunityStatuses = new Set([
    'new',
    'qualified',
    'approved',
    'contacted',
    'replied',
    'interested',
    'closed',
    'rejected',
  ]);
  const invalidOppStatuses = (opportunities || []).filter((o) => !validOpportunityStatuses.has(o.status));
  console.info('--- Status Validation ---');
  console.info(`- Opportunities with unexpected status: ${invalidOppStatuses.length}`);
  if (invalidOppStatuses.length > 0) {
    const statusCounts = {};
    invalidOppStatuses.forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    console.info(`  Unexpected statuses:`, statusCounts);
  }

  const validOutreachStatuses = new Set(['draft', 'approved', 'sent', 'replied', 'failed']);
  const invalidOutreachStatuses = (outreach || []).filter((o) => !validOutreachStatuses.has(o.status));
  console.info(`- Outreach with unexpected status: ${invalidOutreachStatuses.length}`);

  // 4. Follow-up JSON audit
  let followUps = [];
  let activities = [];
  try {
    followUps = JSON.parse(fs.readFileSync('data/follow-ups.json', 'utf8'));
    activities = JSON.parse(fs.readFileSync('data/activities.json', 'utf8'));
  } catch (e) {
    console.info('Error reading local JSON files:', e.message);
  }

  console.info('\n--- Local Follow-ups & Activities Integrity ---');
  console.info(`- Local Follow-ups: ${followUps.length}`);
  console.info(`- Local Activities: ${activities.length}`);

  const orphanFollowUpsOpp = followUps.filter((f) => f.opportunity_id && !opportunityIdSet.has(f.opportunity_id));
  const orphanFollowUpsContact = followUps.filter((f) => f.contact_id && !contactIdSet.has(f.contact_id));
  const orphanActivitiesOpp = activities.filter((a) => a.opportunity_id && !opportunityIdSet.has(a.opportunity_id));

  console.info(`- Follow-ups referencing non-existent opportunity: ${orphanFollowUpsOpp.length}`);
  console.info(`- Follow-ups referencing non-existent contact: ${orphanFollowUpsContact.length}`);
  console.info(`- Activities referencing non-existent opportunity: ${orphanActivitiesOpp.length}`);

  // 5. Timestamps check
  const badTimestampsOpp = (opportunities || []).filter((o) => isNaN(new Date(o.created_at).getTime()));
  console.info(`\n- Opportunities with invalid created_at: ${badTimestampsOpp.length}`);

  console.info('\n=== AUDIT COMPLETE ===');
}

runAudit().catch(console.error);
