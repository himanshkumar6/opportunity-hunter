'use client';

import * as React from 'react';
import {
  Sparkles,
  CheckCircle,
  Mail,
  MessageSquare,
  Flame,
  Award,
  XCircle,
  ThumbsUp,
} from 'lucide-react';
import { CrmCard } from './crm-card';
import type { CrmOpportunityCard } from '@/types/crm';
import type { OpportunityStatus } from '@/types/opportunities';

interface CrmKanbanViewProps {
  cards: CrmOpportunityCard[];
  onStatusChange: (id: string, newStatus: OpportunityStatus) => Promise<void>;
  onScheduleFollowUp: (opportunityId: string) => void;
  updatingId?: string | null;
}

interface ColumnConfig {
  status: OpportunityStatus;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    status: 'new',
    title: 'New',
    icon: Sparkles,
    accentColor: 'border-t-sky-500 text-sky-400',
    badgeBg: 'bg-sky-950/60 text-sky-300 border-sky-800/40',
  },
  {
    status: 'qualified',
    title: 'Qualified',
    icon: CheckCircle,
    accentColor: 'border-t-indigo-500 text-indigo-400',
    badgeBg: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/40',
  },
  {
    status: 'approved',
    title: 'Approved',
    icon: ThumbsUp,
    accentColor: 'border-t-blue-500 text-blue-400',
    badgeBg: 'bg-blue-950/60 text-blue-300 border-blue-800/40',
  },
  {
    status: 'contacted',
    title: 'Contacted',
    icon: Mail,
    accentColor: 'border-t-amber-500 text-amber-400',
    badgeBg: 'bg-amber-950/60 text-amber-300 border-amber-800/40',
  },
  {
    status: 'replied',
    title: 'Replied',
    icon: MessageSquare,
    accentColor: 'border-t-purple-500 text-purple-400',
    badgeBg: 'bg-purple-950/60 text-purple-300 border-purple-800/40',
  },
  {
    status: 'interested',
    title: 'Interested',
    icon: Flame,
    accentColor: 'border-t-emerald-500 text-emerald-400',
    badgeBg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40',
  },
  {
    status: 'closed',
    title: 'Closed / Won',
    icon: Award,
    accentColor: 'border-t-teal-500 text-teal-400',
    badgeBg: 'bg-teal-950/60 text-teal-300 border-teal-800/40',
  },
  {
    status: 'rejected',
    title: 'Rejected',
    icon: XCircle,
    accentColor: 'border-t-rose-500 text-rose-400',
    badgeBg: 'bg-rose-950/60 text-rose-300 border-rose-800/40',
  },
];

export function CrmKanbanView({
  cards,
  onStatusChange,
  onScheduleFollowUp,
  updatingId,
}: CrmKanbanViewProps) {
  // Group cards by status
  const cardsByStatus = React.useMemo(() => {
    const map = new Map<OpportunityStatus, CrmOpportunityCard[]>();
    COLUMNS.forEach((col) => map.set(col.status, []));

    cards.forEach((card) => {
      const list = map.get(card.status) || [];
      list.push(card);
      map.set(card.status, list);
    });

    return map;
  }, [cards]);

  return (
    <div className="flex gap-4 overflow-x-auto pt-2 pb-6" data-testid="crm-kanban-board">
      {COLUMNS.map((column) => {
        const columnCards = cardsByStatus.get(column.status) || [];
        const Icon = column.icon;

        return (
          <div
            key={column.status}
            className="flex w-80 flex-shrink-0 flex-col rounded-xl border border-slate-800/80 bg-[#080d1a]/80 shadow-md"
            data-testid={`crm-column-${column.status}`}
          >
            {/* Column Header */}
            <div
              className={`flex items-center justify-between border-t-2 border-b border-slate-800/80 px-3.5 py-3 ${column.accentColor}`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-bold tracking-wide text-white">{column.title}</span>
              </div>

              <span
                className={`rounded-full border px-2 py-0.5 font-mono text-[11px] font-bold ${column.badgeBg}`}
                data-testid={`crm-column-count-${column.status}`}
              >
                {columnCards.length}
              </span>
            </div>

            {/* Cards List in Column */}
            <div className="max-h-[calc(100vh-280px)] min-h-[160px] flex-1 space-y-3 overflow-y-auto p-3">
              {columnCards.length > 0 ? (
                columnCards.map((card) => (
                  <CrmCard
                    key={card.id}
                    card={card}
                    onStatusChange={onStatusChange}
                    onScheduleFollowUp={onScheduleFollowUp}
                    isUpdating={updatingId === card.id}
                  />
                ))
              ) : (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-800/60 p-4 text-center">
                  <p className="text-[11px] text-slate-500 italic">No opportunities</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
