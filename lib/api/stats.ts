import { createAdminClient } from '@/lib/supabase/server';
import type { DashboardStats } from '@/types/api';

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createAdminClient();

  const [jobsRes, leadsRes, newOppsRes, highPriorityRes, companiesRes, contactsRes] =
    await Promise.all([
      supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('type', 'job'),
      supabase.from('opportunities').select('*', { count: 'exact', head: true }).neq('type', 'job'),
      supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'NEW'),
      supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .neq('type', 'job')
        .gte('match_score', 80),
      supabase.from('companies').select('*', { count: 'exact', head: true }),
      supabase.from('contacts').select('*', { count: 'exact', head: true }),
    ]);

  return {
    totalJobs: jobsRes.count ?? 0,
    totalLeads: leadsRes.count ?? 0,
    newOpportunities: newOppsRes.count ?? 0,
    highPriorityLeads: highPriorityRes.count ?? 0,
    totalCompanies: companiesRes.count ?? 0,
    totalContacts: contactsRes.count ?? 0,
  };
}
