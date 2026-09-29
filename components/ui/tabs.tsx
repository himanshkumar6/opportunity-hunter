'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

export function useTabs() {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('useTabs must be used within a Tabs component');
  return context;
}

export function Tabs({
  value: controlledValue,
  defaultValue,
  onValueChange,
  children,
  className,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || '');

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [isControlled, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-lg border border-slate-800/80 bg-[#0A0F1D] p-1 text-slate-400',
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
  disabled = false,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { value: activeValue, onValueChange } = useTabs();
  const isActive = activeValue === value;

  return (
    <button
      role="tab"
      type="button"
      disabled={disabled}
      aria-selected={isActive}
      onClick={() => onValueChange(value)}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap transition-all select-none',
        'focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-40',
        isActive
          ? 'bg-emerald-600 font-semibold text-white shadow-sm shadow-emerald-950'
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { value: activeValue } = useTabs();

  if (activeValue !== value) return null;

  return (
    <div role="tabpanel" className={cn('mt-4 focus-visible:outline-none', className)}>
      {children}
    </div>
  );
}
