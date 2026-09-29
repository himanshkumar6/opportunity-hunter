'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Filter, Building2, MapPin, ArrowUpDown } from 'lucide-react';
import { Input, Button } from '@/components/ui';

const industryOptions = [
  { value: '', label: 'All Industries' },
  { value: 'Real estate developer', label: 'Real Estate Developer' },
  { value: 'Real estate consultant', label: 'Real Estate Consultant' },
  { value: 'Real estate agency', label: 'Real Estate Agency' },
  { value: 'Real estate agent', label: 'Real Estate Agent' },
];

const sortOptions = [
  { value: 'name', label: 'Sort by Name (A-Z)' },
  { value: 'newest', label: 'Sort by Newest' },
  { value: 'oldest', label: 'Sort by Oldest' },
];

export function CompanyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(searchParams.get('search') || '');
  const [industry, setIndustry] = React.useState(searchParams.get('industry') || '');
  const [location, setLocation] = React.useState(searchParams.get('location') || '');
  const [sortBy, setSortBy] = React.useState(searchParams.get('sortBy') || 'name');

  const applyFilters = React.useCallback(
    (newSearch: string, newIndustry: string, newLocation: string, newSort: string) => {
      const params = new URLSearchParams();
      if (newSearch) params.set('search', newSearch);
      if (newIndustry) params.set('industry', newIndustry);
      if (newLocation) params.set('location', newLocation);
      if (newSort && newSort !== 'name') params.set('sortBy', newSort);

      router.push(`/companies?${params.toString()}`);
    },
    [router]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(search, industry, location, sortBy);
  };

  const handleReset = () => {
    setSearch('');
    setIndustry('');
    setLocation('');
    setSortBy('name');
    router.push('/companies');
  };

  const hasActiveFilters = Boolean(search || industry || location || (sortBy && sortBy !== 'name'));

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-4 shadow-sm">
      <form onSubmit={handleSearchSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company Search Input */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search company name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-slate-500" />}
              className="w-full bg-[#080D19]"
            />
          </div>

          {/* Industry Filter */}
          <div className="relative">
            <div className="relative">
              <select
                aria-label="Filter by industry"
                value={industry}
                onChange={(e) => {
                  setIndustry(e.target.value);
                  applyFilters(search, e.target.value, location, sortBy);
                }}
                className="h-10 w-full appearance-none rounded-lg border border-slate-800 bg-[#080D19] px-3.5 pr-8 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                {industryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0C1220] text-slate-200">
                    {opt.label}
                  </option>
                ))}
              </select>
              <Building2 className="pointer-events-none absolute top-3 right-3 h-4 w-4 text-slate-500" />
            </div>
          </div>

          {/* Location Filter */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Filter location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              leftIcon={<MapPin className="h-4 w-4 text-slate-500" />}
              className="w-full bg-[#080D19]"
            />
          </div>

          {/* Sort By Filter */}
          <div className="relative">
            <div className="relative">
              <select
                aria-label="Sort companies"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  applyFilters(search, industry, location, e.target.value);
                }}
                className="h-10 w-full appearance-none rounded-lg border border-slate-800 bg-[#080D19] px-3.5 pr-8 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0C1220] text-slate-200">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ArrowUpDown className="pointer-events-none absolute top-3 right-3 h-4 w-4 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Filter Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 pt-1">
          <span className="text-[11px] text-slate-500">
            Real enterprise entities discovered via Google Maps & Search automation
          </span>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleReset}
                leftIcon={<X className="h-3.5 w-3.5" />}
              >
                Reset
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="xs"
              leftIcon={<Filter className="h-3.5 w-3.5" />}
            >
              Filter Companies
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
