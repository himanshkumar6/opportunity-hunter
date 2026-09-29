'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Filter, Building2, ShieldCheck, ArrowUpDown } from 'lucide-react';
import { Input, Button } from '@/components/ui';

const confidenceOptions = [
  { value: '', label: 'All Confidence Levels' },
  { value: 'high', label: 'High (≥ 70%)' },
  { value: 'medium', label: 'Medium (40% - 69%)' },
  { value: 'low', label: 'Low (< 40%)' },
];

const sortOptions = [
  { value: 'name', label: 'Sort by Name (A-Z)' },
  { value: 'newest', label: 'Sort by Newest' },
  { value: 'confidence', label: 'Sort by Confidence' },
];

export function ContactFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(searchParams.get('search') || '');
  const [companyName, setCompanyName] = React.useState(searchParams.get('companyName') || '');
  const [confidence, setConfidence] = React.useState(searchParams.get('confidence') || '');
  const [sortBy, setSortBy] = React.useState(searchParams.get('sortBy') || 'name');

  const applyFilters = React.useCallback(
    (newSearch: string, newCompany: string, newConfidence: string, newSort: string) => {
      const params = new URLSearchParams();
      if (newSearch) params.set('search', newSearch);
      if (newCompany) params.set('companyName', newCompany);
      if (newConfidence) params.set('confidence', newConfidence);
      if (newSort && newSort !== 'name') params.set('sortBy', newSort);

      router.push(`/contacts?${params.toString()}`);
    },
    [router]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(search, companyName, confidence, sortBy);
  };

  const handleReset = () => {
    setSearch('');
    setCompanyName('');
    setConfidence('');
    setSortBy('name');
    router.push('/contacts');
  };

  const hasActiveFilters = Boolean(
    search || companyName || confidence || (sortBy && sortBy !== 'name')
  );

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-4 shadow-sm">
      <form onSubmit={handleSearchSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Contact Search Input */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search name, role, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-slate-500" />}
              className="w-full bg-[#080D19]"
            />
          </div>

          {/* Company Search Input */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Filter by company..."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              leftIcon={<Building2 className="h-4 w-4 text-slate-500" />}
              className="w-full bg-[#080D19]"
            />
          </div>

          {/* Confidence Filter */}
          <div className="relative">
            <div className="relative">
              <select
                aria-label="Filter by confidence"
                value={confidence}
                onChange={(e) => {
                  setConfidence(e.target.value);
                  applyFilters(search, companyName, e.target.value, sortBy);
                }}
                className="h-10 w-full appearance-none rounded-lg border border-slate-800 bg-[#080D19] px-3.5 pr-8 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                {confidenceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0C1220] text-slate-200">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ShieldCheck className="pointer-events-none absolute top-3 right-3 h-4 w-4 text-slate-500" />
            </div>
          </div>

          {/* Sort By Filter */}
          <div className="relative">
            <div className="relative">
              <select
                aria-label="Sort contacts"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  applyFilters(search, companyName, confidence, e.target.value);
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
            Decision-maker contact channels enriched from public enterprise data
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
              Filter Contacts
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
