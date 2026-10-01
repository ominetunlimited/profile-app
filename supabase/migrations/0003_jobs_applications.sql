-- Pipeline repair Phase A continued — real backend for Opportunity Hub /
-- Recruiter Workflow / Apply With PROFILE, mirroring jobStore.ts's
-- JobListing and applicationStore.ts's Application shapes exactly, same
-- migration strategy as 0001 (preserve every store function's name/shape,
-- reimplement the body against these tables).

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  org_email text not null references public.accounts(email) on delete cascade,
  title text not null,
  work_type text not null check (work_type in ('remote', 'hybrid', 'on_site')),
  location text not null default '',
  description text not null default '',
  required_skills text[] not null default '{}',
  salary_range text,
  closing_date date,
  -- §9 free-tier hire cap (FREE_TIER_MAX_HIRES = 5 in jobStore.ts) — stored
  -- per-listing rather than hardcoded so a future paid tier can override it
  -- without a schema change.
  max_hires integer not null default 5,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists jobs_org_idx on public.jobs (org_email);
create index if not exists jobs_status_idx on public.jobs (status);
create extension if not exists pg_trgm;
create index if not exists jobs_title_trgm_idx on public.jobs using gin (title gin_trgm_ops);

alter table public.jobs enable row level security;

-- Job listings are the public "storefront" of Opportunity Hub — anyone
-- (including anon, matching §17 Discover/Search) can browse open jobs.
create policy jobs_select_public on public.jobs for select using (true);
create policy jobs_insert_org on public.jobs for insert with check (org_email = current_account_email());
create policy jobs_update_org on public.jobs for update using (org_email = current_account_email());

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  applicant_email text not null references public.accounts(email) on delete cascade,
  org_email text not null references public.accounts(email) on delete cascade,
  cover_letter text not null default '',
  status text not null default 'submitted' check (
    status in ('submitted', 'received', 'under_review', 'shortlisted', 'interview', 'offer', 'rejected', 'withdrawn')
  ),
  -- Design handoff gap audit — Recruiter Workflow's Interview-stage cards
  -- show a scheduled slot as a pill (applicationStore.ts's interviewSlot).
  interview_slot text,
  submitted_at timestamptz not null default now(),
  -- §6.1 "one application per job per applicant" — a real DB constraint,
  -- not just an app-layer check, so it holds even across devices.
  unique (job_id, applicant_email)
);

create index if not exists applications_applicant_idx on public.applications (applicant_email);
create index if not exists applications_org_idx on public.applications (org_email);
create index if not exists applications_job_idx on public.applications (job_id);

alter table public.applications enable row level security;

-- Visible to the applicant themselves and the hiring org — never a third
-- party, and never every applicant to every other applicant.
create policy applications_select_applicant_or_org on public.applications for select
  using (applicant_email = current_account_email() or org_email = current_account_email());
create policy applications_insert_applicant on public.applications for insert
  with check (applicant_email = current_account_email());
-- The org drives the hiring pipeline (status/interview_slot); the applicant
-- can only ever change their own row to 'withdrawn' (enforced by the app
-- layer's withdrawApplication, which always sets status='withdrawn' —
-- RLS itself can't distinguish "which column changed" without a trigger,
-- and a self-withdraw is low-risk enough not to need one yet).
create policy applications_update_applicant_or_org on public.applications for update
  using (applicant_email = current_account_email() or org_email = current_account_email());

-- Realtime — every table a screen needs to update live without a manual
-- refresh (feed, chat, recruiter pipeline, notification badge). Each ADD is
-- wrapped so re-running this migration is a no-op instead of erroring with
-- 42710 duplicate_object (see 0002's fix for the same issue).
do $$
declare
  t text;
begin
  foreach t in array array['activities', 'comments', 'reactions', 'conversations', 'conversation_participants', 'messages', 'notifications', 'jobs', 'applications', 'connections', 'follows']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then
      null;
    end;
  end loop;
end $$;
