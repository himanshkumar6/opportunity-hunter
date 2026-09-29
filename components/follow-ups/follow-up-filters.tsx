'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, Filter, RotateCcw } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import type { FollowUpFilterState } from '@/types/follow-ups';

interface FollowUpFiltersProps {
  onOpenCreateModal?: () => void;
}

export function FollowUpFilters({ onOpenCreateModal }: FollowUpFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(searchParams.get('search') || '');
  const activeFilter = (searchParams.get('filter') as FollowUpFilterState) || 'all';
  const activePriority = searchParams.get('priority') || 'all';

  const filterTabs: { id: FollowUpFilterState; label: string }[] = [
    { id: 'all', label: 'All Follow-ups' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'due', label: 'Due Today' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
  ];

  const updateFilters = (newParams: Record<string, string | null>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === '' || val === 'all') {
        current.delete(key);
      } else {
        current.set(key, val);
      }
    });

    current.delete('page'); // Reset to page 1 on filter change
    router.push(`/follow-ups?${current.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: search.trim() || null });
  };

  const handleReset = () => {
    setSearch('');
    router.push('/follow-ups');
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-[#0C1220] p-4">
      {/* Top row: Search, Priority filter & Action button */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 md:max-w-md">
          <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, opportunity, contact, note..."
            className="pl-9 text-xs"
            data-testid="follow-up-search-input"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Priority selector */}
          <Select
            value={activePriority}
            onChange={(e) => updateFilters({ priority: e.target.value })}
            options={[
              { value: 'all', label: 'All Priorities' },
              { value: 'urgent', label: 'Urgent Priority' },
              { value: 'high', label: 'High Priority' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'low', label: 'Low Priority' },
            ]}
            className="w-36 text-xs"
            data-testid="follow-up-priority-select"
          />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            data-testid="follow-up-reset-filters-btn"
          >
            Reset
          </Button>

          {onOpenCreateModal && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onOpenCreateModal}
              leftIcon={<Plus className="h-4 w-4" />}
              data-testid="open-create-follow-up-btn"
            >
              Schedule Follow-up
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs row */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-800/80 pt-3">
        <Filter className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => updateFilters({ filter: tab.id })}
              data-testid={`filter-tab-${tab.id}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? tab.id === 'overdue'
                    ? 'border border-rose-800/60 bg-rose-950/80 text-rose-300'
                    : tab.id === 'completed'
                      ? 'border border-emerald-800/60 bg-emerald-950/80 text-emerald-300'
                      : 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
