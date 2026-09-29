'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
  EmptyState,
} from '@/components/ui';
import type { FollowUpWithRelations } from '@/types/follow-ups';
import { EditFollowUpModal } from './edit-follow-up-modal';

interface FollowUpTableProps {
  followUps: FollowUpWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onRefresh?: () => void;
  onOpenCreate?: () => void;
}

export function FollowUpTable({
  followUps,
  total,
  page,
  pageSize,
  totalPages,
  onRefresh,
  onOpenCreate,
}: FollowUpTableProps) {
  const router = useRouter();

  const [completingId, setCompletingId] = React.useState<string | null>(null);
  const [editingItem, setEditingItem] = React.useState<FollowUpWithRelations | null>(null);

  const handleQuickComplete = async (id: string, note?: string) => {
    try {
      setCompletingId(id);
      const res = await fetch(`/api/follow-ups/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note || '' }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to complete follow-up');
        return;
      }

      onRefresh?.();
      router.refresh();
    } catch {
      alert('Error marking follow-up as complete');
    } finally {
      setCompletingId(null);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="rose">URGENT</Badge>;
      case 'high':
        return <Badge variant="amber">HIGH</Badge>;
      case 'medium':
        return <Badge variant="sky">MEDIUM</Badge>;
      case 'low':
      default:
        return <Badge variant="slate">LOW</Badge>;
    }
  };

  const getStatusBadge = (item: FollowUpWithRelations) => {
    if (item.status === 'completed') {
      return (
        <Badge variant="emerald" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </Badge>
      );
    }
    if (item.status === 'cancelled') {
      return <Badge variant="slate">Cancelled</Badge>;
    }
    if (item.is_overdue) {
      return (
        <Badge variant="rose" className="animate-pulse gap-1">
          <AlertTriangle className="h-3 w-3" />
          Overdue
        </Badge>
      );
    }
    if (item.is_due_today) {
      return (
        <Badge variant="amber" className="gap-1">
          <Clock className="h-3 w-3" />
          Due Today
        </Badge>
      );
    }
    return (
      <Badge variant="sky" className="gap-1">
        <Calendar className="h-3 w-3" />
        Scheduled
      </Badge>
    );
  };

  const formatDueDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  if (followUps.length === 0) {
    return (
      <div
        className="rounded-xl border border-slate-800 bg-[#0C1220] p-8 text-center"
        data-testid="follow-ups-empty-state"
      >
        <EmptyState
          icon={<CalendarClock className="h-6 w-6 text-sky-400" />}
          title="No follow-ups found"
          description="There are no follow-ups matching your current search or filter criteria."
          action={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/follow-ups')}
                data-testid="empty-reset-filters-btn"
              >
                Clear Filters
              </Button>
              {onOpenCreate && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onOpenCreate}
                  data-testid="empty-schedule-follow-up-btn"
                >
                  Schedule Follow-up
                </Button>
              )}
            </div>
          }
        />
      </div>
    );
  }

  return (
    <>
      {/* Edit / Reschedule Modal */}
      <EditFollowUpModal
        open={Boolean(editingItem)}
        onOpenChange={(open) => !open && setEditingItem(null)}
        followUp={editingItem}
        onSuccess={() => {
          setEditingItem(null);
          onRefresh?.();
          router.refresh();
        }}
      />

      <div
        className="overflow-hidden rounded-xl border border-slate-800 bg-[#0C1220]"
        data-testid="follow-up-table-container"
      >
        {/* Desktop Table View */}
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader className="bg-slate-900/60">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="w-10"></TableHead>
                <TableHead className="font-mono text-[10px] text-slate-400 uppercase">
                  Opportunity & Target
                </TableHead>
                <TableHead className="font-mono text-[10px] text-slate-400 uppercase">
                  Action & Note
                </TableHead>
                <TableHead className="font-mono text-[10px] text-slate-400 uppercase">
                  Contact
                </TableHead>
                <TableHead className="font-mono text-[10px] text-slate-400 uppercase">
                  Due Time
                </TableHead>
                <TableHead className="font-mono text-[10px] text-slate-400 uppercase">
                  Priority
                </TableHead>
                <TableHead className="font-mono text-[10px] text-slate-400 uppercase">
                  Status
                </TableHead>
                <TableHead className="text-right font-mono text-[10px] text-slate-400 uppercase">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {followUps.map((item) => {
                const companyName = item.opportunity?.company?.name || 'Company Profile';
                const oppTitle = item.opportunity?.title || 'Target Opportunity';
                const isCompleted = item.status === 'completed';

                return (
                  <TableRow
                    key={item.id}
                    className={`border-slate-800/80 transition-colors ${
                      item.is_overdue
                        ? 'bg-rose-950/10 hover:bg-rose-950/20'
                        : item.is_due_today
                          ? 'bg-amber-950/10 hover:bg-amber-950/20'
                          : 'hover:bg-slate-800/40'
                    }`}
                    data-testid={`follow-up-row-${item.id}`}
                  >
                    {/* Checkbox / Quick Complete */}
                    <TableCell className="w-10 text-center">
                      {!isCompleted ? (
                        <button
                          type="button"
                          onClick={() => handleQuickComplete(item.id)}
                          disabled={completingId === item.id}
                          className="flex h-6 w-6 items-center justify-center rounded border border-slate-700 text-slate-500 transition-colors hover:border-emerald-500 hover:text-emerald-400"
                          title="Mark complete"
                          data-testid={`quick-complete-btn-${item.id}`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center text-emerald-500">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                    </TableCell>

                    {/* Opportunity & Target */}
                    <TableCell className="max-w-[220px]">
                      <div className="min-w-0">
                        <Link
                          href={`/opportunities/${item.opportunity_id}`}
                          className="flex items-center gap-1 truncate text-xs font-medium text-white hover:text-sky-400 hover:underline"
                          title={companyName}
                        >
                          <Building2 className="h-3 w-3 flex-shrink-0 text-slate-400" />
                          <span className="truncate">{companyName}</span>
                        </Link>
                        <p
                          className="mt-0.5 truncate font-mono text-[10px] text-slate-400"
                          title={oppTitle}
                        >
                          {oppTitle}
                        </p>
                      </div>
                    </TableCell>

                    {/* Action & Note */}
                    <TableCell className="max-w-[260px]">
                      <div className="min-w-0">
                        <p
                          className={`truncate text-xs font-medium ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-100'}`}
                          title={item.action}
                        >
                          {item.action}
                        </p>
                        {item.note && (
                          <p
                            className="mt-0.5 line-clamp-1 text-[11px] text-slate-400 italic"
                            title={item.note}
                          >
                            &ldquo;{item.note}&rdquo;
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Contact */}
                    <TableCell className="max-w-[160px]">
                      {item.contact ? (
                        <div className="min-w-0">
                          <p className="flex items-center gap-1 truncate text-xs text-slate-200">
                            <User className="h-3 w-3 flex-shrink-0 text-slate-400" />
                            <span className="truncate">{item.contact.name}</span>
                          </p>
                          <p className="truncate font-mono text-[10px] text-slate-500">
                            {item.contact.email || item.contact.phone || 'No direct phone'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">No contact</span>
                      )}
                    </TableCell>

                    {/* Due Time */}
                    <TableCell className="whitespace-nowrap">
                      <p
                        className={`font-mono text-xs font-medium ${item.is_overdue ? 'font-bold text-rose-400' : item.is_due_today ? 'text-amber-400' : 'text-slate-300'}`}
                      >
                        {formatDueDate(item.due_at)}
                      </p>
                    </TableCell>

                    {/* Priority */}
                    <TableCell className="whitespace-nowrap">
                      {getPriorityBadge(item.priority)}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="whitespace-nowrap">{getStatusBadge(item)}</TableCell>

                    {/* Actions */}
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isCompleted && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingItem(item)}
                            className="h-7 px-2 text-[11px]"
                            data-testid={`reschedule-btn-${item.id}`}
                          >
                            Reschedule
                          </Button>
                        )}
                        <Link href={`/follow-ups/${item.id}`}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 border-slate-700 px-2 text-[11px] text-slate-300 hover:text-white"
                            data-testid={`view-follow-up-btn-${item.id}`}
                          >
                            Details
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card List View */}
        <div className="block divide-y divide-slate-800 md:hidden">
          {followUps.map((item) => {
            const companyName = item.opportunity?.company?.name || 'Company Profile';
            const oppTitle = item.opportunity?.title || 'Target Opportunity';
            const isCompleted = item.status === 'completed';

            return (
              <div
                key={item.id}
                className={`space-y-3 p-4 ${
                  item.is_overdue ? 'bg-rose-950/10' : item.is_due_today ? 'bg-amber-950/10' : ''
                }`}
                data-testid={`follow-up-card-${item.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/opportunities/${item.opportunity_id}`}
                      className="flex items-center gap-1 truncate text-xs font-semibold text-white hover:underline"
                    >
                      <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                      <span className="truncate">{companyName}</span>
                    </Link>
                    <p className="truncate text-[11px] text-slate-400">{oppTitle}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    {getStatusBadge(item)}
                    {getPriorityBadge(item.priority)}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-2.5">
                  <p
                    className={`text-xs font-medium ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-100'}`}
                  >
                    {item.action}
                  </p>
                  {item.note && (
                    <p className="mt-1 text-[11px] text-slate-400 italic">
                      &ldquo;{item.note}&rdquo;
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Due: {formatDueDate(item.due_at)}
                    </span>
                    {item.contact && (
                      <span className="flex max-w-[140px] items-center gap-1 truncate">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{item.contact.name}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {!isCompleted ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickComplete(item.id)}
                      disabled={completingId === item.id}
                      leftIcon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                      className="h-8 flex-1 text-xs"
                      data-testid={`mobile-complete-btn-${item.id}`}
                    >
                      Complete
                    </Button>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                    </span>
                  )}

                  {!isCompleted && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingItem(item)}
                      className="h-8 text-xs"
                      data-testid={`mobile-reschedule-btn-${item.id}`}
                    >
                      Reschedule
                    </Button>
                  )}

                  <Link href={`/follow-ups/${item.id}`} className="flex-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 w-full text-xs"
                      data-testid={`mobile-details-btn-${item.id}`}
                    >
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800 p-4">
            <p className="font-mono text-xs text-slate-400">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}{' '}
              follow-ups
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('page', String(page - 1));
                  router.push(url.pathname + url.search);
                }}
                leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('page', String(page + 1));
                  router.push(url.pathname + url.search);
                }}
                rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
