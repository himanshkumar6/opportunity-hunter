'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  jobs: 'Job Hunt AI',
  leads: 'Lead Hunt AI',
  opportunities: 'Opportunities',
  companies: 'Companies',
  contacts: 'Contacts',
  'search-runs': 'Search Runs',
  outreach: 'Outreach & Approvals',
  'follow-ups': 'Follow-ups & Activity',
  crm: 'CRM & Pipeline',
  settings: 'Settings',
};

export function Breadcrumbs() {
  const pathname = usePathname();

  const segments = React.useMemo(() => {
    return pathname.split('/').filter(Boolean);
  }, [pathname]);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-400">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li className="flex items-center">
          <Link
            href="/dashboard"
            className="flex items-center text-slate-400 transition-colors hover:text-slate-200"
            title="Dashboard Home"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const isId = segment.length > 20 || /^[0-9a-fA-F-]+$/.test(segment);
          const label = routeLabels[segment] || (isId ? `#${segment.slice(0, 8)}...` : segment);

          return (
            <li key={href} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 flex-shrink-0 text-slate-600" />
              {isLast ? (
                <span
                  className="max-w-[160px] truncate font-medium text-emerald-400 sm:max-w-none"
                  aria-current="page"
                >
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="max-w-[120px] truncate transition-colors hover:text-slate-200 sm:max-w-none"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
