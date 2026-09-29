import { Skeleton } from '@/components/ui';

export default function FollowUpDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>

      <Skeleton className="h-44 rounded-xl border border-slate-800" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <Skeleton className="h-36 rounded-xl border border-slate-800" />
          <Skeleton className="h-36 rounded-xl border border-slate-800" />
          <Skeleton className="h-44 rounded-xl border border-slate-800" />
        </div>
        <div className="lg:col-span-7">
          <Skeleton className="h-96 rounded-xl border border-slate-800" />
        </div>
      </div>
    </div>
  );
}
