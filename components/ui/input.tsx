import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-300 select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={type}
            disabled={disabled}
            className={cn(
              'h-9 w-full rounded-lg border bg-[#0B1220] px-3 py-1.5 text-xs text-white placeholder-slate-500 transition-colors',
              'focus:border-emerald-500/80 focus:bg-[#0E1729] focus:ring-1 focus:ring-emerald-500/80 focus:outline-none',
              'disabled:cursor-not-allowed disabled:bg-slate-900/50 disabled:opacity-50',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              error
                ? 'border-rose-600 focus:border-rose-500 focus:ring-rose-500/80'
                : 'border-slate-800 hover:border-slate-700',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-slate-400">{rightIcon}</div>
          )}
        </div>
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-rose-400" role="alert">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {!error && helperText && <p className="text-xs text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
