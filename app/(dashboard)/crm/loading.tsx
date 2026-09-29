import { Skeleton } from '@/components/ui';

export default function CrmLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl border border-slate-800" />
        ))}
      </div>

      {/* Filter Bar Skeleton */}
      <Skeleton className="h-24 rounded-xl border border-slate-800" />

      {/* Kanban Board Skeleton */}
      <div className="flex gap-4 overflow-x-auto pt-2 pb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex w-80 flex-shrink-0 flex-col space-y-3 rounded-xl border border-slate-800/80 bg-[#080d1a]/80 p-3"
          >
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
