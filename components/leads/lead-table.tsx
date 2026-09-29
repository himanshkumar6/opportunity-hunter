'use client';

import Link from 'next/link';
import { MapPin, Globe, ArrowRight, ExternalLink, Sparkles, Share2 } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Badge,
  Button,
} from '@/components/ui';
import { sanitizeCompanyWebsite } from '@/lib/utils';
import type { LeadItem } from '@/types/leads';

interface LeadTableProps {
  items: LeadItem[];
}

export function LeadTable({ items }: LeadTableProps) {
  const getStatusBadge = (st: string) => {
    const s = st?.toLowerCase() || 'new';
    switch (s) {
      case 'new':
        return (
          <Badge variant="sky" size="sm" dot>
            New
          </Badge>
        );
      case 'qualified':
        return (
          <Badge variant="amber" size="sm" dot>
            Qualified
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="emerald" size="sm" dot>
            Approved
          </Badge>
        );
      case 'contacted':
        return (
          <Badge variant="purple" size="sm" dot>
            Contacted
          </Badge>
        );
      case 'replied':
        return (
          <Badge variant="sky" size="sm" dot dotPulse>
            Replied
          </Badge>
        );
      case 'interested':
        return (
          <Badge variant="emerald" size="sm" dot dotPulse>
            Interested
          </Badge>
        );
      case 'closed':
        return (
          <Badge variant="secondary" size="sm">
            Closed
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="rose" size="sm">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" size="sm">
            {st}
          </Badge>
        );
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Target Business</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Website Status</TableHead>
          <TableHead>Identified Gaps</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((lead) => (
          <TableRow key={lead.id}>
            {/* Title & Organization */}
            <TableCell className="max-w-[260px]">
              <div className="space-y-0.5">
                <Link
                  href={`/leads/${lead.id}`}
                  className="line-clamp-1 text-xs font-semibold text-white transition-colors hover:text-emerald-400"
                >
                  {lead.title}
                </Link>
                {lead.company?.industry && (
                  <p className="truncate text-[11px] text-slate-400">{lead.company.industry}</p>
                )}
              </div>
            </TableCell>

            {/* Location */}
            <TableCell className="whitespace-nowrap">
              {lead.location ? (
                <div className="flex items-center gap-1 text-slate-300">
                  <MapPin className="h-3 w-3 text-slate-500" />
                  <span className="max-w-[130px] truncate">{lead.location}</span>
                </div>
              ) : (
                <span className="text-slate-500">Not specified</span>
              )}
            </TableCell>

            {/* Website Status */}
            <TableCell>
              {(() => {
                const sanitizedWebsite = sanitizeCompanyWebsite(lead.company?.website);
                if (lead.website_status === 'missing' || !sanitizedWebsite) {
                  return (
                    <Badge variant="rose" size="sm">
                      Missing Website
                    </Badge>
                  );
                }
                return (
                  <a
                    href={sanitizedWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-[150px] items-center gap-1 truncate text-[11px] text-emerald-400 hover:underline"
                  >
                    <Globe className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {sanitizedWebsite.replace(/^https?:\/\//i, '')}
                    </span>
                    <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                  </a>
                );
              })()}
            </TableCell>

            {/* Identified Gaps */}
            <TableCell>
              <div className="flex flex-wrap items-center gap-1">
                {lead.website_status === 'missing' && (
                  <span
                    title="Prime candidate for website development"
                    className="inline-flex items-center rounded border border-rose-800/40 bg-rose-950/60 px-1.5 py-0.5 font-mono text-[9px] font-medium text-rose-300"
                  >
                    No Web
                  </span>
                )}
                {lead.seo_opportunity && (
                  <span
                    title="SEO opportunity detected"
                    className="inline-flex items-center gap-0.5 rounded border border-amber-800/40 bg-amber-950/60 px-1.5 py-0.5 font-mono text-[9px] font-medium text-amber-300"
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    SEO
                  </span>
                )}
                {lead.social_opportunity && (
                  <span
                    title="Social media gap detected"
                    className="inline-flex items-center gap-0.5 rounded border border-sky-800/40 bg-sky-950/60 px-1.5 py-0.5 font-mono text-[9px] font-medium text-sky-300"
                  >
                    <Share2 className="h-2.5 w-2.5" />
                    Social
                  </span>
                )}
                {(lead.reasons?.length ?? 0) === 0 && (
                  <span className="text-[10px] text-slate-500">Standard</span>
                )}
              </div>
            </TableCell>

            {/* Match Score */}
            <TableCell>
              {lead.match_score !== null && lead.match_score !== undefined ? (
                <span
                  className={`font-mono text-[11px] font-semibold ${
                    lead.match_score >= 80
                      ? 'text-emerald-400'
                      : lead.match_score >= 50
                        ? 'text-amber-400'
                        : 'text-slate-400'
                  }`}
                >
                  {lead.match_score}%
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">N/A</span>
              )}
            </TableCell>

            {/* Status */}
            <TableCell>{getStatusBadge(lead.status)}</TableCell>

            {/* Action */}
            <TableCell className="text-right">
              <Link href={`/leads/${lead.id}`}>
                <Button variant="ghost" size="xs" rightIcon={<ArrowRight className="h-3 w-3" />}>
                  Qualify
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
