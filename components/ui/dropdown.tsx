'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface DropdownContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownContext = React.createContext<DropdownContextType | undefined>(undefined);

export function Dropdown({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(DropdownContext);
  if (!context) throw new Error('DropdownTrigger must be used within a Dropdown');

  return (
    <div
      onClick={() => context.setOpen(!context.open)}
      className={cn('inline-flex cursor-pointer select-none', className)}
    >
      {children}
    </div>
  );
}

export function DropdownContent({
  children,
  className,
  align = 'right',
}: {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
}) {
  const context = React.useContext(DropdownContext);
  if (!context) throw new Error('DropdownContent must be used within a Dropdown');

  if (!context.open) return null;

  return (
    <div
      className={cn(
        'absolute z-50 mt-1.5 min-w-[12rem] rounded-xl border border-slate-800 bg-[#0C1220] p-1.5 text-xs text-slate-200 shadow-xl shadow-black/50',
        align === 'right' ? 'right-0' : 'left-0',
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  className,
  destructive = false,
  disabled = false,
  icon,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  destructive?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  const context = React.useContext(DropdownContext);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    onClick?.(e);
    context?.setOpen(false);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left font-medium transition-colors select-none',
        destructive
          ? 'text-rose-400 hover:bg-rose-950/40 hover:text-rose-200'
          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white',
        disabled && 'pointer-events-none opacity-40',
        className
      )}
    >
      {icon && <span className="flex-shrink-0 text-current">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
}

export function DropdownLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'px-2.5 py-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase select-none',
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownSeparator({ className }: { className?: string }) {
  return <div className={cn('-mx-1.5 my-1.5 h-px bg-slate-800', className)} />;
}
