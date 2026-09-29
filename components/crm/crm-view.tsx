'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Kanban, Layers, Sparkles } from 'lucide-react';
import { EmptyState, Button } from '@/components/ui';
import { CrmMetricsCards } from './crm-metrics-cards';
import { CrmFilters } from './crm-filters';
import { CrmKanbanView } from './crm-kanban-view';
import { CrmListView } from './crm-list-view';
import { CreateFollowUpModal } from '@/components/follow-ups/create-follow-up-modal';
import type { CrmOpportunityCard, CrmMetrics, CrmFilterParams } from '@/types/crm';
import type { OpportunityStatus } from '@/types/opportunities';

interface CrmViewProps {
  initialItems: CrmOpportunityCard[];
  initialMetrics: CrmMetrics;
}

export function CrmView({ initialItems, initialMetrics }: CrmViewProps) {
  const router = useRouter();
  const [items, setItems] = React.useState<CrmOpportunityCard[]>(initialItems);
  const [metrics, setMetrics] = React.useState<CrmMetrics>(initialMetrics);
  const [activeView, setActiveView] = React.useState<'kanban' | 'list'>('kanban');
  const [filters, setFilters] = React.useState<CrmFilterParams>({
    status: 'all',
    follow_up_state: 'all',
    outreach_state: 'all',
    search: '',
  });

  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = React.useState<string | null>(null);

  // Follow-up scheduling modal state
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = React.useState(false);
  const [selectedOppIdForFollowUp, setSelectedOppIdForFollowUp] = React.useState<string | null>(
    null
  );

  // Client-side filtering logic
  const filteredItems = React.useMemo(() => {
    let result = items;

    if (filters.status && filters.status !== 'all') {
      const s = filters.status.toLowerCase();
      result = result.filter((c) => c.status === s);
    }

    if (filters.follow_up_state && filters.follow_up_state !== 'all') {
      const fs = filters.follow_up_state.toLowerCase();
      result = result.filter((c) => c.follow_up_state === fs);
    }

    if (filters.outreach_state && filters.outreach_state !== 'all') {
      const os = filters.outreach_state.toLowerCase();
      result = result.filter((c) => c.outreach_state === os);
    }

    if (filters.search && filters.search.trim().length > 0) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.company?.name && c.company.name.toLowerCase().includes(q)) ||
          (c.contact?.name && c.contact.name.toLowerCase().includes(q)) ||
          (c.location && c.location.toLowerCase().includes(q))
      );
    }

    return result;
  }, [items, filters]);

  const handleFilterChange = (partial: Partial<CrmFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      follow_up_state: 'all',
      outreach_state: 'all',
      search: '',
    });
  };

  const handleStatusChange = async (id: string, newStatus: OpportunityStatus) => {
    const previousItem = items.find((c) => c.id === id);
    if (!previousItem || previousItem.status === newStatus) return;

    const previousStatus = previousItem.status;

    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );

    // Update metrics optimistically
    setMetrics((prev) => {
      const updated = { ...prev };
      if (previousStatus in updated) {
        (updated as any)[previousStatus] = Math.max(0, (updated as any)[previousStatus] - 1);
      }
      if (newStatus in updated) {
        (updated as any)[newStatus] = ((updated as any)[newStatus] || 0) + 1;
      }
      return updated;
    });

    try {
      setUpdatingId(id);
      setStatusFeedback(null);

      const res = await fetch(`/api/opportunities/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update opportunity status');
      }

      setStatusFeedback(`Opportunity status updated to ${newStatus.toUpperCase()}`);
      setTimeout(() => setStatusFeedback(null), 3000);
      router.refresh();
    } catch (err: unknown) {
      // Revert optimistic update on failure
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: previousStatus } : item))
      );
      setMetrics((prev) => {
        const updated = { ...prev };
        if (newStatus in updated) {
          (updated as any)[newStatus] = Math.max(0, (updated as any)[newStatus] - 1);
        }
        if (previousStatus in updated) {
          (updated as any)[previousStatus] = ((updated as any)[previousStatus] || 0) + 1;
        }
        return updated;
      });

      const message = err instanceof Error ? err.message : 'Error updating status';
      alert(`Status update failed: ${message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleScheduleFollowUp = (opportunityId: string) => {
    setSelectedOppIdForFollowUp(opportunityId);
    setIsFollowUpModalOpen(true);
  };

  return (
    <div className="space-y-6" data-testid="crm-workspace">
      {/* Schedule Follow-up Modal */}
      <CreateFollowUpModal
        open={isFollowUpModalOpen}
        onOpenChange={setIsFollowUpModalOpen}
        initialOpportunityId={selectedOppIdForFollowUp || undefined}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-mono text-xl font-bold tracking-tight text-white">
            <Kanban className="h-5 w-5 text-sky-400" />
            CRM & Pipeline Workspace
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            End-to-end lifecycle management across accounts, contacts, outreach, and pipeline
            stages.
          </p>
        </div>

        {statusFeedback && (
          <div className="animate-fadeIn flex items-center gap-1.5 rounded-lg border border-emerald-700/60 bg-emerald-950/80 px-3 py-1.5 font-mono text-xs text-emerald-300">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>{statusFeedback}</span>
          </div>
        )}
      </div>

      {/* 8-Card Telemetry Grid */}
      <CrmMetricsCards
        metrics={metrics}
        onFilterStatus={(st) => handleFilterChange({ status: st })}
        activeStatus={filters.status}
      />

      {/* Filters Bar */}
      <CrmFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        activeView={activeView}
        onViewChange={setActiveView}
        totalFiltered={filteredItems.length}
        totalAll={items.length}
      />

      {/* Workspace Body: Kanban or List */}
      {filteredItems.length > 0 ? (
        activeView === 'kanban' ? (
          <CrmKanbanView
            cards={filteredItems}
            onStatusChange={handleStatusChange}
            onScheduleFollowUp={handleScheduleFollowUp}
            updatingId={updatingId}
          />
        ) : (
          <CrmListView
            cards={filteredItems}
            onStatusChange={handleStatusChange}
            onScheduleFollowUp={handleScheduleFollowUp}
            updatingId={updatingId}
          />
        )
      ) : (
        <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-12 text-center">
          <EmptyState
            icon={<Layers className="h-8 w-8 text-slate-500" />}
            title="No opportunities found"
            description={
              filters.search || (filters.status && filters.status !== 'all')
                ? 'No opportunities match your current filters. Try resetting search or status filters.'
                : 'No opportunities currently recorded in the pipeline.'
            }
            action={
              (filters.search || (filters.status && filters.status !== 'all')) && (
                <Button variant="outline" size="sm" onClick={handleResetFilters}>
                  Clear Filters
                </Button>
              )
            }
          />
        </div>
      )}
    </div>
  );
}
