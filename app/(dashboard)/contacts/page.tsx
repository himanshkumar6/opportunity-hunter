import Link from 'next/link';
import { Users, Target, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge, Button, EmptyState } from '@/components/ui';
import { getContacts } from '@/lib/api/contacts';
import { ContactFilters } from '@/components/contacts/contact-filters';
import { ContactTable } from '@/components/contacts/contact-table';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    companyName?: string;
    role?: string;
    confidence?: 'high' | 'medium' | 'low' | 'all';
    sortBy?: 'newest' | 'name' | 'confidence';
    page?: string;
  }>;
}

export default async function ContactsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const result = await getContacts({
    search: params.search,
    companyName: params.companyName,
    role: params.role,
    confidence: params.confidence,
    sortBy: params.sortBy,
    page: isNaN(page) ? 1 : page,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-800/40 bg-emerald-950/80 text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Contacts Directory
                </h1>
                <Badge variant="emerald" size="sm">
                  {result.total} {result.total === 1 ? 'Contact' : 'Contacts'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Decision-maker identities, telephone numbers, and email channels discovered from
                public sources
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/companies">
              <Button variant="outline" size="xs" leftIcon={<Building2 className="h-3.5 w-3.5" />}>
                View Companies
              </Button>
            </Link>
            <Link href="/leads">
              <Button variant="primary" size="xs" leftIcon={<Target className="h-3.5 w-3.5" />}>
                Find Prospects
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <ContactFilters />

      {/* Main Table or Empty State */}
      {result.items.length === 0 ? (
        <EmptyState
          title="No contacts found"
          description={
            params.search || params.companyName || params.confidence || params.role
              ? 'No contacts match your selected filter criteria. Try adjusting or resetting your search filters.'
              : 'The contacts directory is currently empty. Run an automated discovery query from Lead Hunt AI to populate contacts.'
          }
          action={
            <div className="flex items-center gap-3">
              <Link href="/contacts">
                <Button variant="outline" size="sm">
                  Clear Filters
                </Button>
              </Link>
              <Link href="/leads">
                <Button variant="primary" size="sm" leftIcon={<Target className="h-4 w-4" />}>
                  Start Lead Hunt
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-4">
          <ContactTable items={result.items} />

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800/80 px-2 py-3 font-mono text-xs text-slate-400">
              <span>
                Page {result.page} of {result.totalPages} ({result.total} total contacts)
              </span>
              <div className="flex items-center gap-2">
                {result.page > 1 && (
                  <Link
                    href={`/contacts?page=${result.page - 1}${params.search ? `&search=${params.search}` : ''}${params.companyName ? `&companyName=${params.companyName}` : ''}${params.confidence ? `&confidence=${params.confidence}` : ''}${params.sortBy ? `&sortBy=${params.sortBy}` : ''}`}
                  >
                    <Button
                      variant="outline"
                      size="xs"
                      leftIcon={<ChevronLeft className="h-3 w-3" />}
                    >
                      Previous
                    </Button>
                  </Link>
                )}
                {result.page < result.totalPages && (
                  <Link
                    href={`/contacts?page=${result.page + 1}${params.search ? `&search=${params.search}` : ''}${params.companyName ? `&companyName=${params.companyName}` : ''}${params.confidence ? `&confidence=${params.confidence}` : ''}${params.sortBy ? `&sortBy=${params.sortBy}` : ''}`}
                  >
                    <Button
                      variant="outline"
                      size="xs"
                      rightIcon={<ChevronRight className="h-3 w-3" />}
                    >
                      Next
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
