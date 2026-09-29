'use client';

import { ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@/components/ui';

interface ApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isApproving?: boolean;
  companyName?: string;
  channel?: string;
  recipientName?: string;
}

export function ApprovalModal({
  open,
  onOpenChange,
  onConfirm,
  isApproving = false,
  companyName = 'Target Organization',
  channel = 'email',
  recipientName,
}: ApprovalModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-emerald-900/60 bg-[#0C1220]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-950/60 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white">
                Human Review & Approval
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Verify outreach accuracy before marking as approved
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs text-slate-300">
          <div className="space-y-1.5 rounded-lg border border-slate-800 bg-[#080D1A] p-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Recipient:</span>
              <span className="font-semibold text-white">
                {recipientName ? recipientName : `Team ${companyName}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Organization:</span>
              <span className="font-medium text-emerald-300">{companyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Channel:</span>
              <span className="font-mono text-sky-400 uppercase">{channel}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-amber-900/50 bg-amber-950/20 p-3 text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
            <div className="space-y-1 text-[11px] leading-relaxed">
              <p className="font-semibold text-amber-300">Human Approval Protocol</p>
              <p className="text-amber-200/90">
                Approving marks this draft as verified by the human operator. Automated external
                sending is strictly disabled in Phase 6.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isApproving}
            data-testid="approval-modal-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onConfirm}
            isLoading={isApproving}
            leftIcon={<CheckCircle2 className="h-4 w-4" />}
            data-testid="approval-modal-confirm-btn"
          >
            Confirm & Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
