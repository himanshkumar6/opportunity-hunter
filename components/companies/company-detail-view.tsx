'use client';

import Link from 'next/link';
import {
  Building2,
  Globe,
  MapPin,
  Briefcase,
  Users,
  ExternalLink,
  ArrowLeft,
  Calendar,
  Send,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  EmptyState,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui';
import { formatDate, resolveGoogleMapsUrl, sanitizeCompanyWebsite } from '@/lib/utils';
import type { CompanyWithRelations } from '@/types/companies';

interface CompanyDetailViewProps {
  company: CompanyWithRelations;
}

export function CompanyDetailView({ company }: CompanyDetailViewProps) {
  const sanitizedWebsite = sanitizeCompanyWebsite(company.website);

  const getCleanDomain = (url: string | null) => {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return (url.replace(/^https?:\/\//, '').split('/')[0] || '').slice(0, 30);
    }
  };

  const domain = sanitizedWebsite ? getCleanDomain(sanitizedWebsite) : '';
  const resolvedCompanyMapsUrl = resolveGoogleMapsUrl({
    sourceUrl: company.source_url,
    name: company.name,
    location: company.location,
  });

  const getConfidenceBadge = (conf: number | null | undefined) => {
    if (conf === null || conf === undefined) {
      return <span className="font-mono text-xs text-slate-500">Not available</span>;
    }
    const pct = Math.round(conf * 100);
    if (conf >= 0.7) {
      return (
        <Badge variant="emerald" size="sm" className="font-mono">
          {pct}% High
        </Badge>
      );
    }
    if (conf >= 0.4) {
      return (
        <Badge variant="amber" size="sm" className="font-mono">
          {pct}% Medium
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" size="sm" className="font-mono">
        {pct}% Low
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/dashboard" className="transition-colors hover:text-white">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/companies" className="transition-colors hover:text-white">
            Companies
          </Link>
          <span>/</span>
          <span className="truncate font-medium text-slate-200">{company.name}</span>
        </div>

        <Link href="/companies">
          <Button variant="ghost" size="xs" leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
            Back to Companies
          </Button>
        </Link>
      </div>

      {/* Header Banner */}
      <Card className="border-slate-800 bg-[#0C1220] p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="emerald" size="sm" dot>
                ENTERPRISE ENTITY
              </Badge>
              {company.industry && (
                <Badge
                  variant="outline"
                  size="sm"
                  className="border-slate-700 bg-slate-900/80 text-slate-300"
                >
                  {company.industry}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {company.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 flex-shrink-0 text-slate-500" />
                <span>{company.location || 'Location Not available'}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
                <span>Indexed {formatDate(company.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Website & Google Maps Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {sanitizedWebsite ? (
              <a
                href={sanitizedWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-800/80 bg-emerald-950/80 px-3.5 py-2 text-xs font-semibold text-emerald-300 shadow-sm transition-colors hover:border-emerald-700 hover:bg-emerald-900/80"
              >
                <Globe className="h-4 w-4" />
                <span>Visit {domain}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <Badge variant="outline" className="border-slate-800 bg-slate-900/60 text-slate-400">
                No website found
              </Badge>
            )}

            {resolvedCompanyMapsUrl ? (
              <a
                href={resolvedCompanyMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 shadow-sm transition-colors hover:border-slate-600 hover:bg-slate-700 hover:text-white"
                data-testid="company-maps-btn"
              >
                <MapPin className="h-4 w-4 text-rose-400" />
                <span>Google Maps</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <Badge variant="outline" className="border-slate-800 bg-slate-900/60 text-slate-500">
                Google Maps unavailable
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Intelligence Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* KPI 1: Contacts Count */}
        <Card className="bg-[#090E1B] p-4">
          <div className="mb-2 flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Discovered Contacts</span>
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="font-mono text-2xl font-bold tracking-tight text-white">
            {company.contacts_count}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">Verified decision-makers</p>
        </Card>

        {/* KPI 2: Opportunities Count */}
        <Card className="bg-[#090E1B] p-4">
          <div className="mb-2 flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Linked Opportunities</span>
            <Briefcase className="h-4 w-4 text-sky-400" />
          </div>
          <p className="font-mono text-2xl font-bold tracking-tight text-white">
            {company.opportunities_count}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">Pipeline discovery items</p>
        </Card>

        {/* KPI 3: Outreach Executions */}
        <Card className="bg-[#090E1B] p-4">
          <div className="mb-2 flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Outreach Sequences</span>
            <Send className="h-4 w-4 text-purple-400" />
          </div>
          <p className="font-mono text-2xl font-bold tracking-tight text-white">
            {company.outreach_count}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">Read-only in Phase 5</p>
        </Card>

        {/* KPI 4: Ingestion Audit */}
        <Card className="bg-[#090E1B] p-4">
          <div className="mb-2 flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Ingestion Audit</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="truncate font-mono text-sm font-semibold text-white">
            {formatDate(company.created_at)}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">Automated scraper origin</p>
        </Card>
      </div>

      {/* Main Grid: Details + Contacts + Opportunities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Col: Overview & Discovery Traceability */}
        <div className="space-y-6 lg:col-span-1">
          {/* Business Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-emerald-400" />
                Company Overview
              </CardTitle>
              <CardDescription>Verified organizational metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div>
                <p className="font-mono text-[10px] text-slate-500 uppercase">Industry</p>
                <p className="mt-0.5 font-medium text-slate-200">
                  {company.industry || 'Not available'}
                </p>
              </div>

              <div>
                <p className="font-mono text-[10px] text-slate-500 uppercase">Headquarters</p>
                <p className="mt-0.5 text-slate-300">{company.location || 'Not available'}</p>
              </div>

              <div>
                <p className="font-mono text-[10px] text-slate-500 uppercase">Website Status</p>
                {sanitizedWebsite ? (
                  <a
                    href={sanitizedWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1 font-mono text-emerald-400 hover:underline"
                  >
                    <span>{sanitizedWebsite}</span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                ) : (
                  <p className="mt-0.5 font-mono text-slate-400">No website found</p>
                )}
              </div>

              <div>
                <p className="font-mono text-[10px] text-slate-500 uppercase">Description</p>
                <p className="mt-0.5 leading-relaxed text-slate-300">
                  {company.description || 'No description available for this entity.'}
                </p>
              </div>

              <div>
                <p className="font-mono text-[10px] text-slate-500 uppercase">
                  Source / Google Maps Listing
                </p>
                {resolvedCompanyMapsUrl ? (
                  <div className="mt-1">
                    <a
                      href={resolvedCompanyMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 hover:underline"
                    >
                      <MapPin className="h-3 w-3 text-rose-400" />
                      <span>View on Google Maps</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                ) : (
                  <p className="mt-0.5 text-xs text-slate-500">Google Maps unavailable</p>
                )}
              </div>

              <div className="border-t border-slate-800/80 pt-2 font-mono text-[11px] text-slate-500">
                <p>Created: {formatDate(company.created_at)}</p>
                <p>Updated: {formatDate(company.updated_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Outreach Context Card (Read-only Part K) */}
          <Card className="border-purple-950/40 bg-[#0C0B18]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm text-purple-200">
                  <Send className="h-4 w-4 text-purple-400" />
                  Outreach Context
                </CardTitle>
                <Badge variant="purple" size="sm">
                  PHASE 5 READ-ONLY
                </Badge>
              </div>
              <CardDescription>
                Governance policy: Outreach messaging requires human approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-400">
              <p>
                Total Outreach Attempts:{' '}
                <strong className="font-mono text-white">{company.outreach_count}</strong>
              </p>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Automated email and WhatsApp sending is disabled in Phase 5. Outbound sequences will
                be configurable in Phase 6 following manual review.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right 2 Cols: Contacts & Opportunities Lists */}
        <div className="space-y-6 lg:col-span-2">
          {/* Related Contacts Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-emerald-400" />
                  Associated Contacts ({company.contacts.length})
                </CardTitle>
                <Badge variant="emerald" size="sm">
                  {company.contacts.length} {company.contacts.length === 1 ? 'Contact' : 'Contacts'}
                </Badge>
              </div>
              <CardDescription>
                Verified contact channels and decision-makers linked to this company
              </CardDescription>
            </CardHeader>
            <CardContent>
              {company.contacts.length === 0 ? (
                <EmptyState
                  compact
                  icon={<Users className="h-5 w-5 text-slate-500" />}
                  title="No contacts discovered yet"
                  description="No contact records are currently linked to this company in the database."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact Name / ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {company.contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <Link
                            href={`/contacts/${contact.id}`}
                            className="font-medium text-white transition-colors hover:text-emerald-400"
                          >
                            {contact.name || 'Not available'}
                          </Link>
                          <p className="font-mono text-[10px] text-slate-500">
                            {contact.id.slice(0, 8)}
                          </p>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {contact.role || 'Not available'}
                        </TableCell>
                        <TableCell className="font-mono text-slate-300">
                          {contact.phone || 'Not available'}
                        </TableCell>
                        <TableCell className="font-mono text-slate-300">
                          {contact.email || 'Not available'}
                        </TableCell>
                        <TableCell>{getConfidenceBadge(contact.confidence)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/contacts/${contact.id}`}>
                            <Button
                              variant="ghost"
                              size="xs"
                              rightIcon={<ArrowRight className="h-3 w-3" />}
                            >
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Related Opportunities Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Briefcase className="h-4 w-4 text-sky-400" />
                  Related Opportunities ({company.opportunities.length})
                </CardTitle>
                <Badge variant="sky" size="sm">
                  {company.opportunities.length}{' '}
                  {company.opportunities.length === 1 ? 'Opportunity' : 'Opportunities'}
                </Badge>
              </div>
              <CardDescription>
                Commercial leads and engineering jobs tied to this corporate entity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {company.opportunities.length === 0 ? (
                <EmptyState
                  compact
                  icon={<Briefcase className="h-5 w-5 text-slate-500" />}
                  title="No opportunities linked yet"
                  description="This company currently has no linked pipeline opportunities in the database."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Match Score</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {company.opportunities.map((opp) => (
                      <TableRow key={opp.id}>
                        <TableCell className="max-w-[240px]">
                          <Link
                            href={`/opportunities/${opp.id}`}
                            className="line-clamp-1 font-medium text-white transition-colors hover:text-sky-400"
                          >
                            {opp.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={opp.type === 'job' ? 'sky' : 'emerald'} size="sm">
                            {opp.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" size="sm">
                            {opp.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">
                          {opp.match_score !== null && opp.match_score !== undefined
                            ? `${opp.match_score}%`
                            : 'Not available'}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {opp.location || 'Not available'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/opportunities/${opp.id}`}>
                            <Button
                              variant="ghost"
                              size="xs"
                              rightIcon={<ArrowRight className="h-3 w-3" />}
                            >
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
