'use client';

import * as React from 'react';
import {
  Sparkles,
  Mail,
  CheckCircle2,
  CalendarClock,
  Clock,
  RotateCcw,
  MessageSquare,
  Plus,
  AlertCircle,
  Flag,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import type { Activity, ActivityType } from '@/types/follow-ups';

interface ActivityTimelineProps {
  opportunityId: string;
  initialActivities?: Activity[];
}

export function ActivityTimeline({ opportunityId, initialActivities }: ActivityTimelineProps) {
  const [activities, setActivities] = React.useState<Activity[]>(
    Array.isArray(initialActivities) ? initialActivities : []
  );
  const [isLoading, setIsLoading] = React.useState(!initialActivities);
  const [newNote, setNewNote] = React.useState('');
  const [isSubmittingNote, setIsSubmittingNote] = React.useState(false);
  const [noteError, setNoteError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let ignore = false;
    if (!initialActivities) {
      fetch(`/api/opportunities/${opportunityId}/activities`)
        .then(async (res) => {
          if (!res.ok) throw new Error('Failed to load activities');
          return res.json();
        })
        .then((data) => {
          if (!ignore) {
            const list = Array.isArray(data)
              ? data
              : Array.isArray(data?.activities)
                ? data.activities
                : [];
            setActivities(list);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (!ignore) {
            setActivities([]);
            setIsLoading(false);
          }
        });
    }
    return () => {
      ignore = true;
    };
  }, [opportunityId, initialActivities]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setIsSubmittingNote(true);
      setNoteError(null);
      const res = await fetch(`/api/opportunities/${opportunityId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to log note');
      }

      const created = await res.json();
      const newActivity = created?.activity || (created?.id ? created : null);
      if (newActivity) {
        setActivities((prev) => [newActivity, ...(Array.isArray(prev) ? prev : [])]);
      }
      setNewNote('');
    } catch (err: unknown) {
      setNoteError(err instanceof Error ? err.message : 'Error logging note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'opportunity_created':
        return {
          icon: Sparkles,
          bg: 'bg-emerald-950/80 border-emerald-800/60 text-emerald-400',
        };
      case 'outreach_draft_created':
        return {
          icon: Mail,
          bg: 'bg-sky-950/80 border-sky-800/60 text-sky-400',
        };
      case 'outreach_approved':
        return {
          icon: CheckCircle2,
          bg: 'bg-emerald-950/80 border-emerald-800/60 text-emerald-400',
        };
      case 'follow_up_created':
        return {
          icon: CalendarClock,
          bg: 'bg-indigo-950/80 border-indigo-800/60 text-indigo-400',
        };
      case 'follow_up_rescheduled':
        return {
          icon: RotateCcw,
          bg: 'bg-amber-950/80 border-amber-800/60 text-amber-400',
        };
      case 'follow_up_completed':
        return {
          icon: CheckCircle2,
          bg: 'bg-emerald-950/80 border-emerald-800/60 text-emerald-400',
        };
      case 'status_changed':
        return {
          icon: Flag,
          bg: 'bg-purple-950/80 border-purple-800/60 text-purple-400',
        };
      case 'note_added':
      default:
        return {
          icon: MessageSquare,
          bg: 'bg-slate-900 border-slate-700 text-slate-300',
        };
    }
  };

  const formatActivityTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <Card className="border-slate-800 bg-[#0C1220]" data-testid="activity-timeline-card">
      <CardHeader className="border-b border-slate-800/80 p-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-white">
          <Clock className="h-4 w-4 text-sky-400" />
          Engagement & Activity History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {/* Quick Add Note Form */}
        <form
          onSubmit={handleAddNote}
          className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/40 p-3"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
            <span>Log Operator Note / Interaction</span>
          </div>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Record phone call notes, customer response, WhatsApp feedback, or meeting summary..."
            rows={2}
            className="w-full rounded-md border border-slate-800 bg-slate-900 p-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            data-testid="add-note-textarea"
          />
          {noteError && (
            <p className="flex items-center gap-1 text-[11px] text-rose-400">
              <AlertCircle className="h-3 w-3" /> {noteError}
            </p>
          )}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingNote || !newNote.trim()}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              className="h-7 text-xs"
              data-testid="submit-note-btn"
            >
              {isSubmittingNote ? 'Saving...' : 'Add Note'}
            </Button>
          </div>
        </form>

        {/* Timeline Events */}
        {isLoading ? (
          <div className="py-6 text-center text-xs text-slate-500">
            Loading activity timeline...
          </div>
        ) : !Array.isArray(activities) || activities.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 italic">
            No activity recorded yet.
          </div>
        ) : (
          <div
            className="relative space-y-6 pl-6 before:absolute before:top-2 before:bottom-2 before:left-2.5 before:w-0.5 before:bg-slate-800"
            data-testid="timeline-items"
          >
            {activities.map((item) => {
              const { icon: Icon, bg } = getActivityIcon(item.type);
              return (
                <div
                  key={item.id}
                  className="group relative"
                  data-testid={`activity-item-${item.id}`}
                >
                  {/* Icon node */}
                  <div
                    className={`absolute top-0.5 -left-6 flex h-5 w-5 items-center justify-center rounded-full border ${bg}`}
                  >
                    <Icon className="h-2.5 w-2.5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-1">
                      <p className="text-xs font-semibold text-slate-200">{item.title}</p>
                      <time className="font-mono text-[10px] text-slate-400">
                        {formatActivityTime(item.created_at)}
                      </time>
                    </div>
                    {item.description && (
                      <p className="mt-1 text-xs leading-relaxed whitespace-pre-line text-slate-400">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
