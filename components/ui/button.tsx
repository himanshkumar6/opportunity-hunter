import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'default' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'subtle' | 'sky';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090D16] disabled:pointer-events-none disabled:opacity-50 select-none rounded-lg cursor-pointer';

    const variants = {
      primary:
        'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 shadow-sm shadow-emerald-950 border border-emerald-500/30',
      default:
        'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 shadow-sm shadow-emerald-950 border border-emerald-500/30',
      secondary:
        'bg-slate-800/90 text-slate-100 hover:bg-slate-700 border border-slate-700/80 active:bg-slate-800',
      outline:
        'border border-slate-700 text-slate-200 hover:border-slate-500 hover:bg-slate-800/50 active:bg-slate-800',
      ghost: 'text-slate-300 hover:bg-slate-800/70 hover:text-white active:bg-slate-800',
      danger:
        'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 shadow-sm shadow-rose-950 border border-rose-500/30',
      subtle:
        'bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/50 active:bg-emerald-950 border border-emerald-800/50',
      sky: 'bg-sky-600 text-white hover:bg-sky-500 active:bg-sky-700 shadow-sm shadow-sky-950 border border-sky-500/30',
    };

    const sizes = {
      xs: 'h-7 px-2 text-xs gap-1.5 rounded-md',
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-4 text-xs font-medium gap-2',
      lg: 'h-11 px-6 text-sm font-medium gap-2.5',
      icon: 'h-9 w-9 p-0',
      'icon-sm': 'h-7 w-7 p-0 rounded-md',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-current" />
            {children && <span>{children}</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
