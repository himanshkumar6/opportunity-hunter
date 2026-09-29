'use client';

import Link from 'next/link';
import {
  Users,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  ExternalLink,
  ArrowLeft,
  Calendar,
  Send,
  ShieldCheck,
  Briefcase,
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
import { formatDate } from '@/lib/utils';
import type { ContactWithCompany } from '@/types/contacts';

interface ContactDetailViewProps {
  contact: ContactWithCompany;
}

export function ContactDetailView({ contact }: ContactDetailViewProps) {
  const getConfidenceBadge = (conf: number | null | undefined) => {
    if (conf === null || conf === undefined) {
      return <span className="font-mono text-xs text-slate-500">Not available</span>;
    }
    const pct = Math.round(conf * 100);
    if (conf >= 0.7) {
      return (
        <Badge variant="emerald" size="sm" className="font-mono">
          {pct}% High Quality
        </Badge>
      );
    }
    if (conf >= 0.4) {
      return (
        <Badge variant="amber" size="sm" className="font-mono">
          {pct}% Medium Quality
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" size="sm" className="font-mono">
        {pct}% Low Quality
      </Badge>
    );
  };

  const cleanWhatsApp = (wa: string | null | undefined) => {
    if (!wa || wa.includes('{{') || wa.includes('$json')) {
      return 'Not available';
    }
    return wa;
  };

  const whatsappVal = cleanWhatsApp(contact.whatsapp);
  const company = contact.company;
  const opps = contact.opportunities || [];

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/dashboard" className="transition-colors hover:text-white">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/contacts" className="transition-colors hover:text-white">
            Contacts
          </Link>
          <span>/</span>
          <span className="truncate font-medium text-slate-200">
            {contact.name || `Contact #${contact.id.slice(0, 8)}`}
          </span>
        </div>

        <Link href="/contacts">
          <Button variant="ghost" size="xs" leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
            Back to Contacts
          </Button>
        </Link>
      </div>

      {/* Header Banner */}
      <Card className="border-slate-800 bg-[#0C1220] p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="emerald" size="sm" dot>
                DECISION-MAKER PROFILE
              </Badge>
              {getConfidenceBadge(contact.confidence)}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {contact.name || 'Not available'}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              {company ? (
                <Link
                  href={`/companies/${company.id}`}
                  className="flex items-center gap-1.5 font-medium text-slate-200 transition-colors hover:text-emerald-400"
                >
                  <Building2 className="h-4 w-4 flex-shrink-0 text-slate-500" />
                  <span>{company.name}</span>
                </Link>
              ) : (
                <span className="text-slate-500">Company information unavailable</span>
              )}
              <div className="flex items-center gap-1.5 font-mono">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
                <span>Indexed {formatDate(contact.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Link to Company */}
          {company && (
            <div className="flex flex-wrap items-center gap-2.5">
              <Link href={`/companies/${company.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  View Company Profile
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Card>

      {/* Quality & Telemetry KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* KPI 1: Confidence */}
        <Card className="bg-[#090E1B] p-4">
          <div className="mb-2 flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Confidence Score</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="font-mono text-2xl font-bold tracking-tight text-white">
            {contact.confidence !== null && contact.confidence !== undefined
              ? `${Math.round(contact.confidence * 100)}%`
              : 'N/A'}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">Threshold: High ≥70%, Med ≥40%</p>
        </Card>

        {/* KPI 2: Phone Status */}
        <Card className="bg-[#090E1B] p-4">
          <div className="mb-2 flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Phone Channel</span>
            <Phone className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="truncate font-mono text-sm font-semibold text-white">
            {contact.phone || 'Not available'}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            {contact.phone ? 'Verified telephone' : 'Missing direct line'}
          </p>
        </Card>

        {/* KPI 3: Email Status */}
        <Card className="bg-[#090E1B] p-4">
          <div className="mb-2 flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Email Channel</span>
            <Mail className="h-4 w-4 text-sky-400" />
          </div>
          <p className="truncate font-mono text-sm font-semibold text-white">
            {contact.email || 'Not available'}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            {contact.email ? 'Corporate mailbox' : 'Unenriched mailbox'}
          </p>
        </Card>

        {/* KPI 4: Outreach Count */}
        <Card className="bg-[#090E1B] p-4">
          <div className="mb-2 flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Outreach Activity</span>
            <Send className="h-4 w-4 text-purple-400" />
          </div>
          <p className="font-mono text-2xl font-bold tracking-tight text-white">
            {contact.outreach_count ?? 0}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">Read-only in Phase 5</p>
        </Card>
      </div>

      {/* Main Grid: Contact Channels + Target Company + Opportunities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Col: Contact Channels & Ingestion Audit */}
        <div className="space-y-6 lg:col-span-1">
          {/* Channels Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-emerald-400" />
                Contact Channels
              </CardTitle>
              <CardDescription>Verified communication methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div>
                <p className="font-mono text-[10px] text-slate-500 uppercase">Contact Name</p>
                <p className="mt-0.5 font-medium text-slate-200">
                  {contact.name || 'Not available'}
                </p>
              </div>

              <div>
                <p className="font-mono text-[10px] text-slate-500 uppercase">Role / Title</p>
                <p className="mt-0.5 text-slate-300">{contact.role || 'Not available'}</p>
              </div>

              <div>
                <p className="font-mono text-[10px] text-slate-500 uppercase">Phone Number</p>
                {contact.phone ? (
                  <p className="mt-0.5 font-mono font-medium text-emerald-400">{contact.phone}</p>
                ) : (
                  <p className="mt-0.5 font-mono text-slate-500">Not available</p>
                )}
              </div>

              <div>
                <p className="font-mono text-[10px] text-slate-500 uppercase">Email Address</p>
                {contact.email ? (
                  <a
                    href={`mailto:${contact.email}`}
                    className="mt-0.5 block truncate font-mono text-sky-400 hover:underline"
                  >
                    {contact.email}
                  </a>
                ) : (
                  <p className="mt-0.5 font-mono text-slate-500">Not available</p>
                )}
              </div>

              <div>
                <p className="font-mono text-[10px] text-slate-500 uppercase">WhatsApp</p>
                <p className="mt-0.5 font-mono text-slate-300">{whatsappVal}</p>
              </div>

              <div>
                <p className="font-mono text-[10px] text-slate-500 uppercase">
                  Source / Discovery URL
                </p>
                {contact.source_url ? (
                  <a
                    href={
                      contact.source_url.startsWith('http')
                        ? contact.source_url
                        : `https://${contact.source_url}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block truncate font-mono text-[11px] text-slate-400 hover:text-emerald-400 hover:underline"
                  >
                    {contact.source_url}
                  </a>
                ) : (
                  <p className="mt-0.5 text-slate-500">Not available</p>
                )}
              </div>

              <div className="border-t border-slate-800/80 pt-2 font-mono text-[11px] text-slate-500">
                <p>Created: {formatDate(contact.created_at)}</p>
                <p>Updated: {formatDate(contact.updated_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Outreach Governance Card */}
          <Card className="border-purple-950/40 bg-[#0C0B18]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm text-purple-200">
                  <Send className="h-4 w-4 text-purple-400" />
                  Outreach Status
                </CardTitle>
                <Badge variant="purple" size="sm">
                  PHASE 5 READ-ONLY
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-400">
              <p>
                Outreach History:{' '}
                <strong className="font-mono text-white">
                  {contact.outreach_count ?? 0} messages
                </strong>
              </p>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Outreach sending is read-only in Phase 5. Direct messaging requires human operator
                confirmation in Phase 6.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right 2 Cols: Target Company & Associated Opportunities */}
        <div className="space-y-6 lg:col-span-2">
          {/* Target Company Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-emerald-400" />
                  Associated Target Company
                </CardTitle>
                {company && (
                  <Link href={`/companies/${company.id}`}>
                    <Button
                      variant="ghost"
                      size="xs"
                      rightIcon={<ArrowRight className="h-3 w-3" />}
                    >
                      View Company
                    </Button>
                  </Link>
                )}
              </div>
              <CardDescription>Corporate entity this contact represents</CardDescription>
            </CardHeader>
            <CardContent>
              {company ? (
                <div className="space-y-3 rounded-lg border border-slate-800 bg-[#080D19] p-4 text-xs">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <Link
                        href={`/companies/${company.id}`}
                        className="text-sm font-bold text-white transition-colors hover:text-emerald-400"
                      >
                        {company.name}
                      </Link>
                      <p className="mt-0.5 text-slate-400">
                        {company.industry || 'Industry Not available'}
                      </p>
                    </div>
                    {company.website ? (
                      <a
                        href={
                          company.website.startsWith('http')
                            ? company.website
                            : `https://${company.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-emerald-400 hover:underline"
                      >
                        <Globe className="h-3 w-3" />
                        <span className="max-w-[200px] truncate">{company.website}</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    ) : (
                      <span className="font-mono text-slate-500">No website found</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 border-t border-slate-800/60 pt-2 text-slate-400">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
                    <span>{company.location || 'Location Not available'}</span>
                  </div>
                </div>
              ) : (
                <EmptyState
                  compact
                  icon={<Building2 className="h-5 w-5 text-slate-500" />}
                  title="Company information unavailable"
                  description="This contact is not currently associated with an indexed enterprise entity."
                />
              )}
            </CardContent>
          </Card>

          {/* Related Opportunities Section (Part H) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Briefcase className="h-4 w-4 text-sky-400" />
                  Associated Opportunities ({opps.length})
                </CardTitle>
                <Badge variant="sky" size="sm">
                  {opps.length} {opps.length === 1 ? 'Opportunity' : 'Opportunities'}
                </Badge>
              </div>
              <CardDescription>
                Opportunities linked through {company?.name || 'the associated company'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {opps.length === 0 ? (
                <EmptyState
                  compact
                  icon={<Briefcase className="h-5 w-5 text-slate-500" />}
                  title="No active opportunities linked"
                  description="There are currently no open job positions or commercial lead opportunities linked to this contact's company."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Opportunity Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Match Score</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {opps.map((opp) => (
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
