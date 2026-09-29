'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Settings, LogOut, Command, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUiStore } from '@/stores/ui-store';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from '@/components/ui/dropdown';

interface UserMenuProps {
  userEmail?: string | null;
}

export function UserMenu({ userEmail }: UserMenuProps) {
  const router = useRouter();
  const { setCommandPaletteOpen } = useUiStore();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U';

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch {
      setIsSigningOut(false);
    }
  };

  return (
    <Dropdown>
      <DropdownTrigger>
        <div className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-slate-800/60 focus:outline-none">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-600 text-xs font-bold text-white shadow-sm shadow-emerald-950">
            {initial}
          </div>
          <div className="hidden text-left sm:block">
            <p className="max-w-[130px] truncate text-xs font-semibold text-slate-200">
              {userEmail ? userEmail.split('@')[0] : 'Operator'}
            </p>
            <p className="font-mono text-[10px] text-emerald-400">ACTIVE</p>
          </div>
        </div>
      </DropdownTrigger>

      <DropdownContent align="right" className="w-56">
        <DropdownLabel>
          <div className="flex flex-col">
            <span className="truncate font-medium text-white">
              {userEmail || 'operator@system.local'}
            </span>
            <span className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-emerald-400">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              Verified Operator
            </span>
          </div>
        </DropdownLabel>

        <DropdownSeparator />

        <DropdownItem
          icon={<Command className="h-3.5 w-3.5" />}
          onClick={() => setCommandPaletteOpen(true)}
        >
          <span className="flex w-full items-center justify-between">
            <span>Command Menu</span>
            <kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[9px] text-slate-400">
              ⌘K
            </kbd>
          </span>
        </DropdownItem>

        <DropdownItem
          icon={<Settings className="h-3.5 w-3.5" />}
          onClick={() => router.push('/settings')}
        >
          System Settings
        </DropdownItem>

        <DropdownSeparator />

        <DropdownItem
          destructive
          disabled={isSigningOut}
          icon={<LogOut className="h-3.5 w-3.5" />}
          onClick={handleSignOut}
        >
          {isSigningOut ? 'Signing out...' : 'Sign out'}
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
