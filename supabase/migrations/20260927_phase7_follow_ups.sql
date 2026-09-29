-- ============================================================
-- OPPORTUNITY HUNTER: PHASE 7 — FOLLOW-UPS & ACTIVITY MANAGEMENT
-- MIGRATION: 20260927_phase7_follow_ups.sql
-- ============================================================

-- 1. Create enum types if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'follow_up_status') THEN
    CREATE TYPE follow_up_status AS ENUM ('scheduled', 'completed', 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'follow_up_priority') THEN
    CREATE TYPE follow_up_priority AS ENUM ('urgent', 'high', 'medium', 'low');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
    CREATE TYPE activity_type AS ENUM (
      'opportunity_created',
      'outreach_draft_created',
      'outreach_approved',
      'follow_up_created',
      'follow_up_rescheduled',
      'follow_up_completed',
      'status_changed',
      'note_added'
    );
  END IF;
END $$;

-- 2. Follow-ups Table
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ NOT NULL,
  action TEXT NOT NULL,
  note TEXT DEFAULT '',
  status follow_up_status NOT NULL DEFAULT 'scheduled',
  priority follow_up_priority NOT NULL DEFAULT 'medium',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexing for high-performance dashboard queries and overdue scans
CREATE INDEX IF NOT EXISTS idx_follow_ups_opportunity_id ON public.follow_ups(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_contact_id ON public.follow_ups(contact_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due_at ON public.follow_ups(due_at);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON public.follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_priority ON public.follow_ups(priority);

-- 3. Activities / Timeline Table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  type activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexing for timeline chronological queries
CREATE INDEX IF NOT EXISTS idx_activities_opportunity_id ON public.activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type);

-- Comments documenting safety policy
COMMENT ON TABLE public.follow_ups IS 'Operator follow-up tasks and schedule reminders. ZERO automatic sending.';
COMMENT ON TABLE public.activities IS 'Unified engagement and audit timeline records for pipeline opportunities.';
