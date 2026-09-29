'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, AlertCircle, Sparkles } from 'lucide-react';
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
import type { FollowUpPriority, FollowUpCreateInput } from '@/types/follow-ups';

interface OpportunityOption {
  id: string;
  title: string;
  companyName: string;
  contactName?: string | null;
  contactId?: string | null;
}

interface CreateFollowUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialOpportunityId?: string;
  initialContactId?: string | null;
  initialAction?: string;
  onSuccess?: () => void;
}

interface CreateFormProps {
  initialOpportunityId?: string;
  initialContactId?: string | null;
  initialAction?: string;
  onCancel: () => void;
  onSuccess?: () => void;
}

function getDefaultDueAt() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CreateFollowUpForm({
  initialOpportunityId,
  initialContactId,
  initialAction,
  onCancel,
  onSuccess,
}: CreateFormProps) {
  const router = useRouter();

  const [opportunities, setOpportunities] = React.useState<OpportunityOption[]>([]);
  const [selectedOppId, setSelectedOppId] = React.useState<string>(initialOpportunityId || '');
  const [action, setAction] = React.useState<string>(initialAction || '');
  const [priority, setPriority] = React.useState<FollowUpPriority>('medium');
  const [note, setNote] = React.useState<string>('');
  const [dueAt, setDueAt] = React.useState<string>(getDefaultDueAt());
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Quick preset helper
  const setPresetTime = (daysFromNow: number, hours = 10) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hours, 0, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    setDueAt(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
  };

  React.useEffect(() => {
    let ignore = false;
    fetch('/api/opportunities?pageSize=100')
      .then((r) => r.json())
      .then((res) => {
        if (!ignore && res?.data) {
          const opts: OpportunityOption[] = res.data.map((o: any) => ({
            id: o.id,
            title: o.title || 'Untitled Opportunity',
            companyName: o.company?.name || 'Unknown Company',
            contactName: o.contact?.name || null,
            contactId: o.contact?.id || null,
          }));
          setOpportunities(opts);
          if (opts.length > 0 && !initialOpportunityId && opts[0]) {
            setSelectedOppId(opts[0].id);
          }
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [initialOpportunityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const effectiveOppId = selectedOppId || (opportunities.length > 0 ? opportunities[0]?.id : '');
    if (!effectiveOppId) {
      setError('Please select an opportunity for this follow-up.');
      return;
    }
    if (!action.trim()) {
      setError('Please provide a specific follow-up action description.');
      return;
    }
    if (!dueAt || isNaN(new Date(dueAt).getTime())) {
      setError('Please choose a valid follow-up date and time.');
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedOpp = opportunities.find((o) => o.id === effectiveOppId);
      const payload: FollowUpCreateInput = {
        opportunity_id: effectiveOppId,
        contact_id: initialContactId || selectedOpp?.contactId || null,
        due_at: new Date(dueAt).toISOString(),
        action: action.trim(),
        note: note.trim(),
        priority,
      };

      const res = await fetch('/api/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to schedule follow-up');
      }

      onSuccess?.();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error scheduling follow-up');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOpp = opportunities.find((o) => o.id === selectedOppId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      {error && (
        <div
          className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300"
          data-testid="create-follow-up-error"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Opportunity Selection */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Opportunity <span className="text-rose-400">*</span>
        </label>
        {initialOpportunityId ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 text-xs">
            <span className="font-semibold text-white">
              {selectedOpp?.companyName || 'Target Opportunity'}
            </span>
            <span className="block truncate text-[11px] text-slate-400">
              {selectedOpp?.title || initialOpportunityId}
            </span>
          </div>
        ) : (
          <select
            value={selectedOppId}
            onChange={(e) => setSelectedOppId(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
            data-testid="follow-up-opportunity-select"
          >
            <option value="">Select Opportunity...</option>
            {opportunities.map((opp) => (
              <option key={opp.id} value={opp.id}>
                {opp.companyName} — {opp.title.slice(0, 40)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Action description */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Follow-up Action <span className="text-rose-400">*</span>
        </label>
        <Input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="e.g. Check WhatsApp reply, send customized case study, call founder"
          className="text-xs"
          data-testid="follow-up-action-input"
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
          data-testid="follow-up-due-at-input"
        />
        {/* Quick presets */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setPresetTime(1)}
            className="rounded border border-slate-800 bg-slate-900/80 px-2 py-1 text-[10px] text-slate-300 hover:border-slate-700 hover:text-white"
          >
            Tomorrow 10 AM
          </button>
          <button
            type="button"
            onClick={() => setPresetTime(3)}
            className="rounded border border-slate-800 bg-slate-900/80 px-2 py-1 text-[10px] text-slate-300 hover:border-slate-700 hover:text-white"
          >
            In 3 Days
          </button>
          <button
            type="button"
            onClick={() => setPresetTime(7)}
            className="rounded border border-slate-800 bg-slate-900/80 px-2 py-1 text-[10px] text-slate-300 hover:border-slate-700 hover:text-white"
          >
            Next Week
          </button>
        </div>
      </div>

      {/* Priority */}
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
          data-testid="follow-up-priority-modal-select"
        />
      </div>

      {/* Internal Note */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Internal Context / Note (Optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Context about previous outreach response, specific discussion points, or next steps..."
          className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          data-testid="follow-up-note-input"
        />
      </div>

      {/* Safety notice banner */}
      <div className="flex items-start gap-2 rounded-lg border border-sky-900/30 bg-sky-950/20 p-2.5 text-[11px] text-sky-300">
        <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-400" />
        <span>
          <strong>Zero Auto-Send:</strong> Scheduling a follow-up registers an internal operator
          reminder and logs activity. No automatic message or email is ever dispatched.
        </span>
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
          data-testid="submit-create-follow-up-btn"
        >
          {isSubmitting ? 'Scheduling...' : 'Schedule Follow-up'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CreateFollowUpModal({
  open,
  onOpenChange,
  initialOpportunityId,
  initialContactId,
  initialAction,
  onSuccess,
}: CreateFollowUpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-slate-800 bg-[#0C1220] p-6 text-white">
        <DialogHeader>
          <div className="flex items-center gap-2 text-sky-400">
            <CalendarClock className="h-5 w-5" />
            <DialogTitle className="text-lg font-bold text-white">Schedule Follow-up</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-400">
            Track next action, reminders, and operator activity.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <CreateFollowUpForm
            key={initialOpportunityId || 'new'}
            initialOpportunityId={initialOpportunityId}
            initialContactId={initialContactId}
            initialAction={initialAction}
            onCancel={() => onOpenChange(false)}
            onSuccess={() => {
              onOpenChange(false);
              onSuccess?.();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
