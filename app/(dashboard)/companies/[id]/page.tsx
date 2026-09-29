import { notFound } from 'next/navigation';
import { getCompany } from '@/lib/api/companies';
import { CompanyDetailView } from '@/components/companies/company-detail-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const company = await getCompany(id);

  if (!company) {
    notFound();
  }

  return <CompanyDetailView company={company} />;
}
