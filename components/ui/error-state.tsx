'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './button';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  error?: Error | string | null;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({
  className,
  title = 'Something went wrong',
  message = 'An unexpected error occurred while processing your request.',
  error,
  onRetry,
  compact = false,
  ...props
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  const errorString =
    error instanceof Error ? error.message : typeof error === 'string' ? error : null;
  const errorStack = error instanceof Error ? error.stack : null;

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-rose-900/40 bg-rose-950/20 p-6 text-center',
        compact ? 'px-4 py-5' : 'px-6 py-10',
        className
      )}
      {...props}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-rose-800/60 bg-rose-950/80 text-rose-400 shadow-sm shadow-rose-950">
        <AlertTriangle className="h-6 w-6" />
      </div>

      <h4 className="text-sm font-semibold tracking-tight text-rose-200">{title}</h4>

      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-rose-300/80">{message}</p>

      {onRetry && (
        <div className="mt-4">
          <Button
            size="sm"
            variant="danger"
            onClick={onRetry}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Try again
          </Button>
        </div>
      )}

      {errorString && (
        <div className="mt-4 w-full max-w-md text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex cursor-pointer items-center gap-1.5 text-[11px] text-rose-400 select-none hover:text-rose-300"
          >
            <span>{showDetails ? 'Hide technical details' : 'Show technical details'}</span>
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showDetails && (
            <div className="mt-2 overflow-x-auto rounded-lg border border-rose-900/60 bg-black/60 p-3 font-mono text-[10px] text-rose-300">
              <p className="font-semibold">{errorString}</p>
              {errorStack && (
                <pre className="mt-1 overflow-x-auto text-[9px] leading-tight text-slate-500">
                  {errorStack}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
