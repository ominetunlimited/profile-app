-- Verification requests: a person asks a named institution/authority to confirm a record. Server-side,
-- cross-user: the owner files it, the named institution (a registered organisation account) sees it in
-- its inbox and decides, every transition is audited, and the owner is told. Decisions only happen through
-- institution_set_verification_status() / staff_decide_verification_request(); there is no update policy.

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null references public.accounts(email) on delete cascade,
  module_key text not null check (module_key in ('identity', 'academic', 'employment', 'professional_licence', 'trade_competence', 'certification', 'custom')),
  module_name text not null,
  identifier_value text not null,
  issuer_name text not null,
  -- The registered organisation account this was addressed to; null when the named issuer isn't on PROFILE
  -- (those requests go to PROFILE staff instead).
  issuer_email text references public.accounts(email) on delete set null,
  document_media_asset_id uuid references public.media_assets(id) on delete set null,
  document_copyright_id text,
  status text not null default 'submitted' check (status in ('submitted', 'received', 'institution_notified', 'under_review', 'approved', 'verified', 'rejected')),
  decision_note text,
  decided_by text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists verification_requests_owner_idx on public.verification_requests (owner_email, created_at desc);
create index if not exists verification_requests_issuer_idx on public.verification_requests (issuer_email, status);

create table if not exists public.verification_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.verification_requests(id) on delete cascade,
  actor_email text,
  from_status text,
  to_status text not null,
  note text,
  at timestamptz not null default now()
);
create index if not exists verification_request_events_idx on public.verification_request_events (request_id, at);

alter table public.verification_requests enable row level security;
alter table public.verification_request_events enable row level security;

drop policy if exists vr_select on public.verification_requests;
create policy vr_select on public.verification_requests for select using (
  owner_email = public.current_account_email()
  or issuer_email = public.current_account_email()
  or public.is_platform_staff()
);

drop policy if exists vr_insert_own on public.verification_requests;
create policy vr_insert_own on public.verification_requests for insert with check (
  owner_email = public.current_account_email()
  and status = 'submitted' and decision_note is null and decided_by is null and decided_at is null
  and (issuer_email is null or (
    issuer_email <> owner_email
    and exists (select 1 from public.accounts a where a.email = issuer_email and a.account_type = 'organisation')
  ))
  and (document_media_asset_id is null or exists (
    select 1 from public.media_assets m where m.id = document_media_asset_id and m.owner_email = public.current_account_email()
  ))
);

drop policy if exists vre_select on public.verification_request_events;
create policy vre_select on public.verification_request_events for select using (
  exists (
    select 1 from public.verification_requests r
    where r.id = request_id
      and (r.owner_email = public.current_account_email() or r.issuer_email = public.current_account_email() or public.is_platform_staff())
  )
);

-- The addressed institution can open the supporting document the requester attached (and only that one).
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
      and (v.issuer_email = current_account_email() or public.is_platform_staff())
  ))
);

