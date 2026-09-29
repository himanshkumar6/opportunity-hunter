import * as React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-shimmer rounded-md bg-slate-800/60', className)} {...props} />;
}

export function SkeletonAvatar({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeMap = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  return <Skeleton className={cn('flex-shrink-0 rounded-full', sizeMap[size], className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 rounded-xl border border-slate-800 bg-[#0C1220] p-5', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-16 rounded-md" />
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'w-full space-y-4 rounded-lg border border-slate-800 bg-[#0A0F1D] p-4',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`head-${i}`} className="h-3.5 w-24" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={`row-${r}`}
            className="flex items-center justify-between border-b border-slate-800/40 py-2 last:border-b-0"
          >
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={`cell-${r}-${c}`} className={cn('h-3.5', c === 0 ? 'w-36' : 'w-20')} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
