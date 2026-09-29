'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Building2,
  User,
  Sparkles,
  Send,
  ExternalLink,
  Globe,
  MapPin,
  Calendar,
  RotateCcw,
  Check,
  Copy,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import type { FollowUpWithRelations } from '@/types/follow-ups';
import { EditFollowUpModal } from './edit-follow-up-modal';
import { ActivityTimeline } from './activity-timeline';

interface FollowUpDetailViewProps {
  followUp: FollowUpWithRelations;
}

export function FollowUpDetailView({ followUp: initialFollowUp }: FollowUpDetailViewProps) {
  const router = useRouter();
  const [followUp, setFollowUp] = React.useState<FollowUpWithRelations>(initialFollowUp);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isCompleting, setIsCompleting] = React.useState(false);
  const [copiedDraft, setCopiedDraft] = React.useState(false);

  const handleComplete = async () => {
    try {
      setIsCompleting(true);
      const res = await fetch(`/api/follow-ups/${followUp.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'Marked completed on detail page' }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to complete follow-up');
        return;
      }

      const updated = await res.json();
      setFollowUp(updated);
      router.refresh();
    } catch {
      alert('Error completing follow-up');
    } finally {
      setIsCompleting(false);
    }
  };

  const copyOutreach = () => {
    if (followUp.latest_outreach?.message) {
      navigator.clipboard.writeText(followUp.latest_outreach.message);
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2000);
    }
  };

  const isCompleted = followUp.status === 'completed';
  const company = followUp.opportunity?.company;
  const opp = followUp.opportunity;
  const contact = followUp.contact;
  const outreach = followUp.latest_outreach;

  const formattedDueDate = new Date(followUp.due_at).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6" data-testid="follow-up-detail-view">
      {/* Edit / Reschedule Modal */}
      <EditFollowUpModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        followUp={followUp}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/follow-ups"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Follow-ups</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {!isCompleted && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                data-testid="detail-reschedule-btn"
              >
                Reschedule
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleComplete}
                disabled={isCompleting}
                leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                data-testid="detail-complete-btn"
              >
                {isCompleting ? 'Completing...' : 'Mark Completed'}
              </Button>
            </>
          )}

          {opp && (
            <Link href={`/opportunities/${opp.id}`}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                data-testid="detail-view-opp-btn"
              >
                View Opportunity
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Hero Card */}
      <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-slate-400 uppercase">
                {company?.name || 'Target Account'}
              </span>
              {followUp.priority === 'urgent' && <Badge variant="rose">URGENT</Badge>}
              {followUp.priority === 'high' && <Badge variant="amber">HIGH</Badge>}
              {followUp.priority === 'medium' && <Badge variant="sky">MEDIUM</Badge>}
              {followUp.priority === 'low' && <Badge variant="slate">LOW</Badge>}

              {followUp.is_overdue && (
                <Badge variant="rose" className="animate-pulse gap-1">
                  <AlertTriangle className="h-3 w-3" /> Overdue
                </Badge>
              )}
              {followUp.is_due_today && (
                <Badge variant="amber" className="gap-1">
                  <Clock className="h-3 w-3" /> Due Today
                </Badge>
              )}
              {isCompleted ? (
                <Badge variant="emerald" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Completed
                </Badge>
              ) : (
                <Badge variant="sky" className="gap-1">
                  <Calendar className="h-3 w-3" /> Scheduled
                </Badge>
              )}
            </div>

            <h1
              className={`text-xl font-bold tracking-tight text-white sm:text-2xl ${isCompleted ? 'text-slate-400 line-through' : ''}`}
              data-testid="detail-action-title"
            >
              {followUp.action}
            </h1>

            <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Target Due: {formattedDueDate}</span>
              {followUp.completed_at && (
                <span className="text-emerald-400">
                  (Completed: {new Date(followUp.completed_at).toLocaleDateString()})
                </span>
              )}
            </div>
          </div>
        </div>

        {followUp.note && (
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-300">
            <p className="mb-1 font-mono text-[10px] text-slate-500 uppercase">
              Context & Instructions
            </p>
            <p className="leading-relaxed whitespace-pre-line">{followUp.note}</p>
          </div>
        )}
      </div>

      {/* Two Column Layout: Context & Unified Activity Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Target & Opportunity Details (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Company Card */}
          <Card className="border-slate-800 bg-[#0C1220]">
            <CardHeader className="border-b border-slate-800/80 p-4">
              <CardTitle className="flex items-center gap-1.5 font-mono text-xs text-slate-400 uppercase">
                <Building2 className="h-4 w-4 text-emerald-400" />
                Target Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 text-xs">
              <div>
                <p className="text-sm font-semibold text-white">
                  {company?.name || 'Unknown Company'}
                </p>
                {company?.industry && (
                  <p className="text-[11px] text-slate-400">{company.industry}</p>
                )}
              </div>
              {company?.location && (
                <p className="flex items-center gap-1.5 text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  <span>{company.location}</span>
                </p>
              )}
              {company?.website && (
                <a
                  href={
                    company.website.startsWith('http')
                      ? company.website
                      : `https://${company.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-mono text-[11px] text-sky-400 hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span className="truncate">{company.website.replace(/^https?:\/\//i, '')}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card className="border-slate-800 bg-[#0C1220]">
            <CardHeader className="border-b border-slate-800/80 p-4">
              <CardTitle className="flex items-center gap-1.5 font-mono text-xs text-slate-400 uppercase">
                <User className="h-4 w-4 text-sky-400" />
                Primary Decision-Maker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 text-xs">
              {contact ? (
                <>
                  <p className="text-sm font-semibold text-white">{contact.name}</p>
                  {contact.role && <p className="text-[11px] text-slate-400">{contact.role}</p>}
                  {contact.email && (
                    <p className="font-mono text-slate-300">
                      Email: <span className="text-sky-300">{contact.email}</span>
                    </p>
                  )}
                  {(contact.phone || contact.whatsapp) && (
                    <p className="font-mono text-slate-300">
                      Phone/WA:{' '}
                      <span className="text-slate-200">{contact.phone || contact.whatsapp}</span>
                    </p>
                  )}
                </>
              ) : (
                <p className="text-slate-500 italic">No direct contact attached to this record.</p>
              )}
            </CardContent>
          </Card>

          {/* Opportunity Details */}
          {opp && (
            <Card className="border-slate-800 bg-[#0C1220]">
              <CardHeader className="border-b border-slate-800/80 p-4">
                <CardTitle className="flex items-center gap-1.5 font-mono text-xs text-slate-400 uppercase">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  Originating Opportunity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4 text-xs">
                <p className="font-medium text-white">{opp.title}</p>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="outline" size="sm">
                    Status: {opp.status?.toUpperCase()}
                  </Badge>
                  {opp.match_score && (
                    <Badge variant="emerald" size="sm">
                      Score: {opp.match_score}%
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Latest Outreach Preview (if exists) */}
          {outreach && (
            <Card className="border-slate-800 bg-[#0C1220]">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/80 p-4">
                <CardTitle className="flex items-center gap-1.5 font-mono text-xs text-slate-400 uppercase">
                  <Send className="h-4 w-4 text-emerald-400" />
                  Latest Outreach ({outreach.channel.toUpperCase()})
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={copyOutreach}
                  leftIcon={
                    copiedDraft ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )
                  }
                >
                  {copiedDraft ? 'Copied' : 'Copy'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 p-4 text-xs">
                {outreach.subject && (
                  <p className="font-semibold text-slate-200">
                    Subject: <span className="font-normal text-slate-300">{outreach.subject}</span>
                  </p>
                )}
                <div className="max-h-40 overflow-y-auto rounded border border-slate-800 bg-slate-900/60 p-2.5 font-mono text-[11px] whitespace-pre-wrap text-slate-300">
                  {outreach.message}
                </div>
                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                  <span>
                    Status: <strong className="text-white uppercase">{outreach.status}</strong>
                  </span>
                  <Link
                    href={`/outreach/${outreach.opportunity_id}`}
                    className="text-sky-400 hover:underline"
                  >
                    Edit Outreach →
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Unified Activity Timeline (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          <ActivityTimeline opportunityId={followUp.opportunity_id} />
        </div>
      </div>
    </div>
  );
}
