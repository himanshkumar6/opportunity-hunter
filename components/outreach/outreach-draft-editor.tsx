'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  MessageSquare,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  CalendarClock,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  Input,
  Select,
} from '@/components/ui';
import { ApprovalModal } from './approval-modal';
import { CreateFollowUpModal } from '@/components/follow-ups/create-follow-up-modal';
import type {
  OpportunityWithCompanyAndContact,
  OutreachChannel,
  OutreachWithRelations,
} from '@/types/outreach';
import type { Contact } from '@/types/database';

interface OutreachDraftEditorProps {
  opportunity: OpportunityWithCompanyAndContact;
  availableContacts: Contact[];
  initialDraft?: OutreachWithRelations | null;
  existingDrafts?: OutreachWithRelations[];
  onDraftUpdated?: () => void;
}

export function OutreachDraftEditor({
  opportunity,
  availableContacts,
  initialDraft,
  existingDrafts,
  onDraftUpdated,
}: OutreachDraftEditorProps) {
  const router = useRouter();

  const [channel, setChannel] = React.useState<OutreachChannel>(
    (initialDraft?.channel as OutreachChannel) || 'email'
  );

  const [contactId, setContactId] = React.useState<string>(
    initialDraft?.contact_id || opportunity.contact?.id || ''
  );

  const emailExisting =
    existingDrafts?.find((d) => d.channel === 'email') ||
    (initialDraft?.channel === 'email' ? initialDraft : null);

  const whatsappExisting =
    existingDrafts?.find((d) => d.channel === 'whatsapp') ||
    (initialDraft?.channel === 'whatsapp' ? initialDraft : null);

  const [channelDrafts, setChannelDrafts] = React.useState<
    Record<
      OutreachChannel,
      {
        subject: string;
        message: string;
        status: string;
        draftId: string | null;
      }
    >
  >({
    email: {
      subject: emailExisting?.subject || '',
      message: emailExisting?.message || '',
      status: emailExisting?.status || 'draft',
      draftId: emailExisting?.id || null,
    },
    whatsapp: {
      subject: whatsappExisting?.subject || '',
      message: whatsappExisting?.message || '',
      status: whatsappExisting?.status || 'draft',
      draftId: whatsappExisting?.id || null,
    },
  });

  const subject = channelDrafts[channel]?.subject || '';
  const message = channelDrafts[channel]?.message || '';
  const status = channelDrafts[channel]?.status || 'draft';
  const draftId = channelDrafts[channel]?.draftId || null;

  const setSubject = (val: string) => {
    setChannelDrafts((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], subject: val },
    }));
  };

  const setMessage = (val: string) => {
    setChannelDrafts((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], message: val },
    }));
  };

  const setStatus = (val: string) => {
    setChannelDrafts((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], status: val },
    }));
  };

  const setDraftId = (val: string | null) => {
    setChannelDrafts((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], draftId: val },
    }));
  };

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isApproving, setIsApproving] = React.useState(false);
  const [showApprovalModal, setShowApprovalModal] = React.useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const [feedback, setFeedback] = React.useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Selected contact object
  const selectedContact = React.useMemo(() => {
    return availableContacts.find((c) => c.id === contactId) || opportunity.contact || null;
  }, [availableContacts, contactId, opportunity.contact]);

  // Generate deterministic template without hallucinations
  const handleGenerateTemplate = async () => {
    try {
      setIsGenerating(true);
      setFeedback(null);

      const res = await fetch('/api/outreach/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunity_id: opportunity.id,
          channel,
          contact_id: contactId || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to generate template');
      }

      const data = await res.json();
      if (data.subject !== undefined) setSubject(data.subject || '');
      if (data.message) setMessage(data.message);

      setFeedback({
        type: 'info',
        text: 'Generated deterministic copy based on verified entity data.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error generating copy',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Save or update draft
  const handleSaveDraft = async () => {
    if (!message.trim()) {
      setFeedback({ type: 'error', text: 'Message content cannot be empty.' });
      return null;
    }

    if (channel === 'email' && !subject.trim()) {
      setFeedback({ type: 'error', text: 'Subject line is required for email outreach.' });
      return null;
    }

    try {
      setIsSaving(true);
      setFeedback(null);

      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunity_id: opportunity.id,
          contact_id: contactId || null,
          channel,
          subject: channel === 'email' ? subject.trim() : null,
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save draft');
      }

      const data = await res.json();
      setDraftId(data.outreach.id);
      setStatus(data.outreach.status);
      setFeedback({
        type: 'success',
        text: 'Draft saved successfully. Human approval required before dispatch.',
      });
      router.refresh();
      onDraftUpdated?.();
      return data.outreach;
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error saving draft',
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle explicit human approval
  const handleConfirmApproval = async () => {
    try {
      setIsApproving(true);
      setFeedback(null);

      // Ensure draft is saved in database first
      let activeDraftId = draftId;
      if (!activeDraftId) {
        const saved = await handleSaveDraft();
        if (!saved) {
          setIsApproving(false);
          setShowApprovalModal(false);
          return;
        }
        activeDraftId = saved.id;
      }

      const res = await fetch(`/api/outreach/${activeDraftId}/approve`, {
        method: 'PATCH',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to approve draft');
      }

      const data = await res.json();
      setStatus(data.outreach.status);
      setShowApprovalModal(false);
      setFeedback({
        type: 'success',
        text: 'Outreach approved by operator. Ready for dispatch (Auto-send disabled).',
      });
      router.refresh();
      onDraftUpdated?.();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error approving draft',
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleCopyMessage = () => {
    const textToCopy =
      channel === 'email' && subject ? `Subject: ${subject}\n\n${message}` : message;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const contactOptions = [
    { value: '', label: 'Team / General (No specific contact)' },
    ...availableContacts.map((c) => ({
      value: c.id,
      label: `${c.name}${c.role ? ` (${c.role})` : ''}${c.email ? ` - ${c.email}` : ''}`,
    })),
  ];

  return (
    <>
      <Card className="border-slate-800 bg-[#0C1220]" data-testid="outreach-draft-editor">
        {/* Card Header */}
        <CardHeader className="border-b border-slate-800/80 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-white">Outreach Composer</CardTitle>
                {status === 'approved' ? (
                  <Badge
                    variant="emerald"
                    size="sm"
                    className="gap-1 font-mono"
                    data-testid="outreach-status-approved-badge"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    APPROVED (HUMAN VERIFIED)
                  </Badge>
                ) : (
                  <Badge
                    variant="amber"
                    size="sm"
                    className="font-mono"
                    data-testid="outreach-status-draft-badge"
                  >
                    DRAFT (PENDING APPROVAL)
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs text-slate-400">
                Draft, review, and manually approve outreach copy before dispatch
              </CardDescription>
            </div>

            {/* Channel Switcher */}
            <div className="flex items-center rounded-lg border border-slate-700 bg-[#080D19] p-1">
              <button
                type="button"
                onClick={() => setChannel('email')}
                data-testid="channel-email-btn"
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  channel === 'email'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setChannel('whatsapp')}
                data-testid="channel-whatsapp-btn"
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  channel === 'whatsapp'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                WhatsApp
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Feedback banner */}
          {feedback && (
            <div
              data-testid="outreach-feedback-banner"
              className={`flex items-center gap-2 rounded-lg p-3 text-xs ${
                feedback.type === 'success'
                  ? 'border border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                  : feedback.type === 'error'
                    ? 'border border-rose-500/40 bg-rose-950/40 text-rose-300'
                    : 'border border-sky-500/40 bg-sky-950/40 text-sky-300'
              }`}
            >
              {feedback.type === 'success' && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
              {feedback.type === 'error' && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
              {feedback.type === 'info' && <Sparkles className="h-4 w-4 flex-shrink-0" />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Contact Selector & Template Action */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block font-mono text-[10px] tracking-wider text-slate-400 uppercase">
                Target Recipient
              </label>
              <Select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                options={contactOptions}
                data-testid="outreach-contact-select"
              />
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-2 border-slate-700 bg-slate-800/80 text-emerald-400 hover:bg-slate-700"
                onClick={handleGenerateTemplate}
                isLoading={isGenerating}
                leftIcon={<Sparkles className="h-3.5 w-3.5 text-emerald-400" />}
                data-testid="generate-template-btn"
              >
                Generate Template
              </Button>
            </div>
          </div>

          {/* Subject Line (For Email) */}
          {channel === 'email' && (
            <div>
              <label className="mb-1 block font-mono text-[10px] tracking-wider text-slate-400 uppercase">
                Email Subject
              </label>
              <Input
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (status === 'approved') setStatus('draft');
                }}
                placeholder="Enter email subject line..."
                data-testid="outreach-subject-input"
              />
            </div>
          )}

          {/* Message Body */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="font-mono text-[10px] tracking-wider text-slate-400 uppercase">
                Message Body
              </label>
              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
                <span>{message.length} chars</span>
                <span>{message.trim() ? message.trim().split(/\s+/).length : 0} words</span>
              </div>
            </div>
            <textarea
              rows={8}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (status === 'approved') setStatus('draft');
              }}
              placeholder={
                channel === 'email'
                  ? 'Type your professional outreach email or click "Generate Template"...'
                  : 'Type your WhatsApp message or click "Generate Template"...'
              }
              className="w-full rounded-xl border border-slate-700 bg-[#080D1A] p-3 text-xs leading-relaxed text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              data-testid="outreach-message-textarea"
            />
          </div>

          {/* Safety Notice Card */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#080D19] p-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>
                Phase 6 Human Approval Mode Active: External sending is completely manual.
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleCopyMessage}
              disabled={!message}
              leftIcon={
                copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )
              }
              data-testid="copy-message-btn"
            >
              {copied ? 'Copied' : 'Copy Text'}
            </Button>
          </div>
        </CardContent>

        {/* Card Footer Actions */}
        <CardFooter className="flex flex-col gap-3 border-t border-slate-800/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              isLoading={isSaving}
              leftIcon={<Save className="h-4 w-4" />}
              data-testid="save-draft-btn"
            >
              Save Draft
            </Button>

            {initialDraft && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSubject(initialDraft.subject || '');
                  setMessage(initialDraft.message || '');
                  setStatus(initialDraft.status || 'draft');
                  setFeedback(null);
                }}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Reset
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {status === 'approved' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFollowUpModal(true)}
                leftIcon={<CalendarClock className="h-4 w-4 text-sky-400" />}
                data-testid="schedule-follow-up-from-outreach-btn"
              >
                Schedule Follow-up
              </Button>
            )}

            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!message.trim() || status === 'approved'}
              onClick={() => setShowApprovalModal(true)}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
              data-testid="approve-outreach-btn"
            >
              {status === 'approved' ? 'Approved by Operator' : 'Review & Approve'}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Approval Confirmation Dialog */}
      <ApprovalModal
        open={showApprovalModal}
        onOpenChange={setShowApprovalModal}
        onConfirm={handleConfirmApproval}
        isApproving={isApproving}
        companyName={opportunity.company?.name || 'Target Organization'}
        channel={channel}
        recipientName={selectedContact?.name || undefined}
      />

      {/* Follow-up Creation Dialog */}
      <CreateFollowUpModal
        open={showFollowUpModal}
        onOpenChange={setShowFollowUpModal}
        initialOpportunityId={opportunity.id}
        initialContactId={contactId}
        initialAction={`Follow up on ${channel.toUpperCase()} outreach to ${opportunity.company?.name || 'decision-maker'}`}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </>
  );
}
