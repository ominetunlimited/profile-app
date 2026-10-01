-- Real Admin Centre backend — replaces the dev-only, client-side-only
-- `staffRole` self-assignment hole (AccountSwitcher.tsx, now gated behind
-- import.meta.env.DEV) with a genuine, server-verified platform-admin
-- identity, separate from the consumer `accounts` table: PROFILE staff
-- aren't content-posting individual/organisation accounts, matching the
-- WordPress wp-admin vs. public-site-user split.
--
-- §37.6 PlatformRole, verbatim (super_administrator, admin, moderator,
-- customer_support, compliance_officer) plus verification_officer (named
-- in §42.2's org-role set and reused here for PROFILE's own verification
-- queue staff, since the Master Prompt doesn't give platform staff a
-- distinct verification role of their own).
create table if not exists public.platform_admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  role text not null check (role in ('super_administrator', 'admin', 'moderator', 'customer_support', 'compliance_officer', 'verification_officer')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  created_by text
);

-- security definer so it can be called from a policy's USING/CHECK clause
-- without that clause itself needing select rights on platform_admins —
-- same pattern as current_account_email() in 0001_init.sql.
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins
    where id = auth.uid() and role = 'super_administrator' and status = 'active'
  )
$$;

alter table public.platform_admins enable row level security;

-- Anyone can read their own row — this is how a signed-in user finds out
-- they ARE (or are not) a platform admin at all.
create policy platform_admins_select_self on public.platform_admins
  for select using (id = auth.uid());

-- Only a super_administrator can see/manage the full roster (the Users &
-- Roles screen). The very first row (the seeded master admin) is inserted
-- via the service_role key directly, which bypasses RLS entirely — there is
-- no other way to satisfy is_super_admin() before any row exists.
create policy platform_admins_select_super on public.platform_admins
  for select using (is_super_admin());
create policy platform_admins_insert_super on public.platform_admins
  for insert with check (is_super_admin());
create policy platform_admins_update_super on public.platform_admins
  for update using (is_super_admin());
create policy platform_admins_delete_super on public.platform_admins
  for delete using (is_super_admin());
