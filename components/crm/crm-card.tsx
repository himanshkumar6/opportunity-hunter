'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Building2,
  User,
  Clock,
  MapPin,
  Mail,
  MessageSquare,
  AlertTriangle,
  CalendarPlus,
  ArrowRight,
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import type { CrmOpportunityCard } from '@/types/crm';
import type { OpportunityStatus } from '@/types/opportunities';

interface CrmCardProps {
  card: CrmOpportunityCard;
  onStatusChange: (id: string, newStatus: OpportunityStatus) => Promise<void>;
  onScheduleFollowUp: (opportunityId: string) => void;
  isUpdating?: boolean;
}

const ALL_STATUSES: { value: OpportunityStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'approved', label: 'Approved' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'replied', label: 'Replied' },
  { value: 'interested', label: 'Interested' },
  { value: 'closed', label: 'Closed / Won' },
  { value: 'rejected', label: 'Rejected' },
];

export function CrmCard({
  card,
  onStatusChange,
  onScheduleFollowUp,
  isUpdating = false,
}: CrmCardProps) {
  const company = card.company;
  const contact = card.contact;
  const outreach = card.latest_outreach;
  const followUp = card.next_follow_up;

  const handleSelectStatus = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSt = e.target.value as OpportunityStatus;
    if (nextSt !== card.status) {
      await onStatusChange(card.id, nextSt);
    }
  };

  const formatFollowUpDue = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className={`group relative rounded-xl border border-slate-800 bg-[#0C1220] p-3.5 shadow-sm transition-all duration-200 hover:border-slate-700 hover:shadow-md ${
        isUpdating ? 'pointer-events-none opacity-50' : ''
      }`}
      data-testid={`crm-card-${card.id}`}
    >
      {/* Top Header: Company + Match Score */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {company?.id ? (
            <Link
              href={`/companies/${company.id}`}
              className="flex items-center gap-1.5 truncate text-xs font-semibold text-white transition-colors group-hover:text-sky-300 hover:text-sky-400"
              data-testid={`crm-card-company-${card.id}`}
            >
              <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
              <span className="truncate">{company.name}</span>
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 truncate text-xs font-semibold text-slate-300">
              <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
              <span className="truncate">{company?.name || 'Target Account'}</span>
            </span>
          )}
        </div>

        {card.match_score != null && (
          <span
            className="flex-shrink-0 rounded border border-emerald-800/40 bg-emerald-950/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400"
            title={`Match score: ${card.match_score}%`}
          >
            {card.match_score}%
          </span>
        )}
      </div>

      {/* Opportunity Title */}
      <div className="mt-1.5">
        <Link
          href={`/opportunities/${card.id}`}
          className="line-clamp-2 text-xs font-medium text-slate-200 transition-colors hover:text-white"
          data-testid={`crm-card-title-${card.id}`}
        >
          {card.title}
        </Link>
      </div>

      {/* Contact & Location Badges */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
        {contact ? (
          <Link
            href={`/contacts/${contact.id}`}
            className="flex items-center gap-1 truncate text-slate-300 hover:text-white"
            title={`${contact.name} (${contact.role || 'Contact'})`}
          >
            <User className="h-3 w-3 flex-shrink-0 text-sky-400" />
            <span className="max-w-[130px] truncate">{contact.name}</span>
          </Link>
        ) : (
          <span className="flex items-center gap-1 text-slate-500 italic">
            <User className="h-3 w-3 flex-shrink-0 text-slate-600" />
            <span>No contact</span>
          </span>
        )}

        {card.location && (
          <span className="ml-auto flex max-w-[120px] items-center gap-0.5 truncate text-slate-400">
            <MapPin className="h-2.5 w-2.5 flex-shrink-0 text-slate-500" />
            <span className="truncate text-[10px]">{card.location}</span>
          </span>
        )}
      </div>

      {/* Outreach State Section */}
      <div className="mt-2.5 rounded-lg border border-slate-800/80 bg-slate-900/50 p-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400 uppercase">
            {outreach?.channel === 'whatsapp' ? (
              <MessageSquare className="h-3 w-3 text-emerald-400" />
            ) : (
              <Mail className="h-3 w-3 text-sky-400" />
            )}
            Outreach:
          </span>

          {outreach ? (
            <Link
              href={`/outreach/${card.id}`}
              className="flex items-center gap-1 text-[11px] text-sky-400 hover:underline"
              data-testid={`crm-card-outreach-${card.id}`}
            >
              <Badge
                variant={
                  card.outreach_state === 'approved'
                    ? 'emerald'
                    : card.outreach_state === 'sent'
                      ? 'sky'
                      : 'amber'
                }
                className="px-1.5 py-0 text-[10px]"
              >
                {card.outreach_state.toUpperCase()}
              </Badge>
            </Link>
          ) : (
            <Link
              href={`/outreach/${card.id}`}
              className="text-[10px] text-slate-400 hover:text-sky-300"
            >
              + Draft Copy
            </Link>
          )}
        </div>
      </div>

      {/* Follow-up State Section */}
      <div className="mt-2 rounded-lg border border-slate-800/80 bg-slate-900/50 p-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400 uppercase">
            <Clock className="h-3 w-3 text-amber-400" />
            Follow-up:
          </span>

          {followUp ? (
            <Link
              href={`/follow-ups/${followUp.id}`}
              className="flex items-center gap-1 text-[11px] hover:underline"
              data-testid={`crm-card-follow-up-${card.id}`}
            >
              {card.follow_up_state === 'overdue' && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-rose-400">
                  <AlertTriangle className="h-3 w-3" />
                  Overdue
                </span>
              )}
              {card.follow_up_state === 'due_today' && (
                <span className="text-[10px] font-bold text-amber-400">Due Today</span>
              )}
              {card.follow_up_state === 'upcoming' && (
                <span className="text-[10px] text-slate-300">
                  {formatFollowUpDue(followUp.due_at)}
                </span>
              )}
              {card.follow_up_state === 'completed' && (
                <span className="text-[10px] text-emerald-400">Completed</span>
              )}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onScheduleFollowUp(card.id)}
              className="flex items-center gap-1 text-[10px] text-slate-400 transition-colors hover:text-amber-300"
              title="Schedule follow-up"
              data-testid={`crm-schedule-follow-up-btn-${card.id}`}
            >
              <CalendarPlus className="h-3 w-3" />
              <span>Schedule</span>
            </button>
          )}
        </div>

        {followUp && (
          <p
            className="mt-1 truncate text-[11px] font-medium text-slate-300"
            title={followUp.action}
          >
            {followUp.action}
          </p>
        )}
      </div>

      {/* Bottom Footer: Quick Status Update & Actions */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5">
        {/* Status Dropdown */}
        <div className="flex-1">
          <select
            value={card.status}
            onChange={handleSelectStatus}
            disabled={isUpdating}
            className="h-7 w-full rounded border border-slate-800 bg-slate-900 px-2 text-[11px] text-slate-200 transition-colors focus:border-sky-500 focus:outline-none"
            data-testid={`crm-card-status-select-${card.id}`}
          >
            {ALL_STATUSES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Details Link */}
        <Link href={`/opportunities/${card.id}`}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] text-slate-400 hover:text-white"
            title="Open opportunity details"
            data-testid={`crm-card-open-opp-${card.id}`}
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
