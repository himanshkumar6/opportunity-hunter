'use client';

import { AppShell } from '@/components/layout/app-shell';
import { DesignSystemShowcase } from '@/components/ui/design-system-showcase';

export default function DesignSystemPage() {
  return (
    <AppShell userEmail="operator@hunter.local">
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Opportunity Hunter Design System
            </h1>
            <p className="text-xs text-slate-400">
              Interactive sandbox demonstrating the dark-first visual language, responsive App
              Shell, and reusable component library.
            </p>
          </div>
        </div>

        <DesignSystemShowcase />
      </div>
    </AppShell>
  );
}
