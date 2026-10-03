-- Disputes & appeals: a person disputes a decision (a rejected verification, a trust-score change, a moderation
-- action...). Server-side so a reviewer actually sees it. Users file and read their own; only reviewers
-- (super administrator, admin, compliance officer) decide, through staff_resolve_dispute(), which records who and when.
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null references public.accounts(email) on delete cascade,
  dispute_type text not null check (dispute_type in ('verification_decision', 'trust_score_change', 'recruiter_filter_exclusion', 'moderation_action', 'institutional_rejection')),
  target_id text not null default 'unspecified',
  reason text not null check (length(trim(reason)) >= 3),
  evidence_asset_ids uuid[] not null default '{}',
  status text not null default 'submitted' check (status in ('submitted', 'under_review', 'upheld', 'corrected', 'removed', 'escalated', 'independent_review')),
  reviewer_note text,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists disputes_owner_idx on public.disputes (owner_email, created_at desc);
create index if not exists disputes_status_idx on public.disputes (status, created_at);

alter table public.disputes enable row level security;

drop policy if exists disputes_select on public.disputes;
create policy disputes_select on public.disputes for select using (owner_email = public.current_account_email() or public.can_review_data_requests());

drop policy if exists disputes_insert_own on public.disputes;
create policy disputes_insert_own on public.disputes for insert with check (
  owner_email = public.current_account_email()
  and status = 'submitted' and reviewer_note is null and reviewed_by is null and resolved_at is null
  and not exists (
    select 1 from unnest(evidence_asset_ids) a
    where not exists (select 1 from public.media_assets m where m.id = a and m.owner_email = public.current_account_email())
  )
);

-- Reviewers can open the evidence attached to a dispute.
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
  or (target_type = 'credential' and public.can_review_data_requests() and exists (
    select 1 from public.disputes d where media_assets.id = any (d.evidence_asset_ids)
  ))
);

create or replace function public.staff_resolve_dispute(did uuid, decision text, note text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_review_data_requests() then
    raise exception 'Dispute review access required.' using errcode = '42501';
  end if;
  if decision not in ('under_review', 'upheld', 'corrected', 'removed', 'escalated', 'independent_review') then
    raise exception 'Invalid decision.';
  end if;
  if decision in ('upheld', 'corrected', 'removed') and length(trim(coalesce(note, ''))) < 3 then
    raise exception 'Give the person a written outcome.';
  end if;
  update public.disputes
     set status = decision,
         reviewer_note = coalesce(nullif(trim(note), ''), reviewer_note),
         reviewed_by = auth.uid(),
         resolved_at = case when decision in ('upheld', 'corrected', 'removed') then now() else null end
   where id = did and status not in ('upheld', 'corrected', 'removed');
  if not found then raise exception 'Dispute not found or already decided.'; end if;
end $$;
revoke all on function public.staff_resolve_dispute(uuid, text, text) from public;
grant execute on function public.staff_resolve_dispute(uuid, text, text) to authenticated;

create or replace function public.trg_notify_dispute() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status <> old.status then
    insert into public.notifications (recipient_email, category, text, deep_link, event_type, actor_email, target_type, target_id, actors, group_count)
    values (new.owner_email, 'system',
            case new.status
              when 'under_review' then 'A reviewer is now looking at your dispute.'
              when 'upheld' then 'Your dispute outcome: the original decision was upheld' || coalesce(' — ' || new.reviewer_note, '.')
              when 'corrected' then 'Your dispute outcome: the decision was corrected' || coalesce(' — ' || new.reviewer_note, '.')
              when 'removed' then 'Your dispute outcome: the decision was removed' || coalesce(' — ' || new.reviewer_note, '.')
              when 'escalated' then 'Your dispute was escalated for further review.'
              else 'Your dispute was passed to an independent reviewer.' end,
            '/disputes/new', 'dispute_update', null, 'dispute', new.id::text, '{}', 1);
  end if;
  return new;
end $$;
drop trigger if exists trg_notify_dispute on public.disputes;
create trigger trg_notify_dispute after update on public.disputes for each row execute function public.trg_notify_dispute();

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'disputes') then
    alter publication supabase_realtime add table public.disputes;
  end if;
end $$;
