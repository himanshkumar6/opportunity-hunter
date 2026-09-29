import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'emerald'
    | 'success'
    | 'sky'
    | 'info'
    | 'amber'
    | 'warning'
    | 'rose'
    | 'danger'
    | 'purple'
    | 'slate'
    | 'secondary'
    | 'outline';
  size?: 'sm' | 'md';
  dot?: boolean;
  dotPulse?: boolean;
}

export function Badge({
  className,
  variant = 'default',
  size = 'sm',
  dot = false,
  dotPulse = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
    emerald: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
    success: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
    sky: 'bg-sky-950/60 text-sky-300 border-sky-800/60',
    info: 'bg-sky-950/60 text-sky-300 border-sky-800/60',
    amber: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
    warning: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
    rose: 'bg-rose-950/60 text-rose-300 border-rose-800/60',
    danger: 'bg-rose-950/60 text-rose-300 border-rose-800/60',
    purple: 'bg-purple-950/60 text-purple-300 border-purple-800/60',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
    secondary: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
    outline: 'bg-transparent text-slate-300 border-slate-700',
  };

  const dotColors = {
    default: 'bg-emerald-400',
    emerald: 'bg-emerald-400',
    success: 'bg-emerald-400',
    sky: 'bg-sky-400',
    info: 'bg-sky-400',
    amber: 'bg-amber-400',
    warning: 'bg-amber-400',
    rose: 'bg-rose-400',
    danger: 'bg-rose-400',
    purple: 'bg-purple-400',
    slate: 'bg-slate-400',
    secondary: 'bg-slate-400',
    outline: 'bg-slate-400',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 flex-shrink-0 rounded-full',
            dotColors[variant],
            dotPulse && 'animate-pulse'
          )}
        />
      )}
      {children}
    </span>
  );
}
