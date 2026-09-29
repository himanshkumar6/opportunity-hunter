'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, MapPin, Filter, RotateCcw } from 'lucide-react';
import { Input, Select, Button } from '@/components/ui';

interface JobFiltersProps {
  initialSearch?: string;
  initialLocation?: string;
  initialSource?: string;
  initialStatus?: string;
}

export function JobFilters({
  initialSearch = '',
  initialLocation = '',
  initialSource = 'all',
  initialStatus = 'all',
}: JobFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(initialSearch);
  const [location, setLocation] = React.useState(initialLocation);
  const [source, setSource] = React.useState(initialSource);
  const [status, setStatus] = React.useState(initialStatus);

  const applyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (search.trim()) params.set('search', search.trim());
    else params.delete('search');

    if (location.trim()) params.set('location', location.trim());
    else params.delete('location');

    if (source && source !== 'all') params.set('source', source);
    else params.delete('source');

    if (status && status !== 'all') params.set('status', status);
    else params.delete('status');

    params.set('page', '1');

    router.push(`${pathname}?${params.toString()}`);
  };

  const resetFilters = () => {
    setSearch('');
    setLocation('');
    setSource('all');
    setStatus('all');
    router.push(pathname);
  };

  return (
    <form
      onSubmit={applyFilters}
      className="space-y-3 rounded-xl border border-slate-800 bg-[#0A1120] p-4"
      data-testid="job-filters-form"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="Search job title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-3.5 w-3.5" />}
        />

        <Input
          placeholder="Filter location (Remote, City)..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          leftIcon={<MapPin className="h-3.5 w-3.5" />}
        />

        <Select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          options={[
            { value: 'all', label: 'All Sources' },
            { value: 'google_jobs', label: 'Google Jobs (SerpApi)' },
            { value: 'linkedin', label: 'LinkedIn' },
            { value: 'remoteok', label: 'RemoteOK' },
            { value: 'indeed', label: 'Indeed' },
          ]}
        />

        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'new', label: 'New' },
            { value: 'qualified', label: 'Qualified' },
            { value: 'approved', label: 'Approved' },
            { value: 'contacted', label: 'Contacted' },
            { value: 'replied', label: 'Replied' },
            { value: 'interested', label: 'Interested' },
            { value: 'closed', label: 'Closed' },
            { value: 'rejected', label: 'Rejected' },
          ]}
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={resetFilters}
          leftIcon={<RotateCcw className="h-3 w-3" />}
        >
          Reset Filters
        </Button>

        <Button type="submit" variant="sky" size="xs" leftIcon={<Filter className="h-3 w-3" />}>
          Filter Jobs
        </Button>
      </div>
    </form>
  );
}
