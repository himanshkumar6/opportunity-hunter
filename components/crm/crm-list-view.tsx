'use client';

import Link from 'next/link';
import { Building2, User, MapPin, AlertTriangle, CalendarPlus } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
} from '@/components/ui';
import type { CrmOpportunityCard } from '@/types/crm';
import type { OpportunityStatus } from '@/types/opportunities';

interface CrmListViewProps {
  cards: CrmOpportunityCard[];
  onStatusChange: (id: string, newStatus: OpportunityStatus) => Promise<void>;
  onScheduleFollowUp: (opportunityId: string) => void;
  updatingId?: string | null;
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

export function CrmListView({
  cards,
  onStatusChange,
  onScheduleFollowUp,
  updatingId,
}: CrmListViewProps) {
  const formatFollowUpDue = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className="overflow-hidden rounded-xl border border-slate-800 bg-[#0C1220]"
      data-testid="crm-list-table-container"
    >
      {/* Desktop Table */}
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader className="bg-slate-900/60">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="font-mono text-[10px] text-slate-400 uppercase">
                Account & Opportunity
              </TableHead>
              <TableHead className="font-mono text-[10px] text-slate-400 uppercase">
                Contact
              </TableHead>
              <TableHead className="font-mono text-[10px] text-slate-400 uppercase">
                Location
              </TableHead>
              <TableHead className="font-mono text-[10px] text-slate-400 uppercase">
                Score
              </TableHead>
              <TableHead className="font-mono text-[10px] text-slate-400 uppercase">
                Pipeline Status
              </TableHead>
              <TableHead className="font-mono text-[10px] text-slate-400 uppercase">
                Outreach
              </TableHead>
              <TableHead className="font-mono text-[10px] text-slate-400 uppercase">
                Follow-up
              </TableHead>
              <TableHead className="text-right font-mono text-[10px] text-slate-400 uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards.map((card) => {
              const company = card.company;
              const contact = card.contact;
              const outreach = card.latest_outreach;
              const followUp = card.next_follow_up;
              const isUpdating = updatingId === card.id;

              return (
                <TableRow
                  key={card.id}
                  className={`border-slate-800/80 transition-colors hover:bg-slate-800/30 ${
                    isUpdating ? 'pointer-events-none opacity-50' : ''
                  }`}
                  data-testid={`crm-list-row-${card.id}`}
                >
                  {/* Account & Opportunity */}
                  <TableCell className="max-w-[240px]">
                    <div className="min-w-0">
                      {company?.id ? (
                        <Link
                          href={`/companies/${company.id}`}
                          className="flex items-center gap-1.5 truncate text-xs font-semibold text-white hover:text-sky-400"
                        >
                          <Building2 className="h-3 w-3 flex-shrink-0 text-slate-400" />
                          <span className="truncate">{company.name}</span>
                        </Link>
                      ) : (
                        <span className="flex items-center gap-1.5 truncate text-xs font-semibold text-slate-300">
                          <Building2 className="h-3 w-3 flex-shrink-0 text-slate-500" />
                          <span className="truncate">{company?.name || 'Account'}</span>
                        </span>
                      )}

                      <Link
                        href={`/opportunities/${card.id}`}
                        className="mt-0.5 block truncate text-[11px] text-slate-400 hover:text-slate-200"
                        title={card.title}
                      >
                        {card.title}
                      </Link>
                    </div>
                  </TableCell>

                  {/* Contact */}
                  <TableCell className="max-w-[150px]">
                    {contact ? (
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="flex items-center gap-1.5 truncate text-xs text-slate-300 hover:text-white"
                      >
                        <User className="h-3 w-3 flex-shrink-0 text-sky-400" />
                        <span className="truncate">{contact.name}</span>
                      </Link>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">No contact</span>
                    )}
                  </TableCell>

                  {/* Location */}
                  <TableCell className="max-w-[120px] whitespace-nowrap">
                    {card.location ? (
                      <span className="flex items-center gap-1 truncate text-[11px] text-slate-400">
                        <MapPin className="h-2.5 w-2.5 flex-shrink-0 text-slate-500" />
                        <span className="truncate">{card.location}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">—</span>
                    )}
                  </TableCell>

                  {/* Match Score */}
                  <TableCell className="whitespace-nowrap">
                    {card.match_score != null ? (
                      <span className="rounded border border-emerald-800/40 bg-emerald-950/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                        {card.match_score}%
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">—</span>
                    )}
                  </TableCell>

                  {/* Pipeline Status Select */}
                  <TableCell className="whitespace-nowrap">
                    <select
                      value={card.status}
                      onChange={(e) => onStatusChange(card.id, e.target.value as OpportunityStatus)}
                      className="h-7 rounded border border-slate-800 bg-slate-900 px-2 text-[11px] text-slate-200 focus:border-sky-500 focus:outline-none"
                      data-testid={`crm-list-status-select-${card.id}`}
                    >
                      {ALL_STATUSES.map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </TableCell>

                  {/* Outreach */}
                  <TableCell className="whitespace-nowrap">
                    {outreach ? (
                      <Link
                        href={`/outreach/${card.id}`}
                        className="inline-flex items-center gap-1"
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
                        className="text-[10px] text-slate-500 hover:text-sky-400"
                      >
                        Draft
                      </Link>
                    )}
                  </TableCell>

                  {/* Follow-up */}
                  <TableCell className="max-w-[140px] whitespace-nowrap">
                    {followUp ? (
                      <Link
                        href={`/follow-ups/${followUp.id}`}
                        className="block truncate text-[11px] hover:underline"
                        title={followUp.action}
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
                        <p className="truncate text-[10px] text-slate-400">{followUp.action}</p>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onScheduleFollowUp(card.id)}
                        className="flex items-center gap-1 text-[10px] text-slate-500 transition-colors hover:text-amber-300"
                      >
                        <CalendarPlus className="h-3 w-3" />
                        <span>Schedule</span>
                      </button>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/opportunities/${card.id}`}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 border-slate-700 px-2 text-[11px] text-slate-300 hover:text-white"
                          data-testid={`crm-list-open-btn-${card.id}`}
                        >
                          View
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

      {/* Mobile Card List */}
      <div className="block space-y-3 divide-y divide-slate-800 p-3 md:hidden">
        {cards.map((card) => {
          const company = card.company;
          const contact = card.contact;

          return (
            <div
              key={card.id}
              className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3"
              data-testid={`crm-mobile-card-${card.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-xs font-semibold text-white">
                  {company?.name || 'Account'}
                </p>
                {card.match_score != null && (
                  <span className="rounded bg-emerald-950/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                    {card.match_score}%
                  </span>
                )}
              </div>

              <Link
                href={`/opportunities/${card.id}`}
                className="line-clamp-2 block text-xs font-medium text-slate-300 hover:text-white"
              >
                {card.title}
              </Link>

              {contact && (
                <p className="flex items-center gap-1 text-[11px] text-slate-400">
                  <User className="h-3 w-3 text-sky-400" />
                  <span>{contact.name}</span>
                </p>
              )}

              <div className="flex items-center justify-between gap-2 border-t border-slate-800 pt-2">
                <select
                  value={card.status}
                  onChange={(e) => onStatusChange(card.id, e.target.value as OpportunityStatus)}
                  className="h-7 rounded border border-slate-800 bg-slate-900 px-2 text-[11px] text-slate-200"
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>

                <Link href={`/opportunities/${card.id}`}>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    Details
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
