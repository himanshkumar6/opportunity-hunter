'use client';

import Link from 'next/link';
import { MapPin, Building2, ArrowRight, ExternalLink } from 'lucide-react';
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
import { formatDate } from '@/lib/utils';
import type { JobItem } from '@/types/jobs';

interface JobTableProps {
  items: JobItem[];
}

export function JobTable({ items }: JobTableProps) {
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
    <Table data-testid="job-table">
      <TableHeader>
        <TableRow>
          <TableHead>Job Title & Organization</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Posted Date</TableHead>
          <TableHead>Match Score</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((job) => (
          <TableRow key={job.id}>
            <TableCell className="max-w-[280px]">
              <div className="space-y-0.5">
                <Link
                  href={`/jobs/${job.id}`}
                  className="line-clamp-1 text-xs font-semibold text-white transition-colors hover:text-sky-400"
                >
                  {job.title}
                </Link>
                {job.company && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Building2 className="h-3 w-3 text-slate-500" />
                    <span className="truncate">{job.company.name}</span>
                  </div>
                )}
              </div>
            </TableCell>

            <TableCell className="whitespace-nowrap">
              {job.location ? (
                <div className="flex items-center gap-1 text-slate-300">
                  <MapPin className="h-3 w-3 text-slate-500" />
                  <span className="max-w-[140px] truncate">{job.location}</span>
                </div>
              ) : (
                <span className="text-slate-500">Not specified</span>
              )}
            </TableCell>

            <TableCell>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
                <span>{job.source || 'SerpApi'}</span>
                {job.source_url && (
                  <a
                    href={job.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-white"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </TableCell>

            <TableCell className="font-mono text-[11px] text-slate-400">
              {job.posted_at ? formatDate(job.posted_at) : formatDate(job.created_at)}
            </TableCell>

            <TableCell>
              {job.match_score !== null && job.match_score !== undefined ? (
                <span
                  className={`font-mono text-[11px] font-semibold ${
                    job.match_score >= 80
                      ? 'text-sky-400'
                      : job.match_score >= 50
                        ? 'text-amber-400'
                        : 'text-slate-400'
                  }`}
                >
                  {job.match_score}%
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">N/A</span>
              )}
            </TableCell>

            <TableCell>{getStatusBadge(job.status)}</TableCell>

            <TableCell className="text-right">
              <Link href={`/jobs/${job.id}`}>
                <Button variant="ghost" size="xs" rightIcon={<ArrowRight className="h-3 w-3" />}>
                  Details
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
