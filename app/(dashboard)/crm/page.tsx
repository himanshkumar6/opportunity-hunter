import { getCrmData } from '@/lib/api/crm';
import { CrmView } from '@/components/crm/crm-view';

export const dynamic = 'force-dynamic';

export default async function CrmPage() {
  const crmData = await getCrmData();

  return <CrmView initialItems={crmData.items} initialMetrics={crmData.metrics} />;
}
