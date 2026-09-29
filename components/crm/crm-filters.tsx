'use client';

import { Search, Filter, Kanban, List, RotateCcw } from 'lucide-react';
import { Input, Button, Badge } from '@/components/ui';
import type { CrmFilterParams } from '@/types/crm';

interface CrmFiltersProps {
  filters: CrmFilterParams;
  onFilterChange: (filters: Partial<CrmFilterParams>) => void;
  onReset: () => void;
  activeView: 'kanban' | 'list';
  onViewChange: (view: 'kanban' | 'list') => void;
  totalFiltered: number;
  totalAll: number;
}

export function CrmFilters({
  filters,
  onFilterChange,
  onReset,
  activeView,
  onViewChange,
  totalFiltered,
  totalAll,
}: CrmFiltersProps) {
  const hasActiveFilters = Boolean(
    filters.search ||
    (filters.status && filters.status !== 'all') ||
    (filters.follow_up_state && filters.follow_up_state !== 'all') ||
    (filters.outreach_state && filters.outreach_state !== 'all') ||
    filters.location
  );

  return (
    <div
      className="space-y-3 rounded-xl border border-slate-800 bg-[#0C1220]/80 p-4"
      data-testid="crm-filters"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Search company, contact, opportunity, or location..."
            className="h-9 border-slate-800 bg-slate-900/60 pl-9 text-xs focus:border-sky-500"
            data-testid="crm-search-input"
          />
        </div>

        {/* View Toggle & Reset */}
        <div className="flex items-center gap-2">
          {/* Kanban / List Toggle */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/60 p-0.5">
            <button
              type="button"
              onClick={() => onViewChange('kanban')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeView === 'kanban'
                  ? 'border border-sky-500/30 bg-sky-500/20 text-sky-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              data-testid="view-toggle-kanban"
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Pipeline</span>
            </button>
            <button
              type="button"
              onClick={() => onViewChange('list')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeView === 'list'
                  ? 'border border-sky-500/30 bg-sky-500/20 text-sky-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              data-testid="view-toggle-list"
            >
              <List className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
          </div>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-9 px-2 text-xs text-slate-400 hover:text-slate-200"
              leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              data-testid="crm-reset-filters-btn"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Filter Selects Row */}
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-800/60 pt-1 text-xs">
        <div className="mr-1 flex items-center gap-1.5 text-slate-400">
          <Filter className="h-3 w-3" />
          <span className="font-mono text-[10px] uppercase">Filter:</span>
        </div>

        {/* Status Filter */}
        <select
          value={filters.status || 'all'}
          onChange={(e) => onFilterChange({ status: e.target.value })}
          className="h-8 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 text-xs text-slate-300 focus:border-sky-500 focus:outline-none"
          data-testid="crm-status-filter"
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="qualified">Qualified</option>
          <option value="approved">Approved</option>
          <option value="contacted">Contacted</option>
          <option value="replied">Replied</option>
          <option value="interested">Interested</option>
          <option value="closed">Closed / Won</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* Follow-up State Filter */}
        <select
          value={filters.follow_up_state || 'all'}
          onChange={(e) => onFilterChange({ follow_up_state: e.target.value })}
          className="h-8 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 text-xs text-slate-300 focus:border-sky-500 focus:outline-none"
          data-testid="crm-follow-up-filter"
        >
          <option value="all">All Follow-ups</option>
          <option value="overdue">Overdue</option>
          <option value="due_today">Due Today</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
          <option value="none">No Follow-up</option>
        </select>

        {/* Outreach State Filter */}
        <select
          value={filters.outreach_state || 'all'}
          onChange={(e) => onFilterChange({ outreach_state: e.target.value })}
          className="h-8 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 text-xs text-slate-300 focus:border-sky-500 focus:outline-none"
          data-testid="crm-outreach-filter"
        >
          <option value="all">All Outreach</option>
          <option value="draft">Draft Generated</option>
          <option value="approved">Approved</option>
          <option value="sent">Sent</option>
          <option value="replied">Replied</option>
          <option value="none">No Outreach</option>
        </select>

        {/* Count Telemetry */}
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px] text-slate-400">
            Showing {totalFiltered} of {totalAll}
          </Badge>
        </div>
      </div>
    </div>
  );
}
