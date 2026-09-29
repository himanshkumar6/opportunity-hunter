'use client';

import * as React from 'react';
import { Settings as SettingsIcon, Palette, Server, Key, Info } from 'lucide-react';
import {
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { DesignSystemShowcase } from '@/components/ui/design-system-showcase';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState('general');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-800/40 bg-emerald-950/80 text-emerald-400">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              System Settings & Architecture
            </h1>
            <p className="text-xs text-slate-400">
              Manage automation webhooks, environment variables, and inspect the design system
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-slate-800 bg-[#0B101E]">
          <TabsTrigger value="general" className="gap-2">
            <Server className="h-3.5 w-3.5" />
            General & Environment
          </TabsTrigger>
          <TabsTrigger value="design-system" className="gap-2">
            <Palette className="h-3.5 w-3.5" />
            Design System Sandbox
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: General & Environment */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="h-4 w-4 text-emerald-400" />
                Backend Integration Status
              </CardTitle>
              <CardDescription>
                Live configuration parameters connecting Opportunity Hunter to n8n and Supabase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5 rounded-lg border border-slate-800 bg-[#080D19] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">n8n Lead Hunt Webhook</span>
                    <Badge variant="emerald" size="sm" dot>
                      CONFIGURED
                    </Badge>
                  </div>
                  <p className="truncate font-mono text-[11px] text-slate-400">
                    https://technoboy.app.n8n.cloud/webhook/lead-hunt
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Targeted by automated lead scraping triggers.
                  </p>
                </div>

                <div className="space-y-1.5 rounded-lg border border-slate-800 bg-[#080D19] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Supabase SSR Database</span>
                    <Badge variant="emerald" size="sm" dot>
                      CONNECTED
                    </Badge>
                  </div>
                  <p className="truncate font-mono text-[11px] text-slate-400">
                    https://swnbqibwfngfwvrbqfaw.supabase.co
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Client & Server SSR connections active.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-slate-900/30 p-4 text-xs text-slate-400">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-400" />
                <div>
                  <p className="font-medium text-slate-200">Database Schema Protection</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                    The Opportunity Hunter data model (
                    <code className="text-slate-300">search_runs</code>,{' '}
                    <code className="text-slate-300">companies</code>,{' '}
                    <code className="text-slate-300">opportunities</code>,{' '}
                    <code className="text-slate-300">contacts</code>) is strictly isolated. No
                    destructive migrations are permitted on remote production without operator
                    authorization.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Design System Sandbox */}
        <TabsContent value="design-system" className="space-y-6">
          <DesignSystemShowcase />
        </TabsContent>
      </Tabs>
    </div>
  );
}
