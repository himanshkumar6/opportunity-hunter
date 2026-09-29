'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, MapPin, Filter, RotateCcw } from 'lucide-react';
import { Input, Select, Button } from '@/components/ui';

interface OpportunityFiltersProps {
  initialType?: string;
  initialStatus?: string;
  initialLocation?: string;
  initialSearch?: string;
  initialSortBy?: string;
}

export function OpportunityFilters({
  initialType = 'all',
  initialStatus = 'all',
  initialLocation = '',
  initialSearch = '',
  initialSortBy = 'newest',
}: OpportunityFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(initialSearch);
  const [location, setLocation] = React.useState(initialLocation);
  const [type, setType] = React.useState(initialType);
  const [status, setStatus] = React.useState(initialStatus);
  const [sortBy, setSortBy] = React.useState(initialSortBy);

  const applyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (search.trim()) params.set('search', search.trim());
    else params.delete('search');

    if (location.trim()) params.set('location', location.trim());
    else params.delete('location');

    if (type && type !== 'all') params.set('type', type);
    else params.delete('type');

    if (status && status !== 'all') params.set('status', status);
    else params.delete('status');

    if (sortBy && sortBy !== 'newest') params.set('sortBy', sortBy);
    else params.delete('sortBy');

    params.set('page', '1');

    router.push(`${pathname}?${params.toString()}`);
  };

  const resetFilters = () => {
    setSearch('');
    setLocation('');
    setType('all');
    setStatus('all');
    setSortBy('newest');
    router.push(pathname);
  };

  return (
    <form
      onSubmit={applyFilters}
      className="space-y-3 rounded-xl border border-slate-800 bg-[#0C1220] p-4"
      data-testid="opportunity-filters-form"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Search Input */}
        <Input
          placeholder="Search title or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-3.5 w-3.5" />}
        />

        {/* Location Input */}
        <Input
          placeholder="Filter location..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          leftIcon={<MapPin className="h-3.5 w-3.5" />}
        />

        {/* Opportunity Type Select */}
        <Select
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={[
            { value: 'all', label: 'All Types' },
            { value: 'job', label: 'Job Opening' },
            { value: 'business_lead', label: 'Business Lead' },
            { value: 'website_opportunity', label: 'Website Opportunity' },
          ]}
        />

        {/* Status Select */}
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

        {/* Sort Select */}
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          options={[
            { value: 'newest', label: 'Sort: Newest' },
            { value: 'score', label: 'Sort: Match Score' },
            { value: 'oldest', label: 'Sort: Oldest' },
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

        <Button type="submit" variant="primary" size="xs" leftIcon={<Filter className="h-3 w-3" />}>
          Apply Filters
        </Button>
      </div>
    </form>
  );
}
