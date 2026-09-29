'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { Input, Select, Button } from '@/components/ui';

interface OutreachFiltersProps {
  initialStatus?: string;
  initialChannel?: string;
  initialSearch?: string;
}

export function OutreachFilters({
  initialStatus = 'all',
  initialChannel = 'all',
  initialSearch = '',
}: OutreachFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(initialSearch);
  const [status, setStatus] = React.useState(initialStatus);
  const [channel, setChannel] = React.useState(initialChannel);

  const applyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (search.trim()) params.set('search', search.trim());
    else params.delete('search');

    if (status && status !== 'all') params.set('status', status);
    else params.delete('status');

    if (channel && channel !== 'all') params.set('channel', channel);
    else params.delete('channel');

    params.set('page', '1');

    router.push(`${pathname}?${params.toString()}`);
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setChannel('all');
    router.push(pathname);
  };

  return (
    <form
      onSubmit={applyFilters}
      className="space-y-3 rounded-xl border border-slate-800 bg-[#0C1220] p-4"
      data-testid="outreach-filters-form"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Search Input */}
        <Input
          placeholder="Search by subject or content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-3.5 w-3.5" />}
          data-testid="outreach-search-input"
        />

        {/* Status Select */}
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          data-testid="outreach-status-select"
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'draft', label: 'Draft (Pending Review)' },
            { value: 'approved', label: 'Approved (Ready)' },
            { value: 'sent', label: 'Sent' },
            { value: 'replied', label: 'Replied' },
            { value: 'failed', label: 'Failed' },
          ]}
        />

        {/* Channel Select */}
        <Select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          data-testid="outreach-channel-select"
          options={[
            { value: 'all', label: 'All Channels' },
            { value: 'email', label: 'Email Outreach' },
            { value: 'whatsapp', label: 'WhatsApp Outreach' },
          ]}
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={resetFilters}
          leftIcon={<RotateCcw className="h-3 w-3" />}
          data-testid="outreach-reset-filters-btn"
        >
          Reset Filters
        </Button>

        <Button
          type="submit"
          variant="primary"
          size="xs"
          leftIcon={<Filter className="h-3 w-3" />}
          data-testid="outreach-apply-filters-btn"
        >
          Apply Filters
        </Button>
      </div>
    </form>
  );
}
