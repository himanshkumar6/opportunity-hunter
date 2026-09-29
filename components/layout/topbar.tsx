'use client';

import { Menu, Search } from 'lucide-react';
import { useUiStore } from '@/stores/ui-store';
import { Breadcrumbs } from './breadcrumbs';
import { NotificationsPopover } from './notifications-popover';
import { UserMenu } from './user-menu';

interface TopbarProps {
  userEmail?: string | null;
}

export function Topbar({ userEmail }: TopbarProps) {
  const { setMobileMenuOpen, setCommandPaletteOpen } = useUiStore();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/80 bg-[#080D19]/85 px-4 backdrop-blur-xl sm:px-6">
      {/* Left: Mobile hamburger menu toggle + Dynamic breadcrumbs */}
      <div className="flex items-center gap-3 overflow-hidden">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex-shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="overflow-hidden">
          <Breadcrumbs />
        </div>
      </div>

      {/* Right: Global Command Search Trigger + Notifications + User Menu */}
      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
        {/* Global Search Button */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          type="button"
          aria-label="Open command palette"
          className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#0C1220] px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200 focus:outline-none"
          title="Open command palette (⌘K / Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search commands...</span>
          <kbd className="hidden items-center rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline-flex">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Popover */}
        <NotificationsPopover />

        <div className="hidden h-5 w-px bg-slate-800 sm:block" />

        {/* User Menu Dropdown */}
        <UserMenu userEmail={userEmail} />
      </div>
    </header>
  );
}
