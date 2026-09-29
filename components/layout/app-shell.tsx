'use client';

import * as React from 'react';
import { useUiStore } from '@/stores/ui-store';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { CommandPalette } from './command-palette';
import { cn } from '@/lib/utils';

interface AppShellProps {
  userEmail?: string | null;
  children: React.ReactNode;
}

export function AppShell({ userEmail, children }: AppShellProps) {
  const { sidebarCollapsed } = useUiStore();

  return (
    <div className="flex min-h-screen flex-col bg-[#060911] text-slate-100">
      {/* Global Command Palette */}
      <CommandPalette />

      {/* Navigation Sidebar */}
      <Sidebar userEmail={userEmail} />

      {/* Main Content Area */}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-all duration-200 ease-in-out',
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        )}
      >
        <Topbar userEmail={userEmail} />

        <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
