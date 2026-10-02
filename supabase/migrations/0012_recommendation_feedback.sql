-- Phase 5 — recommendation feedback loop. The engine itself is deterministic
-- client-side code over data the viewer is already allowed to read; this table
-- only records what the viewer did with each suggestion (dismissed / acted) so
-- the ranker can stop repeating dismissed items and weight kinds they act on.
create table if not exists public.recommendation_feedback (
  user_email text not null references public.accounts(email) on delete cascade,
  rec_key text not null check (char_length(rec_key) <= 200),
  kind text not null,
  action text not null check (action in ('dismissed', 'acted')),
  created_at timestamptz not null default now(),
  primary key (user_email, rec_key, action)
);
alter table public.recommendation_feedback enable row level security;
drop policy if exists recommendation_feedback_own on public.recommendation_feedback;
create policy recommendation_feedback_own on public.recommendation_feedback for all
  using (user_email = public.current_account_email()) with check (user_email = public.current_account_email());
