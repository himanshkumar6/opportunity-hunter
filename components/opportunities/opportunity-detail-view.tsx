'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ExternalLink,
  MapPin,
  Calendar,
  Building2,
  Users,
  Globe,
  Tag,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Target,
  Sparkles,
  CheckCircle2,
  XCircle,
  Send,
  Kanban,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
} from '@/components/ui';
import {
  formatDate,
  resolveGoogleMapsUrl,
  sanitizeCompanyWebsite,
  sanitizeExternalUrl,
} from '@/lib/utils';
import type { OpportunityWithCompany, OpportunityStatus } from '@/types/opportunities';
import { OpportunityFollowUpSection } from '@/components/follow-ups/opportunity-follow-up-section';

interface OpportunityDetailViewProps {
  opportunity: OpportunityWithCompany;
  backHref?: string;
  backLabel?: string;
}

const statusOptions: { value: OpportunityStatus; label: string }[] = [
  { value: 'new', label: 'New / Unreviewed' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'approved', label: 'Approved for Outreach' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'replied', label: 'Replied' },
  { value: 'interested', label: 'Interested' },
  { value: 'closed', label: 'Closed / Won' },
  { value: 'rejected', label: 'Rejected' },
];

export function OpportunityDetailView({
  opportunity: initialOpp,
  backHref = '/opportunities',
  backLabel = 'Back to Opportunities',
}: OpportunityDetailViewProps) {
  const router = useRouter();
  const [opp, setOpp] = React.useState<OpportunityWithCompany>(initialOpp);
  const [status, setStatus] = React.useState<OpportunityStatus>(
    (initialOpp.status?.toLowerCase() as OpportunityStatus) || 'new'
  );
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [updateFeedback, setUpdateFeedback] = React.useState<string | null>(null);

  const handleStatusChange = async (newStatus: OpportunityStatus) => {
    try {
      setIsUpdating(true);
      setUpdateFeedback(null);
      const res = await fetch(`/api/opportunities/${opp.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      setStatus(newStatus);
      setOpp((prev) => ({ ...prev, status: newStatus }));
      setUpdateFeedback(`Status updated to ${newStatus}`);
      router.refresh();
    } catch (err: unknown) {
      setUpdateFeedback(err instanceof Error ? err.message : 'Error updating status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (st: string) => {
    const s = st.toLowerCase();
    switch (s) {
      case 'new':
        return (
          <Badge variant="sky" dot>
            New
          </Badge>
        );
      case 'qualified':
        return (
          <Badge variant="amber" dot>
            Qualified
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="emerald" dot>
            Approved
          </Badge>
        );
      case 'contacted':
        return (
          <Badge variant="purple" dot>
            Contacted
          </Badge>
        );
      case 'replied':
        return (
          <Badge variant="sky" dot dotPulse>
            Replied
          </Badge>
        );
      case 'interested':
        return (
          <Badge variant="emerald" dot dotPulse>
            Interested
          </Badge>
        );
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      case 'rejected':
        return <Badge variant="rose">Rejected</Badge>;
      default:
        return <Badge variant="outline">{st}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'job') {
      return (
        <Badge variant="sky" className="gap-1">
          <Briefcase className="h-3 w-3" />
          Job Hunt
        </Badge>
      );
    }
    if (t === 'business_lead') {
      return (
        <Badge variant="emerald" className="gap-1">
          <Target className="h-3 w-3" />
          Business Lead
        </Badge>
      );
    }
    if (t === 'website_opportunity') {
      return (
        <Badge variant="amber" className="gap-1">
          <Globe className="h-3 w-3" />
          Website Opportunity
        </Badge>
      );
    }
    return <Badge variant="outline">{type}</Badge>;
  };

  const company = opp.company;
  const contact = opp.contact;

  const isGoogleMaps =
    opp.source === 'serpapi_maps' ||
    opp.source === 'google_maps' ||
    opp.type === 'business_lead' ||
    opp.type === 'website_opportunity';

  const resolvedMapsUrl = resolveGoogleMapsUrl({
    sourceUrl: opp.source_url,
    name: company?.name || opp.title,
    location: opp.location || company?.location,
  });

  const resolvedGenericSourceUrl = !isGoogleMaps ? sanitizeExternalUrl(opp.source_url) : null;
  const sanitizedWebsite = sanitizeCompanyWebsite(company?.website);

  return (
    <div className="space-y-6">
      {/* Top navigation back link & status actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        {/* Status update controls */}
        <div className="flex flex-wrap items-center gap-2">
          {updateFeedback && (
            <span className="text-xs font-medium text-emerald-400">{updateFeedback}</span>
          )}
          <select
            value={status}
            disabled={isUpdating}
            onChange={(e) => handleStatusChange(e.target.value as OpportunityStatus)}
            className="h-8 rounded-lg border border-slate-700 bg-[#0C1220] px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#0C1220]">
                {opt.label}
              </option>
            ))}
          </select>
          <Button
            size="xs"
            variant="danger"
            disabled={isUpdating || status === 'rejected'}
            onClick={() => handleStatusChange('rejected')}
            leftIcon={<XCircle className="h-3.5 w-3.5" />}
          >
            Reject
          </Button>
          <Button
            size="xs"
            variant="primary"
            disabled={isUpdating || status === 'approved'}
            onClick={() => handleStatusChange('approved')}
            leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
          >
            Approve
          </Button>
          <Link href={`/outreach/${opp.id}`}>
            <Button
              size="xs"
              variant="outline"
              className="border-emerald-700/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60"
              leftIcon={<Send className="h-3.5 w-3.5" />}
              data-testid="review-outreach-btn"
            >
              Review & Outreach
            </Button>
          </Link>
          <Link href={`/crm`}>
            <Button
              size="xs"
              variant="outline"
              className="border-sky-800/60 bg-sky-950/30 text-sky-300 hover:bg-sky-900/50"
              leftIcon={<Kanban className="h-3.5 w-3.5" />}
              data-testid="view-in-crm-btn"
            >
              CRM Pipeline
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Header Card */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {getTypeBadge(opp.type)}
              {getStatusBadge(opp.status)}
              {opp.match_score !== null && opp.match_score !== undefined && (
                <Badge variant={opp.match_score >= 80 ? 'emerald' : 'secondary'} size="sm">
                  Match Score: {opp.match_score}%
                </Badge>
              )}
            </div>

            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              {opp.title || 'Not available'}
            </h1>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-400">
              {company &&
                (company.id ? (
                  <Link
                    href={`/companies/${company.id}`}
                    className="flex items-center gap-1.5 font-medium text-slate-300 transition-colors hover:text-emerald-400"
                  >
                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                    <span>{company.name || 'Not available'}</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-1.5 font-medium text-slate-300">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                    <span>{company.name || 'Not available'}</span>
                  </div>
                ))}
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                <span>{opp.location || 'Not available'}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>Created {formatDate(opp.created_at)}</span>
              </div>
              {opp.posted_at && (
                <div className="flex items-center gap-1.5 font-mono">
                  <Tag className="h-3.5 w-3.5 text-slate-500" />
                  <span>Posted {formatDate(opp.posted_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Source Link / Google Maps Link */}
          {isGoogleMaps ? (
            resolvedMapsUrl ? (
              <div className="flex flex-shrink-0 items-center gap-2">
                <a
                  href={resolvedMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
                  data-testid="google-maps-link"
                >
                  <MapPin className="h-3.5 w-3.5 text-rose-400" />
                  <span>View on Google Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : (
              <div className="flex flex-shrink-0 items-center gap-2">
                <div
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-500"
                  data-testid="google-maps-unavailable"
                >
                  <MapPin className="h-3.5 w-3.5 text-slate-600" />
                  <span>Google Maps unavailable</span>
                </div>
              </div>
            )
          ) : resolvedGenericSourceUrl ? (
            <div className="flex flex-shrink-0 items-center gap-2">
              <a
                href={resolvedGenericSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <span>View Source ({opp.source || 'Direct'})</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : null}
        </div>
      </Card>

      {/* Grid: Left Column Details & Description | Right Column Target Entity Intelligence */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Description & Opportunity Overview */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                Opportunity Overview & Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              {opp.description ? (
                <div className="prose prose-invert max-w-none font-sans text-xs leading-relaxed whitespace-pre-wrap text-slate-300">
                  {opp.description}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  No extended description text was provided in the raw search result.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Follow-ups & Activity Section */}
          <OpportunityFollowUpSection
            opportunityId={opp.id}
            opportunityTitle={opp.title}
            contactId={contact?.id || null}
          />
        </div>

        {/* Right 1 Col: Company & Contact Intelligence */}
        <div className="space-y-6 lg:col-span-1">
          {/* Target Organization Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-emerald-400" />
                Target Organization
              </CardTitle>
              <CardDescription>Associated business profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-mono text-[10px] text-slate-500 uppercase">Company Name</p>
                {company?.id ? (
                  <Link
                    href={`/companies/${company.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-white transition-colors hover:text-emerald-400 hover:underline"
                  >
                    <span>{company.name}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : (
                  <p className="text-xs font-semibold text-white">
                    {company?.name || 'Not available'}
                  </p>
                )}
              </div>

              <div>
                <p className="font-mono text-[10px] text-slate-500 uppercase">Website</p>
                {sanitizedWebsite ? (
                  <a
                    href={sanitizedWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                  >
                    <Globe className="h-3 w-3" />
                    <span>{sanitizedWebsite.replace(/^https?:\/\//i, '')}</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                ) : (
                  <p className="font-mono text-xs text-rose-400">
                    No website detected (Gap Signal)
                  </p>
                )}
              </div>

              <div>
                <p className="font-mono text-[10px] text-slate-500 uppercase">Industry / Domain</p>
                <p className="text-xs text-slate-300">{company?.industry || 'Not available'}</p>
              </div>

              <div>
                <p className="font-mono text-[10px] text-slate-500 uppercase">
                  Headquarters / Location
                </p>
                <p className="text-xs text-slate-300">
                  {company?.location || opp.location || 'Not available'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-emerald-400" />
                Verified Decision-Maker
              </CardTitle>
              <CardDescription>Enriched contact channels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {contact ? (
                <>
                  <div>
                    <p className="font-mono text-[10px] text-slate-500 uppercase">Full Name</p>
                    <p className="text-xs font-semibold text-white">{contact.name}</p>
                    {contact.role && <p className="text-[11px] text-slate-400">{contact.role}</p>}
                  </div>
                  <div>
                    <p className="font-mono text-[10px] text-slate-500 uppercase">Email Address</p>
                    <p className="font-mono text-xs text-slate-300">
                      {contact.email || 'Not available'}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] text-slate-500 uppercase">
                      Phone / WhatsApp
                    </p>
                    <p className="font-mono text-xs text-slate-300">
                      {contact.phone || contact.whatsapp || 'Not available'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="py-2 text-xs text-slate-500 italic">
                  No verified contact record attached to this company.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
