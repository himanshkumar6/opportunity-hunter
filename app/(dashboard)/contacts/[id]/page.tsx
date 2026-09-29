import { notFound } from 'next/navigation';
import { getContact } from '@/lib/api/contacts';
import { ContactDetailView } from '@/components/contacts/contact-detail-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = await params;
  const contact = await getContact(id);

  if (!contact) {
    notFound();
  }

  return <ContactDetailView contact={contact} />;
}
