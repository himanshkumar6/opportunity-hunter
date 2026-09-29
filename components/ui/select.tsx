import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, AlertCircle } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      options = [],
      placeholder,
      id,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-slate-300 select-none"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'h-9 w-full appearance-none rounded-lg border bg-[#0B1220] px-3 py-1.5 pr-8 text-xs text-white transition-colors',
              'focus:border-emerald-500/80 focus:bg-[#0E1729] focus:ring-1 focus:ring-emerald-500/80 focus:outline-none',
              'cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-900/50 disabled:opacity-50',
              error
                ? 'border-rose-600 focus:border-rose-500 focus:ring-rose-500/80'
                : 'border-slate-800 hover:border-slate-700',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="bg-[#0B1220] text-slate-500">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="bg-[#0B1220] text-white"
              >
                {opt.label}
              </option>
            ))}
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-slate-400">
            <ChevronDown className="h-4 w-4" />
          </div>
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

Select.displayName = 'Select';
