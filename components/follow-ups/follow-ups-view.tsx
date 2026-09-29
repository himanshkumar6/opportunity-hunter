'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { FollowUpMetricsCards } from './follow-up-metrics-cards';
import { FollowUpFilters } from './follow-up-filters';
import { FollowUpTable } from './follow-up-table';
import { CreateFollowUpModal } from './create-follow-up-modal';
import type { FollowUpWithRelations, FollowUpMetrics } from '@/types/follow-ups';
import type { PaginatedResponse } from '@/types/api';

interface FollowUpsViewProps {
  initialResult: PaginatedResponse<FollowUpWithRelations>;
  metrics: FollowUpMetrics;
}

export function FollowUpsView({ initialResult, metrics }: FollowUpsViewProps) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  return (
    <div className="space-y-6" data-testid="follow-ups-view">
      {/* Create Modal */}
      <CreateFollowUpModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Metrics Row */}
      <FollowUpMetricsCards metrics={metrics} />

      {/* Filters & Actions */}
      <FollowUpFilters onOpenCreateModal={() => setIsCreateOpen(true)} />

      {/* Table / List */}
      <FollowUpTable
        followUps={initialResult.items}
        total={initialResult.total}
        page={initialResult.page}
        pageSize={initialResult.pageSize}
        totalPages={initialResult.totalPages}
        onRefresh={() => router.refresh()}
        onOpenCreate={() => setIsCreateOpen(true)}
      />
    </div>
  );
}
