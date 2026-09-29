import * as React from 'react';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export function EmptyState({
  className,
  icon,
  title,
  description,
  action,
  compact = false,
  children,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-[#0A0F1D]/60 p-8 text-center',
        compact ? 'px-4 py-6' : 'px-6 py-12',
        className
      )}
      {...props}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 shadow-inner">
        {icon || <Search className="h-6 w-6 text-slate-500" />}
      </div>
      <h4 className="text-sm font-semibold tracking-tight text-white">{title}</h4>
      {description && (
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-400">{description}</p>
      )}
      {(action || children) && (
        <div className="mt-5 flex items-center gap-3">
          {action}
          {children}
        </div>
      )}
    </div>
  );
}
