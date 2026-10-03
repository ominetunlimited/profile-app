-- Data-rights requests: correction, consent withdrawal, appeals and account deletion are recorded as
-- auditable requests the user can track and platform admins can action. Users can create and read their own
-- requests; only a super admin can change one (status transitions are an admin action, never client-side).
create table if not exists public.data_requests (
  id uuid primary key default gen_random_uuid(),
  user_email text not null references public.accounts(email) on delete cascade,
  kind text not null check (kind in ('correction', 'withdraw_consent', 'appeal', 'delete')),
  details text,
  status text not null default 'submitted' check (status in ('submitted', 'in_review', 'completed', 'declined')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists data_requests_user_idx on public.data_requests (user_email, created_at desc);

alter table public.data_requests enable row level security;

drop policy if exists data_requests_select on public.data_requests;
create policy data_requests_select on public.data_requests
  for select using (user_email = public.current_account_email() or public.is_super_admin());

drop policy if exists data_requests_insert_own on public.data_requests;
create policy data_requests_insert_own on public.data_requests
  for insert with check (user_email = public.current_account_email() and status = 'submitted' and resolved_at is null);

drop policy if exists data_requests_update_admin on public.data_requests;
create policy data_requests_update_admin on public.data_requests
  for update using (public.is_super_admin());
