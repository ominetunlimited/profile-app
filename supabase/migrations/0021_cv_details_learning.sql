-- CV details and learning progress, stored on the server instead of in one browser.
-- cv_details: the hand-entered parts of a CV (summary, education, certifications, languages, references, extra sections).
--   The owner reads and writes it; anyone allowed to see the account (see can_see_account) can read it, so a CV shown on a
--   profile is the same CV everywhere. Nobody else can write it.
-- learning_enrollments: private to its owner.

create table if not exists public.cv_details (
  owner_email text primary key references public.accounts(email) on delete cascade,
  details jsonb not null check (pg_column_size(details) < 262144),
  updated_at timestamptz not null default now()
);
alter table public.cv_details enable row level security;

drop policy if exists cv_details_select on public.cv_details;
create policy cv_details_select on public.cv_details for select using (owner_email = public.current_account_email() or public.can_see_account(owner_email));

drop policy if exists cv_details_insert_own on public.cv_details;
create policy cv_details_insert_own on public.cv_details for insert with check (owner_email = public.current_account_email());

drop policy if exists cv_details_update_own on public.cv_details;
create policy cv_details_update_own on public.cv_details for update using (owner_email = public.current_account_email()) with check (owner_email = public.current_account_email());

create table if not exists public.learning_enrollments (
  owner_email text not null references public.accounts(email) on delete cascade,
  topic text not null check (length(topic) between 1 and 200),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (owner_email, topic)
);
alter table public.learning_enrollments enable row level security;

drop policy if exists learning_select_own on public.learning_enrollments;
create policy learning_select_own on public.learning_enrollments for select using (owner_email = public.current_account_email());

drop policy if exists learning_insert_own on public.learning_enrollments;
create policy learning_insert_own on public.learning_enrollments for insert with check (owner_email = public.current_account_email() and status = 'in_progress' and completed_at is null);

drop policy if exists learning_update_own on public.learning_enrollments;
create policy learning_update_own on public.learning_enrollments for update using (owner_email = public.current_account_email()) with check (owner_email = public.current_account_email());

do $$
declare t text;
begin
  foreach t in array array['cv_details', 'learning_enrollments'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
