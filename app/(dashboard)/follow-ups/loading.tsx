import { Skeleton } from '@/components/ui';

export default function FollowUpsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Banner Skeleton */}
      <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl border border-slate-800" />
        ))}
      </div>

      {/* Filters Skeleton */}
      <Skeleton className="h-24 rounded-xl border border-slate-800" />

      {/* Table Skeleton */}
      <div className="space-y-3 rounded-xl border border-slate-800 bg-[#0C1220] p-4">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
