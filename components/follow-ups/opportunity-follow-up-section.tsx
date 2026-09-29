'use client';

import * as React from 'react';
import { CalendarClock, Plus, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from '@/components/ui';
import type { FollowUpWithRelations } from '@/types/follow-ups';
import { CreateFollowUpModal } from './create-follow-up-modal';
import { EditFollowUpModal } from './edit-follow-up-modal';
import { ActivityTimeline } from './activity-timeline';

interface OpportunityFollowUpSectionProps {
  opportunityId: string;
  opportunityTitle?: string;
  contactId?: string | null;
}

export function OpportunityFollowUpSection({
  opportunityId,
  opportunityTitle,
  contactId,
}: OpportunityFollowUpSectionProps) {
  const [followUps, setFollowUps] = React.useState<FollowUpWithRelations[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<FollowUpWithRelations | null>(null);

  const fetchFollowUps = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/follow-ups?opportunity_id=${opportunityId}`);
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json?.items)
          ? json.items
          : Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json)
              ? json
              : [];
        setFollowUps(items);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [opportunityId]);

  React.useEffect(() => {
    let ignore = false;
    fetch(`/api/follow-ups?opportunity_id=${opportunityId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch follow-ups');
        return res.json();
      })
      .then((json) => {
        if (!ignore) {
          const items = Array.isArray(json?.items)
            ? json.items
            : Array.isArray(json?.data)
              ? json.data
              : Array.isArray(json)
                ? json
                : [];
          setFollowUps(items);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setFollowUps([]);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [opportunityId]);

  const handleQuickComplete = async (id: string) => {
    try {
      const res = await fetch(`/api/follow-ups/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'Completed from opportunity dashboard' }),
      });
      if (res.ok) {
        fetchFollowUps();
      }
    } catch {
      // Fallback
    }
  };

  const safeFollowUps = Array.isArray(followUps) ? followUps : [];
  const activeFollowUps = safeFollowUps.filter((f) => f.status === 'scheduled');
  const overdueCount = activeFollowUps.filter((f) => f.is_overdue).length;

  return (
    <div className="space-y-6" data-testid="opportunity-follow-up-section">
      <CreateFollowUpModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        initialOpportunityId={opportunityId}
        initialContactId={contactId}
        initialAction={opportunityTitle ? `Follow up on: ${opportunityTitle}` : undefined}
        onSuccess={() => {
          fetchFollowUps();
        }}
      />

      <EditFollowUpModal
        open={Boolean(editingItem)}
        onOpenChange={(open) => !open && setEditingItem(null)}
        followUp={editingItem}
        onSuccess={() => {
          setEditingItem(null);
          fetchFollowUps();
        }}
      />

      {/* Follow-ups card */}
      <Card className="border-slate-800 bg-[#0C1220]">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-white">
              <CalendarClock className="h-4 w-4 text-sky-400" />
              Follow-ups & Next Actions
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Operator-managed reminders and outreach checkpoints (zero auto-send).
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            className="h-8 text-xs"
            data-testid="opp-schedule-follow-up-btn"
          >
            Schedule Action
          </Button>
        </CardHeader>

        <CardContent className="space-y-3 p-4">
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 p-2.5 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                <strong>{overdueCount} overdue follow-up action(s)</strong> require immediate
                operator attention.
              </span>
            </div>
          )}

          {isLoading ? (
            <p className="py-3 text-center text-xs text-slate-500">Loading follow-ups...</p>
          ) : safeFollowUps.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-800 p-6 text-center">
              <CalendarClock className="mx-auto mb-2 h-8 w-8 text-slate-600" />
              <p className="text-xs font-medium text-slate-300">No follow-ups scheduled yet</p>
              <p className="mx-auto mt-1 max-w-sm text-[11px] text-slate-500">
                Schedule a manual check-in, phone call, or message reminder to keep this pipeline
                lead warm.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="mt-3 text-xs"
              >
                Schedule First Follow-up
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {safeFollowUps.map((item) => {
                const isCompleted = item.status === 'completed';
                const formattedDate = new Date(item.due_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={item.id}
                    className={`flex flex-col justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center ${
                      item.is_overdue ? 'text-rose-200' : ''
                    }`}
                    data-testid={`opp-follow-up-row-${item.id}`}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      {!isCompleted ? (
                        <button
                          type="button"
                          onClick={() => handleQuickComplete(item.id)}
                          className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border border-slate-700 text-slate-500 transition-colors hover:border-emerald-500 hover:text-emerald-400"
                          title="Mark complete"
                          data-testid={`opp-quick-complete-${item.id}`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={`truncate text-xs font-medium ${
                              isCompleted ? 'text-slate-400 line-through' : 'text-slate-100'
                            }`}
                          >
                            {item.action}
                          </p>
                          {item.priority === 'urgent' && <Badge variant="rose">URGENT</Badge>}
                          {item.priority === 'high' && <Badge variant="amber">HIGH</Badge>}
                          {item.is_overdue && (
                            <Badge variant="rose" className="animate-pulse gap-1">
                              <AlertTriangle className="h-2.5 w-2.5" /> Overdue
                            </Badge>
                          )}
                          {item.is_due_today && (
                            <Badge variant="amber" className="gap-1">
                              <Clock className="h-2.5 w-2.5" /> Due Today
                            </Badge>
                          )}
                          {isCompleted && <Badge variant="emerald">Completed</Badge>}
                        </div>

                        {item.note && (
                          <p className="mt-0.5 text-[11px] text-slate-400 italic">
                            &ldquo;{item.note}&rdquo;
                          </p>
                        )}

                        <p className="mt-1 flex items-center gap-1 font-mono text-[10px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>Due: {formattedDate}</span>
                        </p>
                      </div>
                    </div>

                    {!isCompleted && (
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingItem(item)}
                          className="h-7 text-xs text-slate-400 hover:text-white"
                          data-testid={`opp-reschedule-${item.id}`}
                        >
                          Reschedule
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Timeline Card */}
      <ActivityTimeline opportunityId={opportunityId} />
    </div>
  );
}
