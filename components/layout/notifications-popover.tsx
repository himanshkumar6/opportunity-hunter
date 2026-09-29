'use client';

import * as React from 'react';
import { Bell, CheckCheck, Sparkles } from 'lucide-react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownLabel,
  DropdownSeparator,
} from '@/components/ui/dropdown';

export function NotificationsPopover() {
  const [hasUnread, setHasUnread] = React.useState(true);

  return (
    <Dropdown>
      <DropdownTrigger>
        <button
          type="button"
          aria-label="View notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-[#0B101E] text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
        >
          <Bell className="h-4 w-4" />
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 animate-pulse rounded-full bg-emerald-500 ring-2 ring-[#0B101E]" />
          )}
        </button>
      </DropdownTrigger>

      <DropdownContent align="right" className="w-80 overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#080D19] px-4 py-3">
          <DropdownLabel className="p-0 font-semibold text-white">Notifications</DropdownLabel>
          {hasUnread && (
            <button
              onClick={() => setHasUnread(false)}
              className="flex cursor-pointer items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>

        <div className="p-4">
          {hasUnread ? (
            <div className="space-y-2.5">
              <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3 text-xs">
                <div className="mb-1 flex items-center gap-1.5 font-semibold text-emerald-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Opportunity Hunter Engine Ready</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Automated scraping pipelines configured and ready for operator query execution.
                </p>
                <span className="mt-1 block font-mono text-[10px] text-slate-500">
                  System announcement
                </span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center">
              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-500">
                <Bell className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-slate-300">All caught up</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Search run completions and signal alerts will appear here.
              </p>
            </div>
          )}
        </div>

        <DropdownSeparator className="my-0" />
        <div className="bg-[#080D19] px-4 py-2 text-center font-mono text-[10px] text-slate-500">
          Real-time notification engine active
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
