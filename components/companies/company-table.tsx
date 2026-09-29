'use client';

import Link from 'next/link';
import { Globe, MapPin, Briefcase, Users, ExternalLink, ArrowRight } from 'lucide-react';
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
import { formatDate, sanitizeCompanyWebsite } from '@/lib/utils';
import type { CompanyWithStats } from '@/types/companies';

interface CompanyTableProps {
  items: CompanyWithStats[];
}

export function CompanyTable({ items }: CompanyTableProps) {
  const getCleanDomain = (url: string | null) => {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return (url.replace(/^https?:\/\//, '').split('/')[0] || '').slice(0, 30);
    }
  };

  return (
    <Table data-testid="company-table">
      <TableHeader>
        <TableRow>
          <TableHead>Company & Domain</TableHead>
          <TableHead>Industry / Sector</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Opportunities</TableHead>
          <TableHead>Contacts</TableHead>
          <TableHead>Discovered</TableHead>
          <TableHead className="text-right">Intelligence</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((company) => {
          const sanitizedWebsite = sanitizeCompanyWebsite(company.website);
          const domain = sanitizedWebsite ? getCleanDomain(sanitizedWebsite) : '';

          return (
            <TableRow key={company.id}>
              {/* Company & Domain */}
              <TableCell className="max-w-[260px]">
                <div className="space-y-1">
                  <Link
                    href={`/companies/${company.id}`}
                    className="line-clamp-1 font-semibold text-white transition-colors hover:text-emerald-400"
                  >
                    {company.name}
                  </Link>
                  {sanitizedWebsite ? (
                    <a
                      href={sanitizedWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400/90 transition-colors hover:text-emerald-300 hover:underline"
                    >
                      <Globe className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{domain}</span>
                      <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                    </a>
                  ) : (
                    <span className="font-mono text-[11px] text-slate-500">No website found</span>
                  )}
                </div>
              </TableCell>

              {/* Industry */}
              <TableCell className="max-w-[180px]">
                <Badge
                  variant="outline"
                  size="sm"
                  className="truncate border-slate-700/80 bg-slate-900/60 text-slate-300"
                >
                  {company.industry || 'Not available'}
                </Badge>
              </TableCell>

              {/* Location */}
              <TableCell className="max-w-[220px]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
                  <span className="truncate text-xs">{company.location || 'Not available'}</span>
                </div>
              </TableCell>

              {/* Opportunities Count */}
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={company.opportunities_count > 0 ? 'sky' : 'secondary'}
                    size="sm"
                    className="gap-1 font-mono text-xs"
                  >
                    <Briefcase className="h-2.5 w-2.5" />
                    {company.opportunities_count}
                  </Badge>
                </div>
              </TableCell>

              {/* Contacts Count */}
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={company.contacts_count > 0 ? 'emerald' : 'secondary'}
                    size="sm"
                    className="gap-1 font-mono text-xs"
                  >
                    <Users className="h-2.5 w-2.5" />
                    {company.contacts_count}
                  </Badge>
                </div>
              </TableCell>

              {/* Created Date */}
              <TableCell className="font-mono text-[11px] text-slate-400">
                {formatDate(company.created_at)}
              </TableCell>

              {/* Action Button */}
              <TableCell className="text-right">
                <Link href={`/companies/${company.id}`}>
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
