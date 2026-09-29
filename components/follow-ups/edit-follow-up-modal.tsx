'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Select,
} from '@/components/ui';
import type {
  FollowUpWithRelations,
  FollowUpPriority,
  FollowUpStatus,
  FollowUpUpdateInput,
} from '@/types/follow-ups';

interface EditFollowUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  followUp: FollowUpWithRelations | null;
  onSuccess?: () => void;
}

function formatIsoForInput(iso: string) {
  try {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

interface EditFormProps {
  followUp: FollowUpWithRelations;
  onCancel: () => void;
  onSuccess?: () => void;
}

function EditFollowUpForm({ followUp, onCancel, onSuccess }: EditFormProps) {
  const router = useRouter();

  const [action, setAction] = React.useState<string>(followUp.action || '');
  const [priority, setPriority] = React.useState<FollowUpPriority>(followUp.priority || 'medium');
  const [status, setStatus] = React.useState<FollowUpStatus>(followUp.status || 'scheduled');
  const [note, setNote] = React.useState<string>(followUp.note || '');
  const [dueAt, setDueAt] = React.useState<string>(formatIsoForInput(followUp.due_at));
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const setPresetTime = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(10, 0, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    setDueAt(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!action.trim()) {
      setError('Please provide a follow-up action description.');
      return;
    }
    if (!dueAt || isNaN(new Date(dueAt).getTime())) {
      setError('Please choose a valid follow-up date and time.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: FollowUpUpdateInput = {
        action: action.trim(),
        note: note.trim(),
        due_at: new Date(dueAt).toISOString(),
        priority,
        status,
      };

      const res = await fetch(`/api/follow-ups/${followUp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update follow-up');
      }

      onSuccess?.();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating follow-up');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      {error && (
        <div
          className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300"
          data-testid="edit-follow-up-error"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Follow-up Action <span className="text-rose-400">*</span>
        </label>
        <Input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="text-xs"
          data-testid="edit-follow-up-action-input"
        />
      </div>

      {/* Date & Presets */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Due Date & Time <span className="text-rose-400">*</span>
        </label>
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
          data-testid="edit-follow-up-due-at-input"
        />
        {/* Quick presets */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setPresetTime(1)}
            className="rounded border border-slate-800 bg-slate-900/80 px-2 py-1 text-[10px] text-slate-300 hover:border-slate-700 hover:text-white"
          >
            +1 Day (Tomorrow)
          </button>
          <button
            type="button"
            onClick={() => setPresetTime(3)}
            className="rounded border border-slate-800 bg-slate-900/80 px-2 py-1 text-[10px] text-slate-300 hover:border-slate-700 hover:text-white"
          >
            +3 Days
          </button>
          <button
            type="button"
            onClick={() => setPresetTime(7)}
            className="rounded border border-slate-800 bg-slate-900/80 px-2 py-1 text-[10px] text-slate-300 hover:border-slate-700 hover:text-white"
          >
            +1 Week
          </button>
        </div>
      </div>

      {/* Priority & Status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Priority</label>
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value as FollowUpPriority)}
            options={[
              { value: 'urgent', label: 'Urgent' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
            className="text-xs"
            data-testid="edit-follow-up-priority-select"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Status</label>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as FollowUpStatus)}
            options={[
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            className="text-xs"
            data-testid="edit-follow-up-status-select"
          />
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Internal Context / Notes
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          data-testid="edit-follow-up-note-input"
        />
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isSubmitting}
          data-testid="submit-edit-follow-up-btn"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EditFollowUpModal({
  open,
  onOpenChange,
  followUp,
  onSuccess,
}: EditFollowUpModalProps) {
  if (!followUp) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-slate-800 bg-[#0C1220] p-6 text-white">
        <DialogHeader>
          <div className="flex items-center gap-2 text-sky-400">
            <CalendarClock className="h-5 w-5" />
            <DialogTitle className="text-lg font-bold text-white">
              Edit & Reschedule Follow-up
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-400">
            Modify scheduled date, priority, or details for{' '}
            {followUp.opportunity?.company?.name || 'this opportunity'}.
          </DialogDescription>
        </DialogHeader>

        <EditFollowUpForm
          key={followUp.id + followUp.due_at + (followUp.updated_at || '')}
          followUp={followUp}
          onCancel={() => onOpenChange(false)}
          onSuccess={() => {
            onOpenChange(false);
            onSuccess?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