-- Shared transition rules. Open states move forward; 'rejected' needs a reason; verified/rejected are final.
create or replace function public.apply_verification_decision(rid uuid, new_status text, note text, actor text, actor_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare cur text;
begin
  if new_status not in ('received', 'institution_notified', 'under_review', 'approved', 'verified', 'rejected') then
    raise exception 'Invalid status.';
  end if;
  select status into cur from public.verification_requests where id = rid for update;
  if cur is null then raise exception 'Request not found.'; end if;
  if cur in ('verified', 'rejected') then raise exception 'This request has already been decided.'; end if;
  if new_status = 'rejected' and length(trim(coalesce(note, ''))) < 3 then raise exception 'Give the person a reason.'; end if;
  update public.verification_requests
     set status = new_status,
         decision_note = case when new_status in ('verified', 'rejected', 'approved') then nullif(trim(note), '') else decision_note end,
         decided_by = case when new_status in ('verified', 'rejected') then actor else decided_by end,
         decided_at = case when new_status in ('verified', 'rejected') then now() else decided_at end,
         updated_at = now()
   where id = rid;
  insert into public.verification_request_events (request_id, actor_email, from_status, to_status, note)
  values (rid, actor, cur, new_status, nullif(trim(note), ''));
end $$;
revoke all on function public.apply_verification_decision(uuid, text, text, text, uuid) from public;

-- The addressed institution decides. Confirming (approved/verified) is limited to organisations PROFILE has
-- itself vetted; an unvetted organisation can acknowledge and review but not confirm.
create or replace function public.institution_set_verification_status(rid uuid, new_status text, note text default '')
returns void language plpgsql security definer set search_path = public as $$
declare me text := public.current_account_email(); acct public.accounts%rowtype;
begin
  select * into acct from public.accounts where email = me;
  if acct.id is null or acct.account_type <> 'organisation' then raise exception 'Organisation access required.' using errcode = '42501'; end if;
  if acct.org_role is not null and acct.org_role not in ('super_admin', 'admin', 'verification_officer', 'credential_manager', 'compliance_officer') then
    raise exception 'Your organisation role cannot decide verification requests.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.verification_requests where id = rid and issuer_email = me) then
    raise exception 'This request was not addressed to your organisation.' using errcode = '42501';
  end if;
  if new_status in ('approved', 'verified') and coalesce(acct.registry_level, 'user_submitted') not in ('verified', 'recognized') then
    raise exception 'Your organisation must be verified by PROFILE before it can confirm records.' using errcode = '42501';
  end if;
  perform public.apply_verification_decision(rid, new_status, note, me, acct.id);
end $$;
revoke all on function public.institution_set_verification_status(uuid, text, text) from public;
grant execute on function public.institution_set_verification_status(uuid, text, text) to authenticated;

-- PROFILE staff decide requests whose issuer isn't a registered organisation.
create or replace function public.staff_decide_verification_request(rid uuid, new_status text, note text default '')
returns void language plpgsql security definer set search_path = public as $$
declare role_name text;
begin
  select pa.role into role_name from public.platform_admins pa where pa.id = auth.uid() and pa.status = 'active';
  if role_name is null or role_name not in ('super_administrator', 'admin', 'verification_officer', 'compliance_officer') then
    raise exception 'Verification review access required.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.verification_requests where id = rid and issuer_email is null) then
    raise exception 'Only requests with no registered institution can be decided by staff.' using errcode = '42501';
  end if;
  perform public.apply_verification_decision(rid, new_status, note, (select email from public.platform_admins where id = auth.uid()), auth.uid());
end $$;
revoke all on function public.staff_decide_verification_request(uuid, text, text) from public;
grant execute on function public.staff_decide_verification_request(uuid, text, text) to authenticated;

-- Notifications (system-originated, fixed text): the institution is told of a new request, the owner of each decision.
create or replace function public.trg_notify_verification() returns trigger language plpgsql security definer set search_path = public as $$
declare link text; who text;
begin
  if tg_op = 'INSERT' then
    if new.issuer_email is not null then
      select coalesce(a.preferred_display_name, a.legal_name) into who from public.accounts a where a.email = new.owner_email;
      select case
               when a.org_type in ('University', 'Polytechnic', 'College', 'School', 'Research Institute', 'Certification Authority') then '/institution/me'
               when a.org_type in ('Government Ministry', 'Government Agency', 'Regulatory Authority', 'Licensing Board', 'Professional Council') then '/government/me'
               else '/verification-inbox' end
        into link from public.accounts a where a.email = new.issuer_email;
      insert into public.notifications (recipient_email, category, text, deep_link, event_type, actor_email, target_type, target_id, actors, group_count)
      values (new.issuer_email, 'verification', coalesce(who, 'Someone') || ' asked you to confirm: ' || new.module_name, coalesce(link, '/verification-inbox'),
              'verification_requested', null, 'verification_request', new.id::text, '{}', 1);
    end if;
  elsif new.status <> old.status then
    insert into public.notifications (recipient_email, category, text, deep_link, event_type, actor_email, target_type, target_id, actors, group_count)
    values (new.owner_email, 'verification',
            case new.status
              when 'verified' then 'Your ' || new.module_name || ' was confirmed by ' || new.issuer_name || '.'
              when 'rejected' then 'Your ' || new.module_name || ' request was not confirmed' || coalesce(': ' || new.decision_note, '.')
              when 'under_review' then new.issuer_name || ' is reviewing your ' || new.module_name || '.'
              when 'approved' then new.issuer_name || ' approved your ' || new.module_name || ' — final confirmation is next.'
              else new.issuer_name || ' received your ' || new.module_name || ' request.' end,
            '/trust-passport', 'verification_update', null, 'verification_request', new.id::text, '{}', 1);
  end if;
  return new;
end $$;
drop trigger if exists trg_notify_verification_ins on public.verification_requests;
create trigger trg_notify_verification_ins after insert on public.verification_requests for each row execute function public.trg_notify_verification();
drop trigger if exists trg_notify_verification_upd on public.verification_requests;
create trigger trg_notify_verification_upd after update on public.verification_requests for each row execute function public.trg_notify_verification();

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'verification_requests') then
    alter publication supabase_realtime add table public.verification_requests;
  end if;
end $$;
