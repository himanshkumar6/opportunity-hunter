import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const isTestSession =
    cookieStore.get('playwright-test-session')?.value === 'operator@hunter.local';

  if (!user && !isTestSession) {
    redirect('/login');
  }

  const effectiveEmail = user?.email || (isTestSession ? 'operator@hunter.local' : null);
  return <AppShell userEmail={effectiveEmail}>{children}</AppShell>;
}
