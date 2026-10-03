-- Admin telemetry: a real AI decision log (every AI output that touched a user, reviewable by staff) and a single
-- staff-only function that summarises the platform for Mission Control. Both are limited to reviewers
-- (super administrator, admin, compliance officer) by public.can_review_data_requests().

create table if not exists public.ai_decision_log (
  id uuid primary key default gen_random_uuid(),
  surface text not null check (surface in ('advisor', 'copilot', 'cover_letter', 'opportunity_match')),
  output text not null check (length(output) <= 4000),
  data_accessed text[] not null default '{}',
  user_email text not null references public.accounts(email) on delete cascade,
  review_status text not null default 'unreviewed' check (review_status in ('unreviewed', 'reviewed', 'flagged')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ai_decision_log_created_idx on public.ai_decision_log (created_at desc);
create index if not exists ai_decision_log_status_idx on public.ai_decision_log (review_status);

alter table public.ai_decision_log enable row level security;

drop policy if exists ai_log_select on public.ai_decision_log;
create policy ai_log_select on public.ai_decision_log for select using (user_email = public.current_account_email() or public.can_review_data_requests());

drop policy if exists ai_log_insert_own on public.ai_decision_log;
create policy ai_log_insert_own on public.ai_decision_log for insert with check (
  user_email = public.current_account_email() and review_status = 'unreviewed' and reviewed_by is null and reviewed_at is null
);

create or replace function public.staff_review_ai_decision(entry uuid, status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_review_data_requests() then
    raise exception 'AI log review access required.' using errcode = '42501';
  end if;
  if status not in ('reviewed', 'flagged', 'unreviewed') then raise exception 'Invalid status.'; end if;
  update public.ai_decision_log
     set review_status = status,
         reviewed_by = case when status = 'unreviewed' then null else auth.uid() end,
         reviewed_at = case when status = 'unreviewed' then null else now() end
   where id = entry;
  if not found then raise exception 'Entry not found.'; end if;
end $$;
revoke all on function public.staff_review_ai_decision(uuid, text) from public;
grant execute on function public.staff_review_ai_decision(uuid, text) to authenticated;

-- One round trip for Mission Control: counts only, nothing about any individual.
create or replace function public.platform_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare result jsonb;
begin
  if not public.can_review_data_requests() then
    raise exception 'Mission Control access required.' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'generated_at', now(),
    'accounts', jsonb_build_object(
      'total', (select count(*) from accounts),
      'individuals', (select count(*) from accounts where account_type = 'individual'),
      'organisations', (select count(*) from accounts where account_type = 'organisation'),
      'organisations_verified', (select count(*) from accounts where account_type = 'organisation' and registry_level in ('verified', 'recognized')),
      'organisation_claims_pending', (select count(*) from accounts where account_type = 'organisation' and registry_level = 'user_submitted'),
      'private', (select count(*) from accounts where profile_visibility = 'private'),
      'discoverable', (select count(*) from accounts where profile_visibility = 'discoverable'),
      'public', (select count(*) from accounts where profile_visibility = 'public')
    ),
    'activity', jsonb_build_object(
      'records_total', (select count(*) from activities),
      'records_7d', (select count(*) from activities where created_at > now() - interval '7 days'),
      'jobs_open', (select count(*) from jobs where status = 'open'),
      'communities', (select count(*) from communities)
    ),
    'identity', jsonb_build_object(
      'kyc_waiting', (select count(*) from kyc_submissions where status in ('submitted', 'in_review')),
      'kyc_approved', (select count(*) from kyc_submissions where status = 'approved'),
      'kyc_rejected', (select count(*) from kyc_submissions where status = 'rejected')
    ),
    'verification', jsonb_build_object(
      'requests_open', (select count(*) from verification_requests where status not in ('verified', 'rejected')),
      'requests_unrouted_open', (select count(*) from verification_requests where issuer_email is null and status not in ('verified', 'rejected')),
      'requests_verified', (select count(*) from verification_requests where status = 'verified'),
      'requests_rejected', (select count(*) from verification_requests where status = 'rejected')
    ),
    'cases', jsonb_build_object(
      'disputes_open', (select count(*) from disputes where status in ('submitted', 'under_review', 'escalated', 'independent_review')),
      'disputes_total', (select count(*) from disputes),
      'data_requests_open', (select count(*) from data_requests where status in ('submitted', 'in_review')),
      'data_requests_total', (select count(*) from data_requests)
    ),
    'ai', jsonb_build_object(
      'outputs_7d', (select count(*) from ai_decision_log where created_at > now() - interval '7 days'),
      'flagged', (select count(*) from ai_decision_log where review_status = 'flagged'),
      'reviewed', (select count(*) from ai_decision_log where review_status = 'reviewed'),
      'unreviewed', (select count(*) from ai_decision_log where review_status = 'unreviewed')
    ),
    'security', jsonb_build_object(
      'tables_total', (select count(*) from pg_tables where schemaname = 'public'),
      'tables_without_rls', (select count(*) from pg_tables t where t.schemaname = 'public' and not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = t.tablename and c.relrowsecurity))
    )
  ) into result;
  return result;
end $$;
revoke all on function public.platform_stats() from public;
grant execute on function public.platform_stats() to authenticated;
