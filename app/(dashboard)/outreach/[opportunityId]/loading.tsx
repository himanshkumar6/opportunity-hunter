import { Skeleton } from '@/components/ui';

export default function OpportunityOutreachLoading() {
  return (
    <div className="space-y-6">
      {/* Top back link skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Opportunity context header skeleton */}
      <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-6">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-7 w-80" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Composer skeleton (2 cols) */}
        <div className="space-y-4 rounded-xl border border-slate-800 bg-[#0C1220] p-6 lg:col-span-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <div className="flex justify-between pt-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </div>

        {/* Sidebar skeleton (1 col) */}
        <div className="space-y-6 lg:col-span-1">
          <div className="space-y-3 rounded-xl border border-slate-800 bg-[#0C1220] p-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
