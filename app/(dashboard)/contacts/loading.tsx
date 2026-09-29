import { Skeleton, SkeletonTable } from '@/components/ui';

export default function ContactsLoading() {
  return (
    <div className="space-y-6">
      {/* Banner Skeleton */}
      <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-3.5 w-72" />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>

      {/* Table Skeleton */}
      <SkeletonTable rows={8} columns={8} />
    </div>
  );
}
