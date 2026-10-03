-- Organisation staff, invitations and audit trail, enforced by the database.
--  * An organisation (its own login, which holds the super_admin / admin role) invites people by email and role.
--  * The invitation is delivered in-app: the person gets a notification and sees it under "Workspaces", and accepts or
--    declines. (No email provider is configured on this deployment, so there is no email.)
--  * An accepted staff member acts for the organisation through their own login; what they may do is decided here, per role.
--  * Every roster change and verification decision is written to the organisation's audit trail.

create table if not exists public.org_staff (
  id uuid primary key default gen_random_uuid(),
  org_email text not null references public.accounts(email) on delete cascade,
  staff_email text not null check (staff_email = lower(staff_email)),
  role text not null check (role in ('admin', 'verification_officer', 'hr_manager', 'credential_manager', 'moderator', 'compliance_officer')),
  status text not null default 'invited' check (status in ('invited', 'active', 'declined', 'revoked')),
  invited_by text not null,
  invited_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (org_email, staff_email)
);
create index if not exists org_staff_staff_idx on public.org_staff (staff_email, status);
alter table public.org_staff enable row level security;

create table if not exists public.org_audit_log (
  id uuid primary key default gen_random_uuid(),
  org_email text not null references public.accounts(email) on delete cascade,
  actor_email text,
  text text not null check (length(text) <= 500),
  at timestamptz not null default now()
);
create index if not exists org_audit_log_org_idx on public.org_audit_log (org_email, at desc);
alter table public.org_audit_log enable row level security;

-- The role a person holds for an organisation: the organisation's own login uses its account role, staff use their staff role.
create or replace function public.org_role_for(p_org text, p_actor text) returns text
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select coalesce(a.org_role, 'super_admin') from public.accounts a where a.email = lower(p_org) and a.email = lower(p_actor) and a.account_type = 'organisation'),
    (select s.role from public.org_staff s where s.org_email = lower(p_org) and s.staff_email = lower(p_actor) and s.status = 'active')
  )
$$;

