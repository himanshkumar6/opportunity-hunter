'use client';

import {
  Layers,
  Sparkles,
  CheckCircle,
  Mail,
  MessageSquare,
  Flame,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import type { CrmMetrics } from '@/types/crm';

interface CrmMetricsCardsProps {
  metrics: CrmMetrics;
  onFilterStatus?: (status: string) => void;
  activeStatus?: string;
}

export function CrmMetricsCards({ metrics, onFilterStatus, activeStatus }: CrmMetricsCardsProps) {
  const cards = [
    {
      label: 'Total Pipeline',
      value: metrics.total,
      icon: Layers,
      color: 'text-slate-200',
      bgColor: 'bg-slate-800/40',
      borderColor: 'border-slate-800',
      filterKey: 'all',
    },
    {
      label: 'New Leads',
      value: metrics.new,
      icon: Sparkles,
      color: 'text-sky-400',
      bgColor: 'bg-sky-950/20',
      borderColor: 'border-sky-800/40',
      filterKey: 'new',
    },
    {
      label: 'Qualified',
      value: metrics.qualified,
      icon: CheckCircle,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-950/20',
      borderColor: 'border-indigo-800/40',
      filterKey: 'qualified',
    },
    {
      label: 'Contacted',
      value: metrics.contacted,
      icon: Mail,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/20',
      borderColor: 'border-amber-800/40',
      filterKey: 'contacted',
    },
    {
      label: 'Replied',
      value: metrics.replied,
      icon: MessageSquare,
      color: 'text-purple-400',
      bgColor: 'bg-purple-950/20',
      borderColor: 'border-purple-800/40',
      filterKey: 'replied',
    },
    {
      label: 'Interested',
      value: metrics.interested,
      icon: Flame,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/20',
      borderColor: 'border-emerald-800/40',
      filterKey: 'interested',
    },
    {
      label: 'Closed / Won',
      value: metrics.closed,
      icon: Award,
      color: 'text-teal-400',
      bgColor: 'bg-teal-950/20',
      borderColor: 'border-teal-800/40',
      filterKey: 'closed',
    },
    {
      label: 'Overdue Follow-ups',
      value: metrics.overdue_follow_ups,
      icon: AlertTriangle,
      color: metrics.overdue_follow_ups > 0 ? 'text-rose-400' : 'text-slate-400',
      bgColor: metrics.overdue_follow_ups > 0 ? 'bg-rose-950/30' : 'bg-slate-900/40',
      borderColor: metrics.overdue_follow_ups > 0 ? 'border-rose-700/60' : 'border-slate-800',
      filterKey: 'overdue_follow_ups',
      isAlert: metrics.overdue_follow_ups > 0,
    },
  ];

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8"
      data-testid="crm-metrics-grid"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive =
          activeStatus === card.filterKey || (!activeStatus && card.filterKey === 'all');

        return (
          <Card
            key={card.label}
            onClick={() => {
              if (card.filterKey !== 'overdue_follow_ups' && onFilterStatus) {
                onFilterStatus(card.filterKey);
              }
            }}
            className={`cursor-pointer transition-all duration-150 hover:-translate-y-0.5 ${card.bgColor} ${card.borderColor} ${
              isActive ? 'shadow-md ring-1 shadow-sky-950/30 ring-sky-500' : ''
            }`}
            data-testid={`crm-metric-${card.filterKey}`}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="truncate font-mono text-[10px] text-slate-400 uppercase">
                  {card.label}
                </span>
                <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${card.color}`} />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className={`font-mono text-xl font-bold ${card.color}`}>{card.value}</span>
                {card.isAlert && (
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
