import { notFound } from 'next/navigation';
import { getLead } from '@/lib/api/leads';
import { OpportunityDetailView } from '@/components/opportunities/opportunity-detail-view';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLead(id);

  if (!lead) {
    notFound();
  }

  return (
    <OpportunityDetailView opportunity={lead} backHref="/leads" backLabel="Back to Lead Hunt AI" />
  );
}
