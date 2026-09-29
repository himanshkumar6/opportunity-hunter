import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Users,
  Target,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  CalendarClock,
} from 'lucide-react';
import { Badge, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { resolveGoogleMapsUrl, sanitizeCompanyWebsite, sanitizeExternalUrl } from '@/lib/utils';
import { getOpportunity } from '@/lib/api/opportunities';
import { getOutreachByOpportunityId } from '@/lib/api/outreach';
import { createAdminClient } from '@/lib/supabase/server';
import { OutreachDraftEditor } from '@/components/outreach/outreach-draft-editor';
import { OutreachHistory } from '@/components/outreach/outreach-history';
import type { Contact } from '@/types/database';

interface PageProps {
  params: Promise<{ opportunityId: string }>;
}

export default async function OpportunityOutreachPage({ params }: PageProps) {
  const { opportunityId } = await params;

  if (!opportunityId) {
    notFound();
  }

  const opportunity = await getOpportunity(opportunityId);
  if (!opportunity) {
    notFound();
  }

  // Fetch all available contacts for this company
  let availableContacts: Contact[] = [];
  if (opportunity.company_id) {
    const supabase = await createAdminClient();
    const { data: contactsData } = await supabase
      .from('contacts')
      .select('*')
      .eq('company_id', opportunity.company_id)
      .order('created_at', { ascending: false });

    if (contactsData) {
      availableContacts = contactsData as unknown as Contact[];
    }
  }

  // Fetch previous outreach records
  const outreachHistory = await getOutreachByOpportunityId(opportunityId);
  const latestDraft = outreachHistory.length > 0 ? outreachHistory[0] : null;

  const company = opportunity.company;
  const isJob = opportunity.type?.toLowerCase() === 'job';
  const sanitizedWebsite = sanitizeCompanyWebsite(company?.website);
  const isGoogleMaps =
    opportunity.source === 'serpapi_maps' ||
    opportunity.source === 'google_maps' ||
    opportunity.type === 'business_lead' ||
    opportunity.type === 'website_opportunity';

  const resolvedMapsUrl = resolveGoogleMapsUrl({
    sourceUrl: opportunity.source_url,
    name: company?.name || opportunity.title,
    location: opportunity.location || company?.location,
  });

  const resolvedGenericSourceUrl = !isGoogleMaps
    ? sanitizeExternalUrl(opportunity.source_url)
    : null;

  return (
    <div className="space-y-6">
      {/* Top back navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/outreach"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Outreach Dashboard
          </Link>
          <span className="text-slate-600">/</span>
          <Link
            href={isJob ? `/jobs/${opportunity.id}` : `/opportunities/${opportunity.id}`}
            className="text-xs text-slate-400 transition-colors hover:text-emerald-400"
          >
            View Opportunity Specs
          </Link>
          <span className="text-slate-600">/</span>
          <Link
            href={`/follow-ups?opportunity_id=${opportunity.id}`}
            className="inline-flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-sky-400"
            data-testid="link-to-opp-follow-ups"
          >
            <CalendarClock className="h-3 w-3" />
            <span>Follow-ups</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="emerald" size="sm" className="gap-1 font-mono text-[10px]">
            <ShieldCheck className="h-3 w-3" />
            HUMAN APPROVAL REQUIRED
          </Badge>
        </div>
      </div>

      {/* Opportunity Context Header Card */}
      <Card className="border-slate-800 bg-[#0C1220] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {isJob ? (
                <Badge variant="sky" size="sm" className="gap-1">
                  <Briefcase className="h-3 w-3" />
                  Job Opportunity
                </Badge>
              ) : (
                <Badge variant="emerald" size="sm" className="gap-1">
                  <Target className="h-3 w-3" />
                  Business Prospect
                </Badge>
              )}

              {opportunity.match_score !== null && opportunity.match_score !== undefined && (
                <Badge variant={opportunity.match_score >= 80 ? 'emerald' : 'secondary'} size="sm">
                  Match Score: {opportunity.match_score}%
                </Badge>
              )}
            </div>

            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              {opportunity.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-400">
              {company && (
                <div className="flex items-center gap-1.5 font-medium text-slate-200">
                  <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{company.name}</span>
                </div>
              )}

              {sanitizedWebsite && (
                <a
                  href={sanitizedWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-emerald-400 hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span className="max-w-[180px] truncate">
                    {sanitizedWebsite.replace(/^https?:\/\//i, '')}
                  </span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {(opportunity.location || company?.location) && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  <span>{opportunity.location || company?.location}</span>
                </div>
              )}
            </div>
          </div>

          {isGoogleMaps ? (
            resolvedMapsUrl ? (
              <a
                href={resolvedMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
                data-testid="outreach-maps-link"
              >
                <MapPin className="h-3.5 w-3.5 text-rose-400" />
                <span>View on Google Maps</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <div
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-500"
                data-testid="outreach-maps-unavailable"
              >
                <MapPin className="h-3.5 w-3.5 text-slate-600" />
                <span>Google Maps unavailable</span>
              </div>
            )
          ) : resolvedGenericSourceUrl ? (
            <a
              href={resolvedGenericSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <span>View Source</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      </Card>

      {/* Main Grid: Outreach Draft Composer (2 cols) & Context Intelligence / Audit History (1 col) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 cols): Outreach Composer */}
        <div className="space-y-6 lg:col-span-2">
          <OutreachDraftEditor
            opportunity={{
              ...opportunity,
              company: opportunity.company ?? null,
            }}
            availableContacts={availableContacts}
            initialDraft={latestDraft}
            existingDrafts={outreachHistory}
          />
        </div>

        {/* Right Column (1 col): Intelligence & History */}
        <div className="space-y-6 lg:col-span-1">
          {/* Organization & Verified Contact Intelligence */}
          <Card className="border-slate-800 bg-[#0C1220]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-white">
                <Users className="h-4 w-4 text-emerald-400" />
                Verified Target Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <p className="font-mono text-[10px] text-slate-500 uppercase">Organization</p>
                <p className="font-semibold text-white">{company?.name || 'Not available'}</p>
                {company?.industry && (
                  <p className="text-[11px] text-slate-400">{company.industry}</p>
                )}
              </div>

              <div>
                <p className="font-mono text-[10px] text-slate-500 uppercase">
                  Decision-Maker Contacts ({availableContacts.length})
                </p>
                {availableContacts.length > 0 ? (
                  <div className="mt-1 space-y-2">
                    {availableContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="rounded-lg border border-slate-800/80 bg-[#080D1A] p-2"
                      >
                        <p className="font-medium text-slate-200">{contact.name}</p>
                        {contact.role && (
                          <p className="text-[11px] text-slate-400">{contact.role}</p>
                        )}
                        {contact.email && (
                          <p className="font-mono text-[11px] text-emerald-400">{contact.email}</p>
                        )}
                        {(contact.phone || contact.whatsapp) && (
                          <p className="font-mono text-[11px] text-sky-400">
                            {contact.phone || contact.whatsapp}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-slate-500 italic">
                    No individual contact profile found. General team outreach will be used.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Outreach History Card */}
          <OutreachHistory records={outreachHistory} />
        </div>
      </div>
    </div>
  );
}
