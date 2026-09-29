'use client';

import { History, Mail, MessageSquare, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { OutreachWithRelations } from '@/types/outreach';

interface OutreachHistoryProps {
  records: OutreachWithRelations[];
}

export function OutreachHistory({ records }: OutreachHistoryProps) {
  if (records.length === 0) {
    return (
      <Card className="border-slate-800 bg-[#0C1220]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <History className="h-4 w-4 text-emerald-400" />
            Outreach History & Audit
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Past drafts, approvals, and dispatch logs for this opportunity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 italic">
            No previous outreach drafts or communications logged for this opportunity yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-800 bg-[#0C1220]" data-testid="outreach-history-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <History className="h-4 w-4 text-emerald-400" />
            Outreach History & Audit Trail
          </CardTitle>
          <Badge variant="outline" size="sm" className="font-mono text-[10px]">
            {records.length} {records.length === 1 ? 'Record' : 'Records'}
          </Badge>
        </div>
        <CardDescription className="text-xs text-slate-400">
          Chronological record of generated drafts, operator approvals, and communication attempts
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {records.map((rec) => {
          const isEmail = rec.channel?.toLowerCase() === 'email';
          const isApproved = rec.status?.toLowerCase() === 'approved';

          return (
            <div
              key={rec.id}
              className="space-y-2 rounded-xl border border-slate-800 bg-[#080D1A] p-3 text-xs"
              data-testid={`outreach-history-item-${rec.id}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  {isEmail ? (
                    <Badge variant="sky" size="sm" className="gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </Badge>
                  ) : (
                    <Badge variant="emerald" size="sm" className="gap-1">
                      <MessageSquare className="h-3 w-3" />
                      WhatsApp
                    </Badge>
                  )}

                  {isApproved ? (
                    <Badge variant="emerald" size="sm" className="gap-1 font-mono">
                      <CheckCircle2 className="h-3 w-3" />
                      APPROVED
                    </Badge>
                  ) : (
                    <Badge variant="amber" size="sm" className="gap-1 font-mono">
                      <Clock className="h-3 w-3" />
                      DRAFT
                    </Badge>
                  )}
                </div>

                <span className="font-mono text-[11px] text-slate-400">
                  {formatDate(rec.created_at)}
                </span>
              </div>

              {rec.subject && (
                <div className="space-y-0.5">
                  <span className="font-mono text-[10px] text-slate-500 uppercase">Subject</span>
                  <p className="font-semibold text-slate-200">{rec.subject}</p>
                </div>
              )}

              <div className="space-y-0.5">
                <span className="font-mono text-[10px] text-slate-500 uppercase">Content</span>
                <p className="line-clamp-3 font-sans leading-relaxed whitespace-pre-wrap text-slate-300">
                  {rec.message}
                </p>
              </div>

              {rec.contact && (
                <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-slate-500">
                  <span>Target Contact:</span>
                  <span className="text-slate-300">
                    {rec.contact.name} {rec.contact.role ? `(${rec.contact.role})` : ''}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