create or replace function public.can_act_for_org(p_org text, p_roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select p_org is not null and public.current_account_email() is not null
     and coalesce(public.org_role_for(p_org, public.current_account_email()) = any (p_roles), false)
$$;

drop policy if exists org_staff_select on public.org_staff;
create policy org_staff_select on public.org_staff for select using (
  org_email = public.current_account_email()
  or staff_email = public.current_account_email()
  or public.can_act_for_org(org_email, array['super_admin', 'admin'])
  or public.can_review_data_requests()
);

drop policy if exists org_audit_select on public.org_audit_log;
create policy org_audit_select on public.org_audit_log for select using (
  public.can_act_for_org(org_email, array['super_admin', 'admin', 'compliance_officer'])
  or public.can_review_data_requests()
);

create or replace function public.org_audit(p_org text, p_text text) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.org_audit_log (org_email, actor_email, text) values (lower(p_org), public.current_account_email(), left(p_text, 500));
end $$;
revoke all on function public.org_audit(text, text) from public, anon, authenticated;

-- Appending to the trail from the app: allowed for the organisation and its active staff.
create or replace function public.org_log_action(p_org text, p_text text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.org_role_for(p_org, public.current_account_email()) is null then raise exception 'Not a member of this organisation.' using errcode = '42501'; end if;
  perform public.org_audit(p_org, p_text);
end $$;
revoke all on function public.org_log_action(text, text) from public;
grant execute on function public.org_log_action(text, text) to authenticated;

create or replace function public.org_invite_staff(p_emails text[], p_role text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me text := public.current_account_email();
  org public.accounts%rowtype;
  e text; cleaned text; existing public.org_staff%rowtype;
  invited text[] := '{}'; skipped text[] := '{}'; invalid text[] := '{}';
  room integer;
begin
  select * into org from public.accounts where email = me and account_type = 'organisation';
  if org.id is null or coalesce(org.org_role, 'super_admin') not in ('super_admin', 'admin') then
    raise exception 'Only an organisation administrator can invite staff.' using errcode = '42501';
  end if;
  if p_role not in ('admin', 'verification_officer', 'hr_manager', 'credential_manager', 'moderator', 'compliance_officer') then raise exception 'Invalid role.'; end if;
  select 20 - count(*) into room from public.org_staff where org_email = me and status in ('invited', 'active');
  foreach e in array p_emails loop
    cleaned := lower(trim(e));
    if cleaned !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then invalid := invalid || e; continue; end if;
    if cleaned = me then skipped := skipped || cleaned; continue; end if;
    select * into existing from public.org_staff where org_email = me and staff_email = cleaned;
    if existing.id is not null and existing.status in ('invited', 'active') then skipped := skipped || cleaned; continue; end if;
    if room <= 0 then skipped := skipped || cleaned; continue; end if;
    if existing.id is null then
      insert into public.org_staff (org_email, staff_email, role, invited_by) values (me, cleaned, p_role, me);
    else
      update public.org_staff set role = p_role, status = 'invited', invited_by = me, invited_at = now(), responded_at = null where id = existing.id;
    end if;
    room := room - 1;
    invited := invited || cleaned;
    if exists (select 1 from public.accounts where email = cleaned) then
      insert into public.notifications (recipient_email, category, text, deep_link, event_type, actor_email, target_type, target_id, actors, group_count)
      values (cleaned, 'professional', org.legal_name || ' invited you to join their workspace as ' || replace(p_role, '_', ' ') || '.', '/workspaces', 'org_staff_invite', me, 'org_staff', me, '{}', 1);
    end if;
  end loop;
  if array_length(invited, 1) > 0 then
    perform public.org_audit(me, 'Invited ' || array_to_string(invited, ', ') || ' as ' || replace(p_role, '_', ' ') || '.');
  end if;
  return jsonb_build_object('invited', to_jsonb(invited), 'skipped', to_jsonb(skipped), 'invalid', to_jsonb(invalid));
end $$;
revoke all on function public.org_invite_staff(text[], text) from public;
grant execute on function public.org_invite_staff(text[], text) to authenticated;

create or replace function public.org_respond_invite(p_id uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = public as $$
declare me text := public.current_account_email(); s public.org_staff%rowtype;
begin
  select * into s from public.org_staff where id = p_id and staff_email = me and status = 'invited';
  if s.id is null then raise exception 'Invitation not found.' using errcode = '42501'; end if;
  update public.org_staff set status = case when p_accept then 'active' else 'declined' end, responded_at = now() where id = p_id;
  insert into public.org_audit_log (org_email, actor_email, text) values (s.org_email, me, me || case when p_accept then ' accepted the invitation as ' else ' declined the invitation as ' end || replace(s.role, '_', ' ') || '.');
end $$;
revoke all on function public.org_respond_invite(uuid, boolean) from public;
grant execute on function public.org_respond_invite(uuid, boolean) to authenticated;

create or replace function public.org_end_membership(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me text := public.current_account_email(); s public.org_staff%rowtype; by_org boolean;
begin
  select * into s from public.org_staff where id = p_id;
  if s.id is null then raise exception 'Not found.'; end if;
  by_org := public.can_act_for_org(s.org_email, array['super_admin', 'admin']);
  if not by_org and s.staff_email <> me then raise exception 'You cannot change this membership.' using errcode = '42501'; end if;
  update public.org_staff set status = 'revoked', responded_at = now() where id = p_id;
  insert into public.org_audit_log (org_email, actor_email, text) values (s.org_email, me, case when by_org then 'Removed ' else s.staff_email || ' left: removed ' end || s.staff_email || ' (' || replace(s.role, '_', ' ') || ').');
end $$;
revoke all on function public.org_end_membership(uuid) from public;
grant execute on function public.org_end_membership(uuid) to authenticated;

-- Role enforcement for verification: the addressed organisation OR its active staff with a verifying role.
drop policy if exists vr_select on public.verification_requests;
create policy vr_select on public.verification_requests for select using (
  owner_email = public.current_account_email()
  or issuer_email = public.current_account_email()
  or public.can_act_for_org(issuer_email, array['super_admin', 'admin', 'verification_officer', 'credential_manager', 'compliance_officer', 'hr_manager'])
  or public.is_platform_staff()
);

drop policy if exists vre_select on public.verification_request_events;
create policy vre_select on public.verification_request_events for select using (
  exists (
    select 1 from public.verification_requests r
    where r.id = request_id
      and (r.owner_email = public.current_account_email()
        or public.can_act_for_org(r.issuer_email, array['super_admin', 'admin', 'verification_officer', 'credential_manager', 'compliance_officer', 'hr_manager'])
        or public.is_platform_staff())
  )
);

create or replace function public.institution_set_verification_status(rid uuid, new_status text, note text default '')
returns void language plpgsql security definer set search_path = public as $$
declare me text := public.current_account_email(); req public.verification_requests%rowtype; org public.accounts%rowtype;
begin
  select * into req from public.verification_requests where id = rid;
  if req.id is null or req.issuer_email is null then raise exception 'This request was not addressed to an organisation.' using errcode = '42501'; end if;
  if not public.can_act_for_org(req.issuer_email, array['super_admin', 'admin', 'verification_officer', 'credential_manager', 'compliance_officer']) then
    raise exception 'Your role cannot decide verification requests for this organisation.' using errcode = '42501';
  end if;
  select * into org from public.accounts where email = req.issuer_email;
  if new_status in ('approved', 'verified') and coalesce(org.registry_level, 'user_submitted') not in ('verified', 'recognized') then
    raise exception 'Your organisation must be verified by PROFILE before it can confirm records.' using errcode = '42501';
  end if;
  perform public.apply_verification_decision(rid, new_status, note, me, auth.uid());
  perform public.org_audit(req.issuer_email, 'Set ' || req.module_name || ' to ' || replace(new_status, '_', ' ') || '.');
end $$;
revoke all on function public.institution_set_verification_status(uuid, text, text) from public;
grant execute on function public.institution_set_verification_status(uuid, text, text) to authenticated;

-- Staff acting for an organisation can open the document attached to a request addressed to it.
drop policy if exists media_assets_select_via_target on public.media_assets;
create policy media_assets_select_via_target on public.media_assets for select using (
  (target_type = 'activity' and exists (
    select 1 from public.activities a
    where a.id::text = media_assets.target_id
      and (
        a.visibility = 'public'
        or a.owner_email = current_account_email()
        or (a.visibility = 'connections_only' and exists (
          select 1 from public.connections c
          where c.status = 'accepted'
            and ((c.requester_email = a.owner_email and c.recipient_email = current_account_email())
              or (c.recipient_email = a.owner_email and c.requester_email = current_account_email()))
        ))
      )
  ))
  or (target_type = 'credential' and owner_email = current_account_email())
  or (target_type = 'credential' and public.is_platform_staff() and exists (
    select 1 from public.kyc_submissions k where k.id::text = media_assets.target_id
  ))
  or (target_type = 'credential' and exists (
    select 1 from public.verification_requests v
    where v.document_media_asset_id = media_assets.id
      and (public.can_act_for_org(v.issuer_email, array['super_admin', 'admin', 'verification_officer', 'credential_manager', 'compliance_officer']) or public.is_platform_staff())
  ))
  or (target_type = 'credential' and public.can_review_data_requests() and exists (
    select 1 from public.disputes d where media_assets.id = any (d.evidence_asset_ids)
  ))
);

do $$
declare t text;
begin
  foreach t in array array['org_staff', 'org_audit_log'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
