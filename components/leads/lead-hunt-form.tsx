'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Target,
  Globe,
  Sparkles,
  Share2,
  AlertCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  Loader2,
  MapPin,
  Search,
} from 'lucide-react';
import { leadSearchSchema, type LeadSearchFormData } from '@/lib/validations/lead-hunt';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui';

export type LeadHuntExecutionState =
  'idle' | 'starting' | 'searching' | 'processing' | 'results_available' | 'no_results' | 'failed';

interface LeadHuntFormProps {
  onSearchStarted?: (data: LeadSearchFormData) => void;
  onExecutionStateChange?: (state: LeadHuntExecutionState, message?: string) => void;
}

export function LeadHuntForm({ onSearchStarted, onExecutionStateChange }: LeadHuntFormProps) {
  const [executionState, setExecutionState] = React.useState<LeadHuntExecutionState>('idle');
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  // Track exactly what was submitted so the status card shows verified values
  const [submittedQuery, setSubmittedQuery] = React.useState<{
    niche: string;
    city: string;
    max_results: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadSearchFormData>({
    resolver: zodResolver(leadSearchSchema),
    defaultValues: {
      niche: '',
      city: '',
      max_results: 20,
      no_website: true,
      seo_opportunity: true,
      social_opportunity: false,
    },
  });

  const onSubmit = async (values: LeadSearchFormData) => {
    try {
      // Capture CURRENT form values immediately — before any async operations
      const currentNiche = values.niche.trim();
      const currentCity = values.city.trim();
      const currentMaxResults = values.max_results;

      setExecutionState('starting');
      setSubmittedQuery({ niche: currentNiche, city: currentCity, max_results: currentMaxResults });
      setStatusMessage(
        `Dispatching search for "${currentNiche}" businesses in "${currentCity}"...`
      );
      onExecutionStateChange?.(
        'starting',
        `Dispatching search for "${currentNiche}" businesses in "${currentCity}"...`
      );
      onSearchStarted?.(values);

      // POST with the EXACT validated values — no mutations, no defaults override
      const res = await fetch('/api/lead-hunt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          niche: currentNiche,
          city: currentCity,
          max_results: currentMaxResults,
          no_website: values.no_website,
          seo_opportunity: values.seo_opportunity,
          social_opportunity: values.social_opportunity,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg =
          typeof data.error === 'string' ? data.error : `Request failed with status ${res.status}`;
        throw new Error(errMsg);
      }

      setExecutionState('searching');
      setStatusMessage(
        `n8n workflow dispatched for "${currentNiche}" in "${currentCity}". ` +
          `Scraper is querying Google Maps for up to ${currentMaxResults} unique businesses...`
      );
      onExecutionStateChange?.(
        'searching',
        `Workflow started for "${currentNiche}" in "${currentCity}"`
      );

      // Async status simulation — the actual results come from Supabase async
      const processingTimer = setTimeout(() => {
        setExecutionState('processing');
        setStatusMessage(
          `Processing raw "${currentNiche}" business data from "${currentCity}". ` +
            'Evaluating SEO gaps and extracting contact information...'
        );
        onExecutionStateChange?.(
          'processing',
          'Normalizing raw business data, evaluating SEO gaps, and generating opportunities...'
        );
      }, 5000);

      const doneTimer = setTimeout(() => {
        setExecutionState('results_available');
        setStatusMessage(
          `Pipeline dispatched for "${currentNiche}" in "${currentCity}". ` +
            'Check the leads table and search runs log for results as they populate.'
        );
        onExecutionStateChange?.(
          'results_available',
          'Automation workflow dispatched. New qualified records will populate the opportunities table.'
        );
        return () => {
          clearTimeout(processingTimer);
          clearTimeout(doneTimer);
        };
      }, 12000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown execution error';
      setExecutionState('failed');
      setStatusMessage(msg);
      onExecutionStateChange?.('failed', msg);
    }
  };

  const handleReset = () => {
    reset();
    setExecutionState('idle');
    setStatusMessage(null);
    setSubmittedQuery(null);
    onExecutionStateChange?.('idle');
  };

  const isExecuting =
    executionState === 'starting' ||
    executionState === 'searching' ||
    executionState === 'processing';

  return (
    <Card className="border-emerald-900/40 bg-[#081318]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-800/60 bg-emerald-950 text-emerald-400">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Launch Automated Lead Hunt</CardTitle>
              <CardDescription>
                Discover local companies by niche &amp; city with quantifiable digital gaps
              </CardDescription>
            </div>
          </div>

          {isExecuting && (
            <div className="flex items-center gap-2 rounded-full border border-emerald-800/60 bg-emerald-950/80 px-3 py-1 font-mono text-[11px] text-emerald-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>WORKFLOW RUNNING</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="lead-hunt-form">
          {/* Text Inputs */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              label="Business Niche *"
              placeholder="e.g. Real Estate, Dental Clinics, HVAC"
              disabled={isExecuting || isSubmitting}
              error={errors.niche?.message}
              {...register('niche')}
            />

            <Input
              label="Target City / Location *"
              placeholder="e.g. Noida, Austin, London"
              disabled={isExecuting || isSubmitting}
              error={errors.city?.message}
              {...register('city')}
            />

            <Input
              label="Max Leads (1 - 100) *"
              type="number"
              min={1}
              max={100}
              disabled={isExecuting || isSubmitting}
              error={errors.max_results?.message}
              {...register('max_results', { valueAsNumber: true })}
            />
          </div>

          {/* Qualification Signal Filters */}
          <div className="space-y-2 rounded-lg border border-slate-800/80 bg-[#0A171D] p-3.5">
            <p className="font-mono text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
              Qualification Filters (Targeting Criteria)
            </p>

            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
              <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  disabled={isExecuting}
                  {...register('no_website')}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-emerald-400" />
                  No Website Found
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  disabled={isExecuting}
                  {...register('seo_opportunity')}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  SEO Gap Candidate
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  disabled={isExecuting}
                  {...register('social_opportunity')}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1.5">
                  <Share2 className="h-3.5 w-3.5 text-sky-400" />
                  Social Media Gap
                </span>
              </label>
            </div>
          </div>

          {/* Execution Progress & Status Feedback */}
          {executionState !== 'idle' && (
            <div
              className={`rounded-lg border p-3.5 text-xs ${
                executionState === 'failed'
                  ? 'border-rose-900/60 bg-rose-950/30 text-rose-300'
                  : executionState === 'results_available'
                    ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300'
                    : 'border-sky-900/60 bg-sky-950/30 text-sky-300'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 shrink-0">
                  {executionState === 'failed' ? (
                    <AlertCircle className="h-4 w-4 text-rose-400" />
                  ) : executionState === 'results_available' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-[11px] font-semibold tracking-wider capitalize">
                      State: {executionState.replace(/_/g, ' ')}
                    </span>
                    {/* Show the verified submitted query — not form state */}
                    {submittedQuery && (
                      <span className="flex items-center gap-1.5 font-mono text-[10px] opacity-70">
                        <Search className="h-2.5 w-2.5" />
                        {submittedQuery.niche}
                        <MapPin className="h-2.5 w-2.5" />
                        {submittedQuery.city}
                        <span>· up to {submittedQuery.max_results} leads</span>
                      </span>
                    )}
                  </div>
                  {statusMessage && (
                    <p className="mt-1 text-[11px] leading-relaxed opacity-90">{statusMessage}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Triggers */}
          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={isExecuting}
              onClick={handleReset}
              leftIcon={<RotateCcw className="h-3 w-3" />}
            >
              Reset Form
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isExecuting || isSubmitting}
              isLoading={isExecuting || isSubmitting}
              leftIcon={<Play className="h-3.5 w-3.5" />}
            >
              {isExecuting ? 'Scraping in progress...' : 'Execute Lead Hunt Engine'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
