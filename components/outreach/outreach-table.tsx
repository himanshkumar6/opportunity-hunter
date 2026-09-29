'use client';

import Link from 'next/link';
import {
  Mail,
  MessageSquare,
  Building2,
  Users,
  Briefcase,
  Target,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
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
import type { OutreachWithRelations } from '@/types/outreach';

interface OutreachTableProps {
  items: OutreachWithRelations[];
}

export function OutreachTable({ items }: OutreachTableProps) {
  const getStatusBadge = (st: string) => {
    const s = st?.toLowerCase() || 'draft';
    switch (s) {
      case 'draft':
        return (
          <Badge variant="amber" size="sm" className="gap-1">
            <Clock className="h-2.5 w-2.5" />
            Draft (Review)
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="emerald" size="sm" className="gap-1">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Approved
          </Badge>
        );
      case 'sent':
        return (
          <Badge variant="sky" size="sm">
            Sent
          </Badge>
        );
      case 'replied':
        return (
          <Badge variant="emerald" size="sm" dot dotPulse>
            Replied
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="rose" size="sm">
            Failed
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

  const getChannelBadge = (ch: string) => {
    const c = ch?.toLowerCase() || 'email';
    if (c === 'whatsapp') {
      return (
        <Badge variant="emerald" size="sm" className="gap-1">
          <MessageSquare className="h-2.5 w-2.5" />
          WhatsApp
        </Badge>
      );
    }
    return (
      <Badge variant="sky" size="sm" className="gap-1">
        <Mail className="h-2.5 w-2.5" />
        Email
      </Badge>
    );
  };

  const getTypeBadge = (type?: string) => {
    const t = type?.toLowerCase() || '';
    if (t === 'job') {
      return (
        <Badge variant="sky" size="sm" className="gap-1">
          <Briefcase className="h-2.5 w-2.5" />
          Job
        </Badge>
      );
    }
    return (
      <Badge variant="emerald" size="sm" className="gap-1">
        <Target className="h-2.5 w-2.5" />
        Lead
      </Badge>
    );
  };

  return (
    <Table data-testid="outreach-table">
      <TableHeader>
        <TableRow>
          <TableHead>Target Company & Contact</TableHead>
          <TableHead>Opportunity</TableHead>
          <TableHead>Channel</TableHead>
          <TableHead>Draft Subject / Snippet</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((row) => {
          const company = row.opportunity?.company;
          const contact = row.contact;
          const opp = row.opportunity;
          const reviewHref = `/outreach/${row.opportunity_id}`;

          return (
            <TableRow key={row.id} data-testid={`outreach-row-${row.id}`}>
              {/* Target Company & Contact */}
              <TableCell className="max-w-[240px]">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 truncate font-medium text-white">
                    <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                    <span className="truncate">{company?.name || 'Company N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate text-[11px] text-slate-400">
                    <Users className="h-3 w-3 flex-shrink-0 text-slate-500" />
                    <span className="truncate">
                      {contact?.name
                        ? `${contact.name}${contact.role ? ` (${contact.role})` : ''}`
                        : 'Team / General'}
                    </span>
                  </div>
                </div>
              </TableCell>

              {/* Opportunity */}
              <TableCell className="max-w-[220px]">
                <div className="space-y-1">
                  <div
                    className="line-clamp-1 text-xs font-medium text-slate-200"
                    title={opp?.title || ''}
                  >
                    {opp?.title || 'Opportunity'}
                  </div>
                  <div>{getTypeBadge(opp?.type)}</div>
                </div>
              </TableCell>

              {/* Channel */}
              <TableCell>{getChannelBadge(row.channel)}</TableCell>

              {/* Subject / Snippet */}
              <TableCell className="max-w-[280px]">
                <div className="space-y-0.5">
                  <p className="line-clamp-1 text-xs font-medium text-slate-200">
                    {row.subject ||
                      (row.channel === 'whatsapp' ? 'WhatsApp Message' : 'No Subject')}
                  </p>
                  <p className="line-clamp-1 text-[11px] text-slate-400">
                    {row.message || 'No message content'}
                  </p>
                </div>
              </TableCell>

              {/* Status */}
              <TableCell>{getStatusBadge(row.status)}</TableCell>

              {/* Created */}
              <TableCell className="font-mono text-[11px] whitespace-nowrap text-slate-400">
                {formatDate(row.created_at)}
              </TableCell>

              {/* Action */}
              <TableCell className="text-right">
                <Link href={reviewHref}>
                  <Button
                    variant="ghost"
                    size="xs"
                    rightIcon={<ArrowRight className="h-3 w-3" />}
                    data-testid={`review-outreach-btn-${row.id}`}
                  >
                    Review
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
