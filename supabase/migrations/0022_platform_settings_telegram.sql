-- Platform settings managed from the Admin Centre:
--  * support contact details (shown publicly in the Help Centre), editable by super administrators and admins;
--  * Telegram alerts for staff: a bot token (kept encrypted in Supabase Vault, never readable from the browser),
--    a chat id, and which events trigger a message. Messages are fixed text with no personal data.

create extension if not exists pg_net;

create table if not exists public.platform_settings (
  id integer primary key default 1 check (id = 1),
  support_email text,
  support_phone text,
  customer_care_number text,
  whatsapp_number text,
  support_hours text,
  support_address text,
  status_page_url text,
  app_url text not null default 'https://profile-app-sand.vercel.app',
  updated_at timestamptz not null default now(),
  updated_by uuid
);
insert into public.platform_settings (id) values (1) on conflict (id) do nothing;
alter table public.platform_settings enable row level security;

create or replace function public.can_manage_platform_settings() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins pa where pa.id = auth.uid() and pa.status = 'active' and pa.role in ('super_administrator', 'admin'))
$$;

drop policy if exists platform_settings_select on public.platform_settings;
create policy platform_settings_select on public.platform_settings for select using (true);
drop policy if exists platform_settings_update on public.platform_settings;
create policy platform_settings_update on public.platform_settings for update using (public.can_manage_platform_settings()) with check (public.can_manage_platform_settings());

create or replace function public.touch_platform_settings() returns trigger language plpgsql as $$
begin new.updated_at := now(); new.updated_by := auth.uid(); return new; end $$;
drop trigger if exists trg_touch_platform_settings on public.platform_settings;
create trigger trg_touch_platform_settings before update on public.platform_settings for each row execute function public.touch_platform_settings();

