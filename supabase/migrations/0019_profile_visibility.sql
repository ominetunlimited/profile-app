-- Profile visibility, enforced by the database.
--   private       only the owner, people they are connected with, people they have a conversation with, and PROFILE staff
--   discoverable  additionally every organisation PROFILE has verified (recruiters, institutions)
--   public        everyone, including signed-out visitors
-- The account row (and therefore search, the people directory and the profile page) and the person's public
-- activity are filtered by this, so no client can see more than the setting allows.
-- Existing accounts keep today's behaviour (public); the sign-up flow chooses 'private' for new individuals.

alter table public.accounts add column if not exists profile_visibility text not null default 'public'
  check (profile_visibility in ('private', 'discoverable', 'public'));

create or replace function public.can_see_account(target text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.accounts a
    where a.email = lower(target)
      and (
        a.profile_visibility = 'public'
        or a.email = public.current_account_email()
        or public.is_platform_staff()
        or (
          a.profile_visibility = 'discoverable'
          and exists (
            select 1 from public.accounts v
            where v.email = public.current_account_email()
              and v.account_type = 'organisation'
              and v.registry_level in ('verified', 'recognized')
          )
        )
        or public.are_connected(a.email, public.current_account_email())
        or exists (
          select 1
          from public.conversation_participants p1
          join public.conversation_participants p2 on p1.conversation_id = p2.conversation_id
          where p1.participant_email = a.email and p2.participant_email = public.current_account_email()
        )
      )
  )
$$;

drop policy if exists accounts_select_all on public.accounts;
drop policy if exists accounts_select on public.accounts;
create policy accounts_select on public.accounts for select using (public.can_see_account(email));

-- A person's activity is only as visible as the person is.
drop policy if exists activities_select on public.activities;
create policy activities_select on public.activities for select using (
  owner_email = public.current_account_email()
  or (
    public.can_see_account(owner_email)
    and (visibility = 'public' or (visibility = 'connections_only' and public.are_connected(owner_email, public.current_account_email())))
  )
);

-- An account may edit its own details but must not promote itself: only PROFILE staff change an organisation's registry level.
create or replace function public.guard_account_privileged_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.registry_level is distinct from old.registry_level and not public.is_platform_staff() and auth.uid() is not null and auth.role() <> 'service_role' then
    raise exception 'Only PROFILE staff can change an organisation''s verification level.' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_account_privileged on public.accounts;
create trigger trg_guard_account_privileged before update on public.accounts for each row execute function public.guard_account_privileged_columns();
