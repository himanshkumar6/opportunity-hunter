'use client';

import Link from 'next/link';
import { Building2, ArrowRight } from 'lucide-react';
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
import type { ContactWithCompany } from '@/types/contacts';

interface ContactTableProps {
  items: ContactWithCompany[];
}

export function ContactTable({ items }: ContactTableProps) {
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
    <Table data-testid="contact-table">
      <TableHeader>
        <TableRow>
          <TableHead>Contact Identity</TableHead>
          <TableHead>Target Company</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Confidence</TableHead>
          <TableHead>Discovered</TableHead>
          <TableHead className="text-right">Profile</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((contact) => {
          return (
            <TableRow key={contact.id}>
              {/* Contact Identity */}
              <TableCell className="max-w-[200px]">
                <div className="space-y-0.5">
                  <Link
                    href={`/contacts/${contact.id}`}
                    className="line-clamp-1 font-semibold text-white transition-colors hover:text-emerald-400"
                  >
                    {contact.name || 'Not available'}
                  </Link>
                  <p className="font-mono text-[10px] text-slate-500">
                    ID: {contact.id.slice(0, 8)}
                  </p>
                </div>
              </TableCell>

              {/* Target Company */}
              <TableCell className="max-w-[220px]">
                {contact.company ? (
                  <Link
                    href={`/companies/${contact.company.id}`}
                    className="flex items-center gap-1.5 font-medium text-slate-200 transition-colors hover:text-emerald-400"
                  >
                    <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
                    <span className="truncate text-xs">{contact.company.name}</span>
                  </Link>
                ) : (
                  <span className="text-xs text-slate-500">Company information unavailable</span>
                )}
              </TableCell>

              {/* Role */}
              <TableCell className="max-w-[150px] text-slate-300">
                <span className="truncate text-xs">{contact.role || 'Not available'}</span>
              </TableCell>

              {/* Phone */}
              <TableCell className="font-mono text-xs text-slate-300">
                {contact.phone ? (
                  <span className="text-emerald-400/90">{contact.phone}</span>
                ) : (
                  <span className="text-slate-500">Not available</span>
                )}
              </TableCell>

              {/* Email */}
              <TableCell className="font-mono text-xs text-slate-300">
                {contact.email ? (
                  <span className="block max-w-[160px] truncate text-sky-400/90">
                    {contact.email}
                  </span>
                ) : (
                  <span className="text-slate-500">Not available</span>
                )}
              </TableCell>

              {/* Confidence */}
              <TableCell>{getConfidenceBadge(contact.confidence)}</TableCell>

              {/* Discovered Date */}
              <TableCell className="font-mono text-[11px] text-slate-400">
                {formatDate(contact.created_at)}
              </TableCell>

              {/* Action Button */}
              <TableCell className="text-right">
                <Link href={`/contacts/${contact.id}`}>
                  <Button variant="ghost" size="xs" rightIcon={<ArrowRight className="h-3 w-3" />}>
                    View
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
