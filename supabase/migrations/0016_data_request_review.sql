-- Staff review of data-rights requests. Decisions only happen through staff_resolve_data_request()
-- (role-checked, audited with the reviewer and time); there is no direct update policy.
alter table public.data_requests add column if not exists reviewer_note text;
alter table public.data_requests add column if not exists reviewed_by uuid;

create or replace function public.can_review_data_requests()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.platform_admins pa
    where pa.id = auth.uid() and pa.status = 'active'
      and pa.role in ('super_administrator', 'admin', 'compliance_officer')
  );
$$;

drop policy if exists data_requests_select on public.data_requests;
create policy data_requests_select on public.data_requests
  for select using (user_email = public.current_account_email() or public.can_review_data_requests());

drop policy if exists data_requests_update_admin on public.data_requests;

create or replace function public.staff_resolve_data_request(rid uuid, decision text, note text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_review_data_requests() then
    raise exception 'Data-request review access required.' using errcode = '42501';
  end if;
  if decision not in ('in_review', 'completed', 'declined') then raise exception 'Invalid decision.'; end if;
  if decision = 'declined' and length(trim(coalesce(note, ''))) < 3 then raise exception 'Give the requester a reason.'; end if;
  update public.data_requests
     set status = decision,
         reviewer_note = nullif(trim(note), ''),
         reviewed_by = auth.uid(),
         resolved_at = case when decision in ('completed', 'declined') then now() else null end
   where id = rid and status in ('submitted', 'in_review');
  if not found then raise exception 'Request not found or already decided.'; end if;
end $$;
revoke all on function public.staff_resolve_data_request(uuid, text, text) from public;
grant execute on function public.staff_resolve_data_request(uuid, text, text) to authenticated;

-- Tell the requester when a decision is made (system-originated, fixed text).
create or replace function public.trg_notify_data_request() returns trigger language plpgsql security definer set search_path = public as $$
declare label text;
begin
  if new.status in ('completed', 'declined') and old.status <> new.status then
    label := case new.kind
      when 'correction' then 'correction request'
      when 'withdraw_consent' then 'consent withdrawal'
      when 'appeal' then 'appeal'
      else 'account deletion request' end;
    insert into public.notifications (recipient_email, category, text, deep_link, event_type, actor_email, target_type, target_id, actors, group_count)
    values (new.user_email, 'system',
            case when new.status = 'completed' then 'Your ' || label || ' was completed.'
                 else 'Your ' || label || ' was declined' || coalesce(': ' || new.reviewer_note, '.') end,
            '/settings?tab=data-rights', 'data_request_decision', null, 'data_request', new.id::text, '{}', 1);
  end if;
  return new;
end $$;
drop trigger if exists trg_notify_data_request on public.data_requests;
create trigger trg_notify_data_request after update on public.data_requests for each row execute function public.trg_notify_data_request();
