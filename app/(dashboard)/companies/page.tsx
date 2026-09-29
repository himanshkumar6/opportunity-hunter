import Link from 'next/link';
import { Building2, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge, Button, EmptyState } from '@/components/ui';
import { getCompanies } from '@/lib/api/companies';
import { CompanyFilters } from '@/components/companies/company-filters';
import { CompanyTable } from '@/components/companies/company-table';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    industry?: string;
    location?: string;
    sortBy?: 'newest' | 'name' | 'oldest';
    page?: string;
  }>;
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const result = await getCompanies({
    search: params.search,
    industry: params.industry,
    location: params.location,
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
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Companies Directory
                </h1>
                <Badge variant="emerald" size="sm">
                  {result.total} {result.total === 1 ? 'Company' : 'Companies'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Corporate entities indexed across Lead Hunt AI scrapers and Google Maps automation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/leads">
              <Button variant="primary" size="xs" leftIcon={<Target className="h-3.5 w-3.5" />}>
                Lead Hunt AI
              </Button>
            </Link>
            <Link href="/contacts">
              <Button variant="outline" size="xs">
                View Contacts
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <CompanyFilters />

      {/* Main Table or Empty State */}
      {result.items.length === 0 ? (
        <EmptyState
          title="No companies found"
          description={
            params.search || params.industry || params.location
              ? 'No enterprise entities match your selected filter criteria. Try adjusting or resetting your search filters.'
              : 'The companies directory is currently empty. Run an automated discovery query from Lead Hunt AI to populate organizations.'
          }
          action={
            <div className="flex items-center gap-3">
              <Link href="/companies">
                <Button variant="outline" size="sm">
                  Clear Filters
                </Button>
              </Link>
              <Link href="/leads">
                <Button variant="primary" size="sm" leftIcon={<Target className="h-4 w-4" />}>
                  Run Lead Hunt
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-4">
          <CompanyTable items={result.items} />

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800/80 px-2 py-3 font-mono text-xs text-slate-400">
              <span>
                Page {result.page} of {result.totalPages} ({result.total} total companies)
              </span>
              <div className="flex items-center gap-2">
                {result.page > 1 && (
                  <Link
                    href={`/companies?page=${result.page - 1}${params.search ? `&search=${params.search}` : ''}${params.industry ? `&industry=${params.industry}` : ''}${params.location ? `&location=${params.location}` : ''}${params.sortBy ? `&sortBy=${params.sortBy}` : ''}`}
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
                    href={`/companies?page=${result.page + 1}${params.search ? `&search=${params.search}` : ''}${params.industry ? `&industry=${params.industry}` : ''}${params.location ? `&location=${params.location}` : ''}${params.sortBy ? `&sortBy=${params.sortBy}` : ''}`}
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
