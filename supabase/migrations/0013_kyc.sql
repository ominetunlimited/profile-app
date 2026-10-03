-- Phase 6 — KYC capture. A real, server-side submission (the old verification
-- request store was browser-local, so staff could never see it) with the
-- document images held in the existing private media bucket under the
-- 'credential' target. Human review only: liveness / face-match needs a
-- third-party vendor this project doesn't have, so liveness_status is always
-- 'pending_vendor' and is never faked.

create table if not exists public.kyc_submissions (
  id uuid primary key default gen_random_uuid(),
  user_email text not null references public.accounts(email) on delete cascade,
  document_type text not null check (document_type in ('national_id', 'passport', 'drivers_licence', 'residence_permit', 'other')),
  -- What on-device OCR read and the user then confirmed/edited (never trusted by itself).
  extracted jsonb not null default '{}'::jsonb,
  front_asset uuid references public.media_assets(id) on delete set null,
  back_asset uuid references public.media_assets(id) on delete set null,
  selfie_asset uuid references public.media_assets(id) on delete set null,
  liveness_status text not null default 'pending_vendor' check (liveness_status in ('pending_vendor', 'passed', 'failed')),
  status text not null default 'submitted' check (status in ('submitted', 'in_review', 'approved', 'rejected')),
  reviewer_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists kyc_one_open_per_user on public.kyc_submissions (user_email) where status in ('submitted', 'in_review');
create index if not exists kyc_status_idx on public.kyc_submissions (status, created_at);
alter table public.kyc_submissions enable row level security;

drop policy if exists kyc_select on public.kyc_submissions;
create policy kyc_select on public.kyc_submissions for select using (user_email = public.current_account_email() or public.is_platform_staff());

-- A user may only file a fresh, unreviewed submission that references their own images.
drop policy if exists kyc_insert_own on public.kyc_submissions;
create policy kyc_insert_own on public.kyc_submissions for insert with check (
  user_email = public.current_account_email()
  and status = 'submitted' and liveness_status = 'pending_vendor' and reviewed_by is null and reviewer_note is null
  and (front_asset is null or exists (select 1 from public.media_assets m where m.id = front_asset and m.owner_email = public.current_account_email()))
  and (back_asset is null or exists (select 1 from public.media_assets m where m.id = back_asset and m.owner_email = public.current_account_email()))
  and (selfie_asset is null or exists (select 1 from public.media_assets m where m.id = selfie_asset and m.owner_email = public.current_account_email()))
);
-- No update/delete policy: decisions only happen through staff_review_kyc().

-- Staff reviewers can view the images attached to a submission (the activity-media
-- storage policy inherits this through its EXISTS on media_assets).
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
);

create or replace function public.staff_review_kyc(kid uuid, decision text, note text default '')
returns void language plpgsql security definer set search_path = public as $$
declare role_name text;
begin
  select pa.role into role_name from public.platform_admins pa where pa.id = auth.uid() and pa.status = 'active';
  if role_name is null or role_name not in ('super_administrator', 'admin', 'verification_officer', 'compliance_officer') then
    raise exception 'Verification review access required.' using errcode = '42501';
  end if;
  if decision not in ('in_review', 'approved', 'rejected') then raise exception 'Invalid decision.'; end if;
  if decision = 'rejected' and length(trim(coalesce(note, ''))) < 3 then raise exception 'Give the applicant a reason.'; end if;
  update public.kyc_submissions
     set status = decision, reviewer_note = nullif(trim(note), ''), reviewed_by = auth.uid(), reviewed_at = now()
   where id = kid and status in ('submitted', 'in_review');
  if not found then raise exception 'Submission not found or already decided.'; end if;
end $$;
revoke all on function public.staff_review_kyc(uuid, text, text) from public;
grant execute on function public.staff_review_kyc(uuid, text, text) to authenticated;

-- Tell the applicant when a decision is made (system-originated, so it bypasses
-- the actor-based engine; text is fixed server-side).
create or replace function public.trg_notify_kyc() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('approved', 'rejected') and old.status <> new.status then
    insert into public.notifications (recipient_email, category, text, deep_link, event_type, actor_email, target_type, target_id, actors, group_count)
    values (new.user_email, 'verification',
            case when new.status = 'approved' then 'Your identity verification was approved.'
                 else 'Your identity verification was not approved' || coalesce(': ' || new.reviewer_note, '.') end,
            '/trust-passport', 'kyc_decision', null, 'kyc', new.id::text, '{}', 1);
  end if;
  return new;
end $$;
drop trigger if exists trg_notify_kyc on public.kyc_submissions;
create trigger trg_notify_kyc after update on public.kyc_submissions for each row execute function public.trg_notify_kyc();

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'kyc_submissions') then
    alter publication supabase_realtime add table public.kyc_submissions;
  end if;
end $$;
