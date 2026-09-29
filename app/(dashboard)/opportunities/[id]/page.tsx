import { notFound } from 'next/navigation';
import { getOpportunity } from '@/lib/api/opportunities';
import { OpportunityDetailView } from '@/components/opportunities/opportunity-detail-view';

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await getOpportunity(id);

  if (!opportunity) {
    notFound();
  }

  return (
    <OpportunityDetailView
      opportunity={opportunity}
      backHref="/opportunities"
      backLabel="Back to All Opportunities"
    />
  );
}
