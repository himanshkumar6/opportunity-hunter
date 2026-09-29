import { notFound } from 'next/navigation';
import { getJob } from '@/lib/api/jobs';
import { OpportunityDetailView } from '@/components/opportunities/opportunity-detail-view';

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    notFound();
  }

  return (
    <OpportunityDetailView opportunity={job} backHref="/jobs" backLabel="Back to Job Hunt AI" />
  );
}
