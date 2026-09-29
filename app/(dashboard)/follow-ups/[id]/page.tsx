import Link from 'next/link';
import { ArrowLeft, CalendarClock } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';
import { getFollowUpById } from '@/lib/api/follow-ups';
import { FollowUpDetailView } from '@/components/follow-ups/follow-up-detail-view';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function FollowUpDetailPage({ params }: PageProps) {
  const { id } = await params;
  const followUp = await getFollowUpById(id);

  if (!followUp) {
    return (
      <div
        className="rounded-xl border border-slate-800 bg-[#0C1220] p-8 text-center"
        data-testid="follow-up-not-found"
      >
        <EmptyState
          icon={<CalendarClock className="h-6 w-6 text-sky-400" />}
          title="Follow-up not found"
          description={`The follow-up action with ID "${id}" could not be found or may have been deleted.`}
          action={
            <Link href="/follow-ups">
              <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Back to Follow-ups
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return <FollowUpDetailView followUp={followUp} />;
}