-- Telegram configuration: no policies at all, so the API can never read or write it directly.
create table if not exists public.admin_notification_settings (
  id integer primary key default 1 check (id = 1),
  telegram_enabled boolean not null default false,
  telegram_chat_id text,
  events text[] not null default array['kyc', 'verification_unrouted', 'dispute', 'data_request', 'org_claim', 'feedback'],
  token_secret_id uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
insert into public.admin_notification_settings (id) values (1) on conflict (id) do nothing;
alter table public.admin_notification_settings enable row level security;

create or replace function public.admin_get_notification_settings() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare s public.admin_notification_settings%rowtype;
begin
  if not public.can_manage_platform_settings() then raise exception 'Settings access required.' using errcode = '42501'; end if;
  select * into s from public.admin_notification_settings where id = 1;
  return jsonb_build_object('telegram_enabled', s.telegram_enabled, 'telegram_chat_id', s.telegram_chat_id, 'events', to_jsonb(s.events), 'token_set', s.token_secret_id is not null);
end $$;

create or replace function public.admin_set_telegram(p_token text, p_chat_id text, p_enabled boolean, p_events text[]) returns void
language plpgsql security definer set search_path = public, vault as $$
declare s public.admin_notification_settings%rowtype; sid uuid;
begin
  if not exists (select 1 from public.platform_admins pa where pa.id = auth.uid() and pa.status = 'active' and pa.role = 'super_administrator') then
    raise exception 'Only a super administrator can change notification delivery.' using errcode = '42501';
  end if;
  select * into s from public.admin_notification_settings where id = 1;
  sid := s.token_secret_id;
  if p_token is not null and length(trim(p_token)) > 0 then
    if sid is null then
      sid := vault.create_secret(trim(p_token), 'telegram_bot_token', 'Telegram bot token for staff alerts');
    else
      perform vault.update_secret(sid, trim(p_token), 'telegram_bot_token', 'Telegram bot token for staff alerts');
    end if;
  end if;
  if p_enabled and (sid is null or coalesce(trim(p_chat_id), '') = '') then
    raise exception 'Add a bot token and a chat id before turning Telegram alerts on.';
  end if;
  update public.admin_notification_settings
     set telegram_enabled = p_enabled, telegram_chat_id = nullif(trim(p_chat_id), ''), events = coalesce(p_events, events), token_secret_id = sid, updated_at = now(), updated_by = auth.uid()
   where id = 1;
end $$;

-- Internal sender. Never exposed to the API; callers are the triggers below and the test function.
create or replace function public.telegram_send(p_text text, p_force boolean default false) returns bigint
language plpgsql security definer set search_path = public, vault, net as $$
declare s public.admin_notification_settings%rowtype; tok text; base text; req bigint;
begin
  select * into s from public.admin_notification_settings where id = 1;
  if s.token_secret_id is null or coalesce(s.telegram_chat_id, '') = '' then return null; end if;
  if not s.telegram_enabled and not p_force then return null; end if;
  select decrypted_secret into tok from vault.decrypted_secrets where id = s.token_secret_id;
  if tok is null then return null; end if;
  select app_url into base from public.platform_settings where id = 1;
  req := net.http_post(
    url := 'https://api.telegram.org/bot' || tok || '/sendMessage',
    body := jsonb_build_object('chat_id', s.telegram_chat_id, 'text', p_text, 'disable_web_page_preview', true),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return req;
end $$;
revoke all on function public.telegram_send(text, boolean) from public, anon, authenticated;

create or replace function public.notify_admins(p_event text, p_text text) returns void
language plpgsql security definer set search_path = public as $$
declare s public.admin_notification_settings%rowtype;
begin
  select * into s from public.admin_notification_settings where id = 1;
  if s.telegram_enabled and p_event = any (s.events) then perform public.telegram_send(p_text); end if;
exception when others then
  null; -- an alert failing must never block the action that caused it
end $$;
revoke all on function public.notify_admins(text, text) from public, anon, authenticated;

create or replace function public.admin_test_telegram() returns bigint
language plpgsql security definer set search_path = public as $$
declare req bigint;
begin
  if not exists (select 1 from public.platform_admins pa where pa.id = auth.uid() and pa.status = 'active' and pa.role = 'super_administrator') then
    raise exception 'Only a super administrator can send a test message.' using errcode = '42501';
  end if;
  req := public.telegram_send('PROFILE: test alert. Telegram notifications are working.', true);
  if req is null then raise exception 'Save a bot token and chat id first.'; end if;
  return req;
end $$;

create or replace function public.admin_telegram_result(p_request bigint) returns jsonb
language plpgsql stable security definer set search_path = public, net as $$
declare r record;
begin
  if not public.can_manage_platform_settings() then raise exception 'Settings access required.' using errcode = '42501'; end if;
  select status_code, error_msg, left(content::text, 300) as content into r from net._http_response where id = p_request;
  if not found then return jsonb_build_object('done', false); end if;
  return jsonb_build_object('done', true, 'status', r.status_code, 'error', r.error_msg, 'detail', r.content);
end $$;

revoke all on function public.admin_get_notification_settings() from public;
revoke all on function public.admin_set_telegram(text, text, boolean, text[]) from public;
revoke all on function public.admin_test_telegram() from public;
revoke all on function public.admin_telegram_result(bigint) from public;
grant execute on function public.admin_get_notification_settings() to authenticated;
grant execute on function public.admin_set_telegram(text, text, boolean, text[]) to authenticated;
grant execute on function public.admin_test_telegram() to authenticated;
grant execute on function public.admin_telegram_result(bigint) to authenticated;

-- Event triggers: fixed text, no personal data.
create or replace function public.trg_alert_admins() returns trigger language plpgsql security definer set search_path = public as $$
declare base text; label text;
begin
  select app_url into base from public.platform_settings where id = 1;
  if tg_table_name = 'data_requests' then
    perform public.notify_admins('data_request', 'PROFILE: new data request (' || replace(new.kind, '_', ' ') || '). ' || base || '/admin/data-requests');
  elsif tg_table_name = 'disputes' then
    perform public.notify_admins('dispute', 'PROFILE: new dispute filed. ' || base || '/admin/disputes');
  elsif tg_table_name = 'kyc_submissions' then
    perform public.notify_admins('kyc', 'PROFILE: new identity check waiting for review. ' || base || '/admin/kyc');
  elsif tg_table_name = 'verification_requests' then
    if new.issuer_email is null then
      perform public.notify_admins('verification_unrouted', 'PROFILE: a verification request needs staff (no institution on PROFILE). ' || base || '/admin/verification-requests');
    end if;
  elsif tg_table_name = 'accounts' then
    if new.account_type = 'organisation' and new.registry_level = 'user_submitted' then
      perform public.notify_admins('org_claim', 'PROFILE: an organisation is waiting for verification. ' || base || '/admin/verification');
    end if;
  end if;
  return new;
exception when others then
  return new;
end $$;

drop trigger if exists trg_alert_data_requests on public.data_requests;
create trigger trg_alert_data_requests after insert on public.data_requests for each row execute function public.trg_alert_admins();
drop trigger if exists trg_alert_disputes on public.disputes;
create trigger trg_alert_disputes after insert on public.disputes for each row execute function public.trg_alert_admins();
drop trigger if exists trg_alert_kyc on public.kyc_submissions;
create trigger trg_alert_kyc after insert on public.kyc_submissions for each row execute function public.trg_alert_admins();
drop trigger if exists trg_alert_vr on public.verification_requests;
create trigger trg_alert_vr after insert on public.verification_requests for each row execute function public.trg_alert_admins();
drop trigger if exists trg_alert_accounts on public.accounts;
create trigger trg_alert_accounts after insert on public.accounts for each row execute function public.trg_alert_admins();
