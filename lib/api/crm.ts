import fs from 'fs';
import path from 'path';
import { createAdminClient } from '@/lib/supabase/server';
import { resolveGoogleMapsUrl, sanitizeCompanyWebsite, sanitizeExternalUrl } from '@/lib/utils';
import type { Company, Contact } from '@/types/database';
import type { OpportunityStatus } from '@/types/opportunities';
import type { FollowUp } from '@/types/follow-ups';
import type {
  CrmOpportunityCard,
  CrmMetrics,
  CrmFilterParams,
  FollowUpState,
  OutreachState,
} from '@/types/crm';

const DATA_DIR = path.join(process.cwd(), 'data');
const FOLLOW_UPS_FILE = path.join(DATA_DIR, 'follow-ups.json');

function readFollowUpsRaw(): FollowUp[] {
  try {
    if (!fs.existsSync(FOLLOW_UPS_FILE)) return [];
    const raw = fs.readFileSync(FOLLOW_UPS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function getCrmData(params: CrmFilterParams = {}): Promise<{
  items: CrmOpportunityCard[];
  metrics: CrmMetrics;
  total: number;
}> {
  const supabase = await createAdminClient();

  // 1. Fetch all opportunities with companies
  const { data: rawOpps, error: oppsError } = await supabase
    .from('opportunities')
    .select('*, company:companies(*)')
    .order('created_at', { ascending: false });

  if (oppsError) {
    if (oppsError.code === 'PGRST205') {
      return {
        items: [],
        metrics: {
          total: 0,
          new: 0,
          qualified: 0,
          approved: 0,
          contacted: 0,
          replied: 0,
          interested: 0,
          closed: 0,
          rejected: 0,
          overdue_follow_ups: 0,
        },
        total: 0,
      };
    }
    throw new Error(`Failed to fetch CRM opportunities: ${oppsError.message}`);
  }

  // 2. Fetch all contacts
  const { data: allContacts } = await supabase.from('contacts').select('*');
  const contactByCompanyMap = new Map<string, Contact>();
  const contactByIdMap = new Map<string, Contact>();

  (allContacts || []).forEach((c: any) => {
    contactByIdMap.set(c.id, c);
    if (c.company_id && !contactByCompanyMap.has(c.company_id)) {
      contactByCompanyMap.set(c.company_id, c);
    }
  });

  // 3. Fetch all outreach records
  const { data: allOutreach } = await supabase
    .from('outreach')
    .select('*')
    .order('created_at', { ascending: false });

  const outreachByOppMap = new Map<string, any[]>();
  (allOutreach || []).forEach((o: any) => {
    const list = outreachByOppMap.get(o.opportunity_id) || [];
    list.push(o);
    outreachByOppMap.set(o.opportunity_id, list);
  });

  // 4. Fetch follow-ups
  const rawFollowUps = readFollowUpsRaw();
  const followUpsByOppMap = new Map<string, FollowUp[]>();
  rawFollowUps.forEach((f) => {
    const list = followUpsByOppMap.get(f.opportunity_id) || [];
    list.push(f);
    followUpsByOppMap.set(f.opportunity_id, list);
  });

  const now = new Date();
  const nowMs = now.getTime();
  const startOfTodayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfTodayMs = startOfTodayMs + 24 * 60 * 60 * 1000 - 1;

  // Initialize metrics
  const metrics: CrmMetrics = {
    total: 0,
    new: 0,
    qualified: 0,
    approved: 0,
    contacted: 0,
    replied: 0,
    interested: 0,
    closed: 0,
    rejected: 0,
    overdue_follow_ups: 0,
  };

  const allCards: CrmOpportunityCard[] = (rawOpps || []).map((row: any) => {
    const comp = row.company || null;
    const cleanWebsite = sanitizeCompanyWebsite(comp?.website);
    const cleanCompanySourceUrl = resolveGoogleMapsUrl({
      sourceUrl: comp?.source_url,
      name: comp?.name,
      location: comp?.location,
    });
    const cleanOppSourceUrl =
      row.source === 'serpapi_maps' ||
      row.source === 'google_maps' ||
      row.type === 'business_lead' ||
      row.type === 'website_opportunity'
        ? resolveGoogleMapsUrl({
            sourceUrl: row.source_url,
            name: comp?.name || row.title,
            location: row.location || comp?.location,
          })
        : sanitizeExternalUrl(row.source_url);

    const sanitizedCompany: Company | null = comp
      ? {
          ...comp,
          website: cleanWebsite,
          source_url: cleanCompanySourceUrl,
        }
      : null;

    // Resolve Contact
    const contact = (comp?.id ? contactByCompanyMap.get(comp.id) : null) || null;

    // Resolve Outreach
    const oppOutreachList = outreachByOppMap.get(row.id) || [];
    const latestOutreachRecord = oppOutreachList.length > 0 ? oppOutreachList[0] : null;

    let outreachState: OutreachState = 'none';
    let latestOutreach: CrmOpportunityCard['latest_outreach'] = null;

    if (latestOutreachRecord) {
      const st = (latestOutreachRecord.status || '').toLowerCase();
      if (st === 'approved') outreachState = 'approved';
      else if (st === 'sent') outreachState = 'sent';
      else if (st === 'replied') outreachState = 'replied';
      else if (st === 'failed') outreachState = 'failed';
      else outreachState = 'draft';

      latestOutreach = {
        id: latestOutreachRecord.id,
        channel: latestOutreachRecord.channel || 'email',
        status: latestOutreachRecord.status,
        subject: latestOutreachRecord.subject || null,
        message: latestOutreachRecord.message || null,
        updated_at: latestOutreachRecord.updated_at || latestOutreachRecord.created_at,
      };
    }

    // Resolve Follow-ups
    const oppFollowUps = followUpsByOppMap.get(row.id) || [];
    // Sort active follow-ups by due_at ascending
    const activeFollowUps = oppFollowUps
      .filter((f) => f.status === 'scheduled')
      .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());

    let nextFollowUp: CrmOpportunityCard['next_follow_up'] = null;
    let followUpState: FollowUpState = 'none';

    if (activeFollowUps.length > 0) {
      const primaryActive = activeFollowUps[0]!;
      const dueMs = new Date(primaryActive.due_at).getTime();
      const isOverdue = dueMs < nowMs;
      const isDueToday = dueMs >= startOfTodayMs && dueMs <= endOfTodayMs;

      if (isOverdue) {
        followUpState = 'overdue';
        metrics.overdue_follow_ups++;
      } else if (isDueToday) {
        followUpState = 'due_today';
      } else {
        followUpState = 'upcoming';
      }

      nextFollowUp = {
        id: primaryActive.id,
        due_at: primaryActive.due_at,
        action: primaryActive.action,
        priority: primaryActive.priority,
        status: primaryActive.status,
        is_overdue: isOverdue,
        is_due_today: isDueToday,
      };
    } else if (oppFollowUps.some((f) => f.status === 'completed')) {
      followUpState = 'completed';
    }

    const normStatus = (row.status || 'new').toLowerCase() as OpportunityStatus;

    // Update status metrics
    metrics.total++;
    switch (normStatus) {
      case 'new':
        metrics.new++;
        break;
      case 'qualified':
        metrics.qualified++;
        break;
      case 'approved':
        metrics.approved++;
        break;
      case 'contacted':
        metrics.contacted++;
        break;
      case 'replied':
        metrics.replied++;
        break;
      case 'interested':
        metrics.interested++;
        break;
      case 'closed':
        metrics.closed++;
        break;
      case 'rejected':
        metrics.rejected++;
        break;
      default:
        metrics.new++;
    }

    return {
      id: row.id,
      company_id: row.company_id,
      title: row.title,
      type: row.type,
      location: row.location,
      description: row.description,
      source: row.source,
      source_url: cleanOppSourceUrl,
      status: normStatus,
      match_score: row.match_score,
      created_at: row.created_at,
      updated_at: row.updated_at,
      company: sanitizedCompany,
      contact,
      latest_outreach: latestOutreach,
      next_follow_up: nextFollowUp,
      follow_up_state: followUpState,
      outreach_state: outreachState,
    };
  });

  // Apply filters in a single O(n) pass, eliminating intermediate array allocations
  const targetStatus =
    params.status && params.status !== 'all' && params.status !== 'ALL'
      ? params.status.toLowerCase()
      : null;
  const targetFollowUpState =
    params.follow_up_state && params.follow_up_state !== 'all'
      ? params.follow_up_state.toLowerCase()
      : null;
  const targetOutreachState =
    params.outreach_state && params.outreach_state !== 'all'
      ? params.outreach_state.toLowerCase()
      : null;
  const targetLocation =
    params.location && params.location.trim().length > 0
      ? params.location.trim().toLowerCase()
      : null;
  const targetSource =
    params.source && params.source !== 'all' ? params.source.toLowerCase() : null;
  const targetSearch =
    params.search && params.search.trim().length > 0 ? params.search.trim().toLowerCase() : null;

  const hasAnyFilter = Boolean(
    targetStatus ||
    targetFollowUpState ||
    targetOutreachState ||
    targetLocation ||
    targetSource ||
    targetSearch
  );

  const filtered = hasAnyFilter
    ? allCards.filter((c) => {
        if (targetStatus && c.status !== targetStatus) return false;
        if (targetFollowUpState && c.follow_up_state !== targetFollowUpState) return false;
        if (targetOutreachState && c.outreach_state !== targetOutreachState) return false;
        if (targetSource && (!c.source || c.source.toLowerCase() !== targetSource)) return false;
        if (targetLocation) {
          const locMatch =
            (c.location && c.location.toLowerCase().includes(targetLocation)) ||
            (c.company?.location && c.company.location.toLowerCase().includes(targetLocation));
          if (!locMatch) return false;
        }
        if (targetSearch) {
          const searchMatch =
            c.title.toLowerCase().includes(targetSearch) ||
            (c.company?.name && c.company.name.toLowerCase().includes(targetSearch)) ||
            (c.contact?.name && c.contact.name.toLowerCase().includes(targetSearch)) ||
            (c.location && c.location.toLowerCase().includes(targetSearch)) ||
            (c.description && c.description.toLowerCase().includes(targetSearch));
          if (!searchMatch) return false;
        }
        return true;
      })
    : allCards;

  return {
    items: filtered,
    metrics,
    total: filtered.length,
  };
}
