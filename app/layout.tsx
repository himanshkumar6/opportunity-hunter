import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Opportunity Hunter | AI-Powered Job & Lead Discovery Platform',
  description:
    'Production intelligence platform combining Job Hunt AI and Lead Hunt AI with automated discovery, qualification, and outreach tracking.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090D16] text-[#F8FAFC] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
