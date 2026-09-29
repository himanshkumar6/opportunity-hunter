'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  LayoutDashboard,
  Briefcase,
  Target,
  Sparkles,
  Building2,
  Users,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
  Send,
  CalendarClock,
  Kanban,
} from 'lucide-react';
import { useUiStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { UserMenu } from './user-menu';

interface SidebarProps {
  userEmail?: string | null;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'emerald' | 'sky';
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Core Engines',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      {
        name: 'Job Hunt AI',
        href: '/jobs',
        icon: Briefcase,
        badge: 'AI',
        badgeVariant: 'sky',
      },
      {
        name: 'Lead Hunt AI',
        href: '/leads',
        icon: Target,
        badge: 'AI',
        badgeVariant: 'emerald',
      },
      { name: 'Opportunities', href: '/opportunities', icon: Sparkles },
      { name: 'CRM & Pipeline', href: '/crm', icon: Kanban },
      { name: 'Outreach & Approvals', href: '/outreach', icon: Send },
      { name: 'Follow-ups & Activity', href: '/follow-ups', icon: CalendarClock },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { name: 'Companies', href: '/companies', icon: Building2 },
      { name: 'Contacts', href: '/contacts', icon: Users },
      { name: 'Search Runs', href: '/search-runs', icon: History },
    ],
  },
  {
    label: 'System',
    items: [{ name: 'Settings', href: '/settings', icon: Settings }],
  },
];

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useUiStore();

  // Close mobile drawer when navigating
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-slate-800/80 bg-[#070B14] text-slate-300 select-none">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 overflow-hidden focus:outline-none"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-600 font-bold text-white shadow-md shadow-emerald-950">
            <Compass className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col truncate">
              <span className="truncate text-sm font-bold tracking-tight text-white">
                Opportunity Hunter
              </span>
              <span className="flex items-center gap-1 font-mono text-[9px] tracking-wider text-emerald-400 uppercase">
                <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-400" />
                INTELLIGENCE ENGINE
              </span>
            </div>
          )}
        </Link>

        {/* Desktop collapse toggle */}
        <button
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:flex"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Main Navigation Groups */}
      <nav className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!sidebarCollapsed && (
              <h4 className="px-2 pb-1 font-mono text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                {group.label}
              </h4>
            )}
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium transition-all',
                    isActive
                      ? 'border-l-2 border-emerald-400 bg-emerald-950/40 font-semibold text-emerald-300 shadow-sm shadow-emerald-950/20'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200',
                    sidebarCollapsed && 'justify-center px-1'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 flex-shrink-0 transition-colors',
                      isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                    )}
                  />
                  {!sidebarCollapsed && (
                    <div className="flex flex-1 items-center justify-between truncate">
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            'py-0.2 rounded px-1.5 font-mono text-[9px] font-bold uppercase',
                            item.badgeVariant === 'sky'
                              ? 'border border-sky-800/60 bg-sky-950 text-sky-400'
                              : 'border border-emerald-800/60 bg-emerald-950 text-emerald-400'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Navigation & User Card */}
      <div className="border-t border-slate-800/80 p-3">
        {sidebarCollapsed ? (
          <div className="flex justify-center">
            <UserMenu userEmail={userEmail} />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <UserMenu userEmail={userEmail} />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden transition-all duration-200 ease-in-out md:block',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 shadow-2xl transition-transform duration-200 ease-in-out md:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
