'use client';

import Link from 'next/link';
import { MapPin, Building2, Briefcase, Target, Globe, ArrowRight } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Badge,
} from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { OpportunityWithCompany } from '@/types/opportunities';

interface OpportunityTableProps {
  items: OpportunityWithCompany[];
}

export function OpportunityTable({ items }: OpportunityTableProps) {
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

  const getTypeBadge = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t === 'job') {
      return (
        <Badge variant="sky" size="sm" className="gap-1">
          <Briefcase className="h-2.5 w-2.5" />
          Job
        </Badge>
      );
    }
    if (t === 'business_lead') {
      return (
        <Badge variant="emerald" size="sm" className="gap-1">
          <Target className="h-2.5 w-2.5" />
          Lead
        </Badge>
      );
    }
    if (t === 'website_opportunity') {
      return (
        <Badge variant="amber" size="sm" className="gap-1">
          <Globe className="h-2.5 w-2.5" />
          Website
        </Badge>
      );
    }
    return (
      <Badge variant="outline" size="sm">
        {type}
      </Badge>
    );
  };

  return (
    <Table data-testid="opportunity-table">
      <TableHeader>
        <TableRow>
          <TableHead>Opportunity / Target</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Match Score</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((opp) => {
          const detailHref =
            opp.type?.toLowerCase() === 'job'
              ? `/jobs/${opp.id}`
              : opp.type?.toLowerCase() === 'business_lead'
                ? `/leads/${opp.id}`
                : `/opportunities/${opp.id}`;

          return (
            <TableRow key={opp.id}>
              {/* Title & Company */}
              <TableCell className="max-w-[280px]">
                <div className="space-y-0.5">
                  <Link
                    href={detailHref}
                    className="line-clamp-1 font-medium text-white transition-colors hover:text-emerald-400"
                  >
                    {opp.title}
                  </Link>
                  {opp.company && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Building2 className="h-3 w-3 text-slate-500" />
                      <span className="truncate">{opp.company.name}</span>
                    </div>
                  )}
                </div>
              </TableCell>

              {/* Type Badge */}
              <TableCell>{getTypeBadge(opp.type)}</TableCell>

              {/* Location */}
              <TableCell className="whitespace-nowrap">
                {opp.location ? (
                  <div className="flex items-center gap-1 text-slate-300">
                    <MapPin className="h-3 w-3 text-slate-500" />
                    <span className="max-w-[140px] truncate">{opp.location}</span>
                  </div>
                ) : (
                  <span className="text-slate-500">Not available</span>
                )}
              </TableCell>

              {/* Match Score */}
              <TableCell>
                {opp.match_score !== null && opp.match_score !== undefined ? (
                  <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                    <span
                      className={`font-semibold ${
                        opp.match_score >= 80
                          ? 'text-emerald-400'
                          : opp.match_score >= 50
                            ? 'text-amber-400'
                            : 'text-slate-400'
                      }`}
                    >
                      {opp.match_score}%
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-500">N/A</span>
                )}
              </TableCell>

              {/* Source & Date */}
              <TableCell>
                <div className="space-y-0.5 font-mono text-[11px]">
                  <span className="text-slate-300">{opp.source || 'Direct'}</span>
                  <p className="text-[10px] text-slate-500">{formatDate(opp.created_at)}</p>
                </div>
              </TableCell>

              {/* Status */}
              <TableCell>{getStatusBadge(opp.status)}</TableCell>

              {/* Action Link */}
              <TableCell className="text-right">
                <Link
                  href={detailHref}
                  className="inline-flex h-7 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800/70 hover:text-white"
                >
                  View
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
