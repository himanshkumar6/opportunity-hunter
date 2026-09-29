import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type {
  FollowUp,
  FollowUpWithRelations,
  FollowUpFilterParams,
  FollowUpCreateInput,
  FollowUpUpdateInput,
  FollowUpMetrics,
  Activity,
  ActivityType,
} from '@/types/follow-ups';
import type { Company, Contact, Opportunity } from '@/types/database';
import type { PaginatedResponse } from '@/types/api';
import { getOutreachByOpportunityId } from '@/lib/api/outreach';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const FOLLOW_UPS_FILE = path.join(DATA_DIR, 'follow-ups.json');
const ACTIVITIES_FILE = path.join(DATA_DIR, 'activities.json');

// In-process serialized async mutex for concurrency-safe local file mutations
let fileMutationQueue: Promise<unknown> = Promise.resolve();

function withFileLock<T>(fn: () => T | Promise<T>): Promise<T> {
  const next = fileMutationQueue.then(async () => {
    return await fn();
  });
  fileMutationQueue = next.catch(() => {});
  return next;
}

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
  if (!fs.existsSync(FOLLOW_UPS_FILE)) {
    fs.writeFileSync(FOLLOW_UPS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
  if (!fs.existsSync(ACTIVITIES_FILE)) {
    fs.writeFileSync(ACTIVITIES_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

function atomicWriteJsonSync(targetFile: string, data: unknown) {
  const tmpPath = `${targetFile}.${Date.now()}-${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');

  let retries = 5;
  while (retries > 0) {
    try {
      fs.renameSync(tmpPath, targetFile);
      return;
    } catch {
      retries--;
      if (retries === 0) {
        fs.writeFileSync(targetFile, JSON.stringify(data, null, 2), 'utf8');
        try {
          fs.unlinkSync(tmpPath);
        } catch {
          // Ignore unlink error
        }
        return;
      }
      // Brief sleep for Windows file lock release
      const start = Date.now();
      while (Date.now() - start < 15) {}
    }
  }
}

/**
 * Creates a rolling timestamped backup, retaining the 5 most recent backups per file.
 */
function rotateBackups(fileKey: 'follow-ups' | 'activities') {
  try {
    const targetFile = fileKey === 'follow-ups' ? FOLLOW_UPS_FILE : ACTIVITIES_FILE;
    if (!fs.existsSync(targetFile)) return;

    const backupPath = path.join(
      BACKUPS_DIR,
      `${fileKey}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.bak.json`
    );
    fs.copyFileSync(targetFile, backupPath);

    // Prune older backups
    const existing = fs
      .readdirSync(BACKUPS_DIR)
      .filter((f) => f.startsWith(`${fileKey}-`) && f.endsWith('.bak.json'))
      .sort();

    if (existing.length > 5) {
      for (const oldFile of existing.slice(0, existing.length - 5)) {
        try {
          fs.unlinkSync(path.join(BACKUPS_DIR, oldFile));
        } catch {
          // Ignore unlink errors
        }
      }
    }
  } catch (err) {
    logger.warn('Failed to rotate backup file', {
      fileKey,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

function readFollowUpsRaw(): FollowUp[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(FOLLOW_UPS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    logger.error('Failed reading follow-ups file, returning empty set', {
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

function writeFollowUpsRaw(items: FollowUp[]) {
  ensureDataFiles();
  rotateBackups('follow-ups');
  atomicWriteJsonSync(FOLLOW_UPS_FILE, items);
}

function readActivitiesRaw(): Activity[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(ACTIVITIES_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    logger.error('Failed reading activities file, returning empty set', {
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

function writeActivitiesRaw(items: Activity[]) {
  ensureDataFiles();
  rotateBackups('activities');
  atomicWriteJsonSync(ACTIVITIES_FILE, items);
}

// Cached check for Supabase follow_ups table availability
let supabaseTableCheckCache: { available: boolean; timestamp: number } | null = null;
const CHECK_CACHE_TTL_MS = 60_000;

export async function isSupabaseFollowUpsAvailable(): Promise<boolean> {
  const now = Date.now();
  if (supabaseTableCheckCache && now - supabaseTableCheckCache.timestamp < CHECK_CACHE_TTL_MS) {
    return supabaseTableCheckCache.available;
  }

  try {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from('follow_ups' as any)
      .select('id', { head: true, count: 'exact' });
    const available = !error;
    supabaseTableCheckCache = { available, timestamp: now };
    return available;
  } catch {
    supabaseTableCheckCache = { available: false, timestamp: now };
    return false;
  }
}

export function logActivity({
  opportunity_id,
  contact_id,
  company_id,
  type,
  title,
  description,
  metadata,
}: {
  opportunity_id: string;
  contact_id?: string | null;
  company_id?: string | null;
  type: ActivityType;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
}): Activity {
  const newActivity: Activity = {
    id: crypto.randomUUID(),
    opportunity_id,
    contact_id: contact_id || null,
    company_id: company_id || null,
    type,
    title,
    description,
    metadata,
    created_at: new Date().toISOString(),
  };

  withFileLock(() => {
    const activities = readActivitiesRaw();
    activities.unshift(newActivity);
    writeActivitiesRaw(activities);
  });

  return newActivity;
}

export async function getFollowUps(
  params: FollowUpFilterParams = {}
): Promise<PaginatedResponse<FollowUpWithRelations>> {
  const {
    filter = 'all',
    status = 'all',
    priority = 'all',
    search,
    opportunity_id,
    page = 1,
    pageSize = 20,
  } = params;

  const rawList = readFollowUpsRaw();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;

  // Optimized selective relation fetching: only query referenced IDs instead of full tables
  const referencedOppIds = Array.from(
    new Set(rawList.map((f) => f.opportunity_id).filter(Boolean))
  );
  const referencedContactIds = Array.from(
    new Set(rawList.map((f) => f.contact_id).filter(Boolean))
  );

  const supabase = await createAdminClient();

  let allOpps: any[] = [];
  if (referencedOppIds.length > 0) {
    const { data: oppsData } = await supabase
      .from('opportunities')
      .select('*, company:companies(*)')
      .in('id', referencedOppIds);
    allOpps = oppsData || [];
  }

  const oppMap = new Map<string, Opportunity & { company: Company | null }>();
  allOpps.forEach((o: any) => {
    oppMap.set(o.id, {
      ...o,
      company: o.company ?? null,
    });
  });

  // Collect any company IDs to resolve fallback company contacts
  const referencedCompanyIds = Array.from(
    new Set(allOpps.map((o: any) => o.company?.id).filter(Boolean))
  );

  let allContacts: any[] = [];
  if (referencedContactIds.length > 0 || referencedCompanyIds.length > 0) {
    let contactQuery = supabase.from('contacts').select('*');
    if (referencedContactIds.length > 0 && referencedCompanyIds.length > 0) {
      contactQuery = contactQuery.or(
        `id.in.(${referencedContactIds.join(',')}),company_id.in.(${referencedCompanyIds.join(',')})`
      );
    } else if (referencedContactIds.length > 0) {
      contactQuery = contactQuery.in('id', referencedContactIds);
    } else {
      contactQuery = contactQuery.in('company_id', referencedCompanyIds);
    }
    const { data: contactsData } = await contactQuery;
    allContacts = contactsData || [];
  }

  const contactMap = new Map<string, Contact>();
  const companyContactMap = new Map<string, Contact>();
  allContacts.forEach((c: any) => {
    contactMap.set(c.id, c);
    if (c.company_id && !companyContactMap.has(c.company_id)) {
      companyContactMap.set(c.company_id, c);
    }
  });

  // Map to rich relations
  let enriched: FollowUpWithRelations[] = rawList.map((item) => {
    const opp = oppMap.get(item.opportunity_id) || null;
    const contact = item.contact_id
      ? contactMap.get(item.contact_id) || null
      : opp?.company_id
        ? companyContactMap.get(opp.company_id) || null
        : null;

    const dueTime = new Date(item.due_at).getTime();
    const isCompleted = item.status === 'completed';
    const isCancelled = item.status === 'cancelled';
    const isOverdue = !isCompleted && !isCancelled && dueTime < Date.now();
    const isDueToday =
      !isCompleted && !isCancelled && dueTime >= startOfToday && dueTime <= endOfToday;

    return {
      ...item,
      opportunity: opp,
      contact,
      is_overdue: isOverdue,
      is_due_today: isDueToday,
    };
  });

  // Apply all filters in a single O(n) pass, eliminating intermediate array allocations
  const targetPriority = priority && priority !== 'all' ? priority : null;
  const targetStatus = status && status !== 'all' ? status : null;
  const targetFilter = filter && filter !== 'all' ? filter : null;
  const targetSearch = search && search.trim() ? search.trim().toLowerCase() : null;

  const hasAnyFilter = Boolean(
    opportunity_id || targetPriority || targetStatus || targetFilter || targetSearch
  );

  if (hasAnyFilter) {
    enriched = enriched.filter((f) => {
      if (opportunity_id && f.opportunity_id !== opportunity_id) return false;
      if (targetPriority && f.priority !== targetPriority) return false;
      if (targetStatus && f.status !== targetStatus) return false;

      if (targetFilter === 'overdue' && !f.is_overdue) return false;
      if (targetFilter === 'due' && !f.is_due_today && !f.is_overdue) return false;
      if (targetFilter === 'upcoming' && (f.status !== 'scheduled' || f.is_overdue)) return false;
      if (targetFilter === 'completed' && f.status !== 'completed') return false;

      if (targetSearch) {
        const companyName = f.opportunity?.company?.name?.toLowerCase() || '';
        const oppTitle = f.opportunity?.title?.toLowerCase() || '';
        const contactName = f.contact?.name?.toLowerCase() || '';
        const note = f.note?.toLowerCase() || '';
        const action = f.action?.toLowerCase() || '';
        const matches =
          companyName.includes(targetSearch) ||
          oppTitle.includes(targetSearch) ||
          contactName.includes(targetSearch) ||
          note.includes(targetSearch) ||
          action.includes(targetSearch);
        if (!matches) return false;
      }

      return true;
    });
  }

  // Sort: Overdue first, then by due_at ascending for upcoming, completed last
  enriched.sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    if (a.is_overdue && !b.is_overdue) return -1;
    if (!a.is_overdue && b.is_overdue) return 1;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });

  const total = enriched.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const start = (page - 1) * pageSize;
  const paginated = enriched.slice(start, start + pageSize);

  return {
    items: paginated,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getFollowUpMetrics(): Promise<FollowUpMetrics> {
  const rawList = readFollowUpsRaw();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;

  let due_today = 0;
  let overdue = 0;
  let upcoming = 0;
  let completed = 0;

  rawList.forEach((item) => {
    const dueTime = new Date(item.due_at).getTime();
    if (item.status === 'completed') {
      completed++;
    } else if (item.status === 'scheduled') {
      if (dueTime < Date.now()) {
        overdue++;
      } else if (dueTime >= startOfToday && dueTime <= endOfToday) {
        due_today++;
      } else {
        upcoming++;
      }
    }
  });

  return {
    total: rawList.length,
    due_today,
    overdue,
    upcoming,
    completed,
  };
}

export async function getFollowUpById(id: string): Promise<FollowUpWithRelations | null> {
  const rawList = readFollowUpsRaw();
  const item = rawList.find((f) => f.id === id);
  if (!item) return null;

  const supabase = await createAdminClient();
  const { data: rawOpp } = await supabase
    .from('opportunities')
    .select('*, company:companies(*)')
    .eq('id', item.opportunity_id)
    .maybeSingle();

  const opp = rawOpp as (Opportunity & { company?: Company | null }) | null;

  let contact: Contact | null = null;
  if (item.contact_id) {
    const { data: c } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', item.contact_id)
      .maybeSingle();
    contact = (c as unknown as Contact) || null;
  } else if (opp?.company_id) {
    const { data: c } = await supabase
      .from('contacts')
      .select('*')
      .eq('company_id', opp.company_id)
      .limit(1)
      .maybeSingle();
    contact = (c as unknown as Contact) || null;
  }

  // Fetch latest outreach draft for opportunity
  const outreachHistory = await getOutreachByOpportunityId(item.opportunity_id);
  const latestOutreach = outreachHistory.length > 0 ? outreachHistory[0] : null;

  const dueTime = new Date(item.due_at).getTime();
  const isCompleted = item.status === 'completed';
  const isCancelled = item.status === 'cancelled';
  const isOverdue = !isCompleted && !isCancelled && dueTime < Date.now();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;
  const isDueToday =
    !isCompleted && !isCancelled && dueTime >= startOfToday && dueTime <= endOfToday;

  return {
    ...item,
    opportunity: opp
      ? {
          ...opp,
          company: opp.company ?? null,
        }
      : null,
    contact,
    latest_outreach: latestOutreach,
    is_overdue: isOverdue,
    is_due_today: isDueToday,
  };
}

export async function createFollowUp(input: FollowUpCreateInput): Promise<FollowUpWithRelations> {
  const { opportunity_id, contact_id, due_at, action, note = '', priority = 'medium' } = input;

  if (!opportunity_id) {
    throw new Error('Opportunity ID is required');
  }
  if (!due_at || isNaN(new Date(due_at).getTime())) {
    throw new Error('A valid follow-up date and time is required');
  }
  if (!action || !action.trim()) {
    throw new Error('Next action description is required');
  }

  // Validate opportunity exists in Supabase
  const supabase = await createAdminClient();
  const { data: rawOpp, error: oppError } = await supabase
    .from('opportunities')
    .select('*, company:companies(*)')
    .eq('id', opportunity_id)
    .single();

  const opp = rawOpp as (Opportunity & { company?: Company | null }) | null;

  if (oppError || !opp) {
    throw new Error(`Opportunity with ID ${opportunity_id} not found in database`);
  }

  // Find contact if not provided
  let resolvedContactId: string | null = contact_id || null;
  if (!resolvedContactId && opp.company?.id) {
    const { data: c } = await supabase
      .from('contacts')
      .select('id')
      .eq('company_id', opp.company.id)
      .limit(1)
      .maybeSingle();
    if (c) resolvedContactId = (c as { id: string }).id;
  }

  const now = new Date().toISOString();
  const newFollowUp: FollowUp = {
    id: crypto.randomUUID(),
    opportunity_id,
    contact_id: resolvedContactId,
    due_at: new Date(due_at).toISOString(),
    action: action.trim(),
    note: note.trim(),
    status: 'scheduled',
    priority,
    completed_at: null,
    created_at: now,
    updated_at: now,
  };

  await withFileLock(() => {
    const rawList = readFollowUpsRaw();
    rawList.push(newFollowUp);
    writeFollowUpsRaw(rawList);
  });

  // Log activity
  logActivity({
    opportunity_id,
    contact_id: newFollowUp.contact_id,
    company_id: opp.company?.id || null,
    type: 'follow_up_created',
    title: `Follow-up Scheduled: ${action.trim()}`,
    description:
      `Scheduled for ${new Date(due_at).toLocaleDateString()} (${priority.toUpperCase()} priority). ${note.trim() ? `Note: ${note.trim()}` : ''}`.trim(),
    metadata: {
      follow_up_id: newFollowUp.id,
      due_at: newFollowUp.due_at,
      priority: newFollowUp.priority,
    },
  });

  return (await getFollowUpById(newFollowUp.id))!;
}

export async function updateFollowUp(
  id: string,
  input: FollowUpUpdateInput
): Promise<FollowUpWithRelations> {
  let rescheduled = false;
  let updatedRecord: FollowUp | null = null;

  await withFileLock(() => {
    const rawList = readFollowUpsRaw();
    const index = rawList.findIndex((f) => f.id === id);
    if (index === -1) {
      throw new Error(`Follow-up with ID ${id} not found`);
    }

    const existing = rawList[index];
    if (!existing) {
      throw new Error(`Follow-up with ID ${id} not found`);
    }

    const now = new Date().toISOString();

    if (input.due_at && input.due_at !== existing.due_at) {
      if (isNaN(new Date(input.due_at).getTime())) {
        throw new Error('Invalid follow-up date');
      }
      existing.due_at = new Date(input.due_at).toISOString();
      rescheduled = true;
    }

    if (input.action !== undefined) {
      existing.action = input.action.trim();
    }
    if (input.note !== undefined) {
      existing.note = input.note.trim();
    }
    if (input.status !== undefined) {
      existing.status = input.status;
      if (input.status === 'completed' && !existing.completed_at) {
        existing.completed_at = now;
      }
    }
    if (input.priority !== undefined) {
      existing.priority = input.priority;
    }
    if (input.completed_at !== undefined) {
      existing.completed_at = input.completed_at;
    }

    existing.updated_at = now;
    rawList[index] = existing;
    writeFollowUpsRaw(rawList);
    updatedRecord = existing;
  });

  if (rescheduled && updatedRecord) {
    const rec = updatedRecord as FollowUp;
    logActivity({
      opportunity_id: rec.opportunity_id,
      contact_id: rec.contact_id,
      type: 'follow_up_rescheduled',
      title: `Follow-up Rescheduled: ${rec.action}`,
      description: `Rescheduled to ${new Date(rec.due_at).toLocaleDateString()}.`,
      metadata: { follow_up_id: rec.id, due_at: rec.due_at },
    });
  }

  return (await getFollowUpById(id))!;
}

export async function completeFollowUp(id: string, note?: string): Promise<FollowUpWithRelations> {
  let completedRecord: FollowUp | null = null;
  let alreadyCompleted = false;

  await withFileLock(() => {
    const rawList = readFollowUpsRaw();
    const index = rawList.findIndex((f) => f.id === id);
    if (index === -1) {
      throw new Error(`Follow-up with ID ${id} not found`);
    }

    const existing = rawList[index];
    if (!existing) {
      throw new Error(`Follow-up with ID ${id} not found`);
    }

    if (existing.status === 'completed') {
      alreadyCompleted = true;
      completedRecord = existing;
      return;
    }

    const now = new Date().toISOString();
    existing.status = 'completed';
    existing.completed_at = now;
    existing.updated_at = now;
    if (note && note.trim()) {
      existing.note = existing.note
        ? `${existing.note}\n\n[Completed]: ${note.trim()}`
        : `[Completed]: ${note.trim()}`;
    }

    rawList[index] = existing;
    writeFollowUpsRaw(rawList);
    completedRecord = existing;
  });

  if (!alreadyCompleted && completedRecord) {
    const rec = completedRecord as FollowUp;
    logActivity({
      opportunity_id: rec.opportunity_id,
      contact_id: rec.contact_id,
      type: 'follow_up_completed',
      title: `Follow-up Completed: ${rec.action}`,
      description: note?.trim()
        ? `Marked complete. Note: ${note.trim()}`
        : 'Marked complete by operator.',
      metadata: { follow_up_id: rec.id, completed_at: rec.completed_at },
    });
  }

  return (await getFollowUpById(id))!;
}

export async function getOpportunityActivities(opportunityId: string): Promise<Activity[]> {
  const supabase = await createAdminClient();

  // 1. Fetch Opportunity from Supabase
  const { data: rawOpp } = await supabase
    .from('opportunities')
    .select('*, company:companies(*)')
    .eq('id', opportunityId)
    .maybeSingle();

  const opp = rawOpp as (Opportunity & { company?: Company | null }) | null;

  const activities: Activity[] = [];

  if (opp) {
    // Milestone 1: Opportunity Created
    activities.push({
      id: `opp-created-${opp.id}`,
      opportunity_id: opp.id,
      contact_id: null,
      company_id: opp.company?.id || null,
      type: 'opportunity_created',
      title: 'Opportunity Discovered & Created',
      description: `Discovered via ${opp.source || 'Unified Pipeline'}${opp.location ? ` in ${opp.location}` : ''}${opp.match_score ? ` (Match Score: ${opp.match_score}%)` : ''}.`,
      metadata: { source: opp.source, match_score: opp.match_score },
      created_at: opp.created_at,
    });

    // Milestone 2: Status changed if not new
    if (opp.status && opp.status.toLowerCase() !== 'new') {
      activities.push({
        id: `opp-status-${opp.id}`,
        opportunity_id: opp.id,
        contact_id: null,
        company_id: opp.company?.id || null,
        type: 'status_changed',
        title: `Opportunity Status: ${opp.status.toUpperCase()}`,
        description: `Current pipeline state set to ${opp.status}.`,
        metadata: { status: opp.status },
        created_at: opp.updated_at || opp.created_at,
      });
    }
  }

  // 2. Fetch Outreach from Supabase
  const outreachRecords = await getOutreachByOpportunityId(opportunityId);
  outreachRecords.forEach((outreach) => {
    // Outreach draft created
    activities.push({
      id: `outreach-draft-${outreach.id}`,
      opportunity_id: outreach.opportunity_id,
      contact_id: outreach.contact_id,
      type: 'outreach_draft_created',
      title: `Outreach Draft Created (${outreach.channel.toUpperCase()})`,
      description: outreach.subject
        ? `Subject: "${outreach.subject}"`
        : `Direct message prepared for ${outreach.channel}.`,
      metadata: { channel: outreach.channel, outreach_id: outreach.id },
      created_at: outreach.created_at,
    });

    // Outreach approved
    if (outreach.status === 'approved') {
      activities.push({
        id: `outreach-approved-${outreach.id}`,
        opportunity_id: outreach.opportunity_id,
        contact_id: outreach.contact_id,
        type: 'outreach_approved',
        title: `Outreach Approved by Operator (${outreach.channel.toUpperCase()})`,
        description: 'Verified copy approved for human dispatch (zero auto-send).',
        metadata: { channel: outreach.channel, outreach_id: outreach.id },
        created_at: outreach.created_at,
      });
    }
  });

  // 3. Fetch Recorded custom activities & follow-up events
  const recorded = readActivitiesRaw().filter((a) => a.opportunity_id === opportunityId);
  activities.push(...recorded);

  // 4. Sort newest first
  activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return activities;
}
