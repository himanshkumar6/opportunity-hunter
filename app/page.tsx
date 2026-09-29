import Link from 'next/link';
import { ArrowRight, Compass, Target, Briefcase, Zap, ShieldCheck, Database } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#090D16] text-[#F8FAFC]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0B101D]/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-900/30">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-base font-semibold tracking-tight text-white">
                Opportunity Hunter
              </span>
              <span className="ml-2 rounded border border-emerald-800/50 bg-emerald-950/80 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400 uppercase">
                MVP v1.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:text-white sm:text-sm"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-md shadow-emerald-900/30 transition hover:bg-emerald-500 sm:text-sm"
            >
              Open Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 pt-16 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Production AI Engines: Job Hunt & Lead Hunt
          </div>

          <h1 className="mb-6 text-4xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl">
            Discover High-Intent <span className="text-emerald-400">Jobs & Business Leads</span>{' '}
            with Real Intelligence
          </h1>

          <p className="mb-8 text-base leading-relaxed text-slate-400 sm:text-lg">
            Opportunity Hunter bridges automated multi-source scrapers, qualification scoring, and
            direct company intelligence into one unified command center.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-500 sm:w-auto"
            >
              Launch Platform
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/leads"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-6 py-3 font-medium text-slate-200 transition hover:bg-slate-800 sm:w-auto"
            >
              <Target className="h-4 w-4 text-emerald-400" />
              Explore Lead Hunt
            </Link>
          </div>
        </div>

        {/* Core Engines Preview Grid */}
        <div className="mx-auto mt-20 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          {/* Engine 1: Job Hunt */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0E1526]/80 p-6">
            <div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-800/40 bg-emerald-950/60">
                <Briefcase className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-white">Engine 1: Job Hunt AI</h2>
              <p className="mb-4 text-sm leading-relaxed text-slate-400">
                Continuous ingestion of tech and sales jobs from multiple channels, indexed with AI
                match scoring, status tracking, and verifiable source references.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Zap className="h-3.5 w-3.5" />
                Active Database Ingestion
              </span>
              <Link href="/jobs" className="underline underline-offset-4 hover:text-white">
                View Jobs &rarr;
              </Link>
            </div>
          </div>

          {/* Engine 2: Lead Hunt */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0E1526]/80 p-6">
            <div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-800/40 bg-emerald-950/60">
                <Target className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-white">Engine 2: Lead Hunt AI</h2>
              <p className="mb-4 text-sm leading-relaxed text-slate-400">
                Target local businesses by niche and city. Detect missing websites, SEO audit
                signals, social presence, and extract verified contact details.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Database className="h-3.5 w-3.5" />
                Integrated n8n Automation
              </span>
              <Link href="/leads" className="underline underline-offset-4 hover:text-white">
                Find Leads &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Security & Architecture Highlights */}
        <div className="mx-auto mt-16 flex max-w-4xl flex-wrap items-center justify-around gap-4 rounded-xl border border-slate-800/70 bg-[#0B101D] p-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Strict SSR Authentication</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Server-side n8n Proxying</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Row-Level Security Prepared</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Zero Secret Browser Exposure</span>
          </div>
        </div>
      </main>
    </div>
  );
}
