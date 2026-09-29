'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Briefcase,
  Target,
  Sparkles,
  Building2,
  Users,
  History,
  Settings,
  X,
  ArrowRight,
  Send,
  CalendarClock,
  Kanban,
} from 'lucide-react';
import { useUiStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Navigation' | 'Actions';
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  action?: () => void;
  keywords?: string[];
}

const commandItems: CommandItem[] = [
  {
    id: 'nav-dashboard',
    title: 'Dashboard Overview',
    subtitle: 'View pipeline metrics and active discovery telemetry',
    category: 'Navigation',
    icon: LayoutDashboard,
    href: '/dashboard',
    keywords: ['home', 'metrics', 'pipeline', 'stats'],
  },
  {
    id: 'nav-jobs',
    title: 'Job Hunt AI',
    subtitle: 'Explore active tech, design, and engineering job opportunities',
    category: 'Navigation',
    icon: Briefcase,
    href: '/jobs',
    keywords: ['jobs', 'careers', 'hiring', 'positions'],
  },
  {
    id: 'nav-leads',
    title: 'Lead Hunt AI',
    subtitle: 'Explore high-value B2B prospect companies and signals',
    category: 'Navigation',
    icon: Target,
    href: '/leads',
    keywords: ['leads', 'b2b', 'prospects', 'sales', 'deals'],
  },
  {
    id: 'nav-opportunities',
    title: 'All Opportunities',
    subtitle: 'Unified pipeline of discovered jobs and prospect leads',
    category: 'Navigation',
    icon: Sparkles,
    href: '/opportunities',
    keywords: ['all', 'pipeline', 'opportunities', 'unification'],
  },
  {
    id: 'nav-crm',
    title: 'CRM & Pipeline',
    subtitle: 'Manage lead lifecycle stages, Kanban pipeline, and deals',
    category: 'Navigation',
    icon: Kanban,
    href: '/crm',
    keywords: ['crm', 'pipeline', 'kanban', 'stages', 'deals', 'funnel', 'lifecycle'],
  },
  {
    id: 'nav-companies',
    title: 'Companies Directory',
    subtitle: 'Browse all indexed target companies and hiring organizations',
    category: 'Navigation',
    icon: Building2,
    href: '/companies',
    keywords: ['accounts', 'employers', 'businesses', 'organizations'],
  },
  {
    id: 'nav-contacts',
    title: 'Decision-Maker Contacts',
    subtitle: 'Verified recruitment and executive contact directory',
    category: 'Navigation',
    icon: Users,
    href: '/contacts',
    keywords: ['emails', 'people', 'executives', 'founders', 'recruiters'],
  },
  {
    id: 'nav-search-runs',
    title: 'Search Runs & Audit Trail',
    subtitle: 'Review automation execution logs and raw results',
    category: 'Navigation',
    icon: History,
    href: '/search-runs',
    keywords: ['runs', 'logs', 'audit', 'automation', 'n8n'],
  },
  {
    id: 'nav-outreach',
    title: 'Outreach & Approvals',
    subtitle: 'Review, draft, and approve verified outreach messages',
    category: 'Navigation',
    icon: Send,
    href: '/outreach',
    keywords: ['outreach', 'email', 'whatsapp', 'approval', 'drafts', 'send'],
  },
  {
    id: 'nav-follow-ups',
    title: 'Follow-ups & Activity',
    subtitle: 'Track scheduled follow-ups, overdue actions, and engagement history',
    category: 'Navigation',
    icon: CalendarClock,
    href: '/follow-ups',
    keywords: ['followups', 'reminders', 'activity', 'overdue', 'schedule', 'tasks'],
  },
  {
    id: 'nav-settings',
    title: 'Settings & Integrations',
    subtitle: 'Manage API keys, automation endpoints, and account',
    category: 'Navigation',
    icon: Settings,
    href: '/settings',
    keywords: ['config', 'keys', 'profile', 'n8n webhook'],
  },
  {
    id: 'act-new-job',
    title: 'Launch Job Hunt Search',
    subtitle: 'Trigger automated multi-source job scraper',
    category: 'Actions',
    icon: Briefcase,
    href: '/jobs',
    keywords: ['new', 'start', 'trigger', 'run job search'],
  },
  {
    id: 'act-new-lead',
    title: 'Launch Lead Hunt Search',
    subtitle: 'Trigger automated multi-source lead scraper',
    category: 'Actions',
    icon: Target,
    href: '/leads',
    keywords: ['new', 'start', 'trigger', 'run lead search'],
  },
];

function CommandPaletteModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return commandItems;
    const lower = query.toLowerCase().trim();
    return commandItems.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(lower);
      const matchSub = item.subtitle?.toLowerCase().includes(lower);
      const matchKey = item.keywords?.some((k) => k.includes(lower));
      return matchTitle || matchSub || matchKey;
    });
  }, [query]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const executeItem = (item: CommandItem) => {
    onClose();
    if (item.href) {
      router.push(item.href);
    } else if (item.action) {
      item.action();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        executeItem(selected);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-50 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0B101E] text-slate-200 shadow-2xl shadow-black/80">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-slate-800 px-4 py-3">
          <Search className="mr-3 h-5 w-5 flex-shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a command or search destination..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="rounded p-1 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="ml-2 hidden items-center gap-1 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline-flex">
            ESC
          </kbd>
        </div>

        {/* Command Items List */}
        <div className="max-h-80 space-y-1 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching commands or routes found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-colors',
                    isSelected
                      ? 'border border-emerald-500/40 bg-emerald-600/20 text-white'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  )}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className={cn(
                        'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg',
                        isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="truncate text-left">
                      <p className="truncate font-medium text-white">{item.title}</p>
                      {item.subtitle && (
                        <p className="truncate text-[11px] text-slate-400">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="ml-3 flex flex-shrink-0 items-center gap-2">
                    <span className="font-mono text-[10px] tracking-wider text-slate-500 uppercase">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-slate-800/80 bg-[#080D19] px-4 py-2.5 font-mono text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-slate-300">
                ↑↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-slate-300">
                ↵
              </kbd>{' '}
              Select
            </span>
          </div>
          <span>Opportunity Hunter Command Suite</span>
        </div>
      </div>
    </div>
  );
}

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUiStore();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  return <CommandPaletteModal onClose={() => setCommandPaletteOpen(false)} />;
}
