-- Email delivery, configured from the Admin Centre. The provider is Resend (https://resend.com): the API key is kept encrypted in
-- Supabase Vault and is never readable from the browser; the from-address must belong to a domain verified with the provider.
-- Emails are fixed text. Today they carry organisation staff invitations.

create table if not exists public.email_settings (
  id integer primary key default 1 check (id = 1),
  enabled boolean not null default false,
  from_address text,
  from_name text not null default 'PROFILE',
  reply_to text,
  key_secret_id uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
insert into public.email_settings (id) values (1) on conflict (id) do nothing;
alter table public.email_settings enable row level security;   -- no policies: only the functions below touch it

-- One row per email handed to the provider, so staff can see whether it was accepted.
create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  kind text not null,
  subject text not null,
  request_id bigint,
  created_at timestamptz not null default now()
);
alter table public.email_log enable row level security;

create or replace function public.admin_get_email_settings() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare s public.email_settings%rowtype;
begin
  if not public.can_manage_platform_settings() then raise exception 'Settings access required.' using errcode = '42501'; end if;
  select * into s from public.email_settings where id = 1;
  return jsonb_build_object('enabled', s.enabled, 'from_address', s.from_address, 'from_name', s.from_name, 'reply_to', s.reply_to, 'key_set', s.key_secret_id is not null);
end $$;

create or replace function public.admin_set_email(p_key text, p_from_address text, p_from_name text, p_reply_to text, p_enabled boolean) returns void
language plpgsql security definer set search_path = public, vault as $$
declare s public.email_settings%rowtype; sid uuid;
begin
  if not exists (select 1 from public.platform_admins pa where pa.id = auth.uid() and pa.status = 'active' and pa.role = 'super_administrator') then
    raise exception 'Only a super administrator can change email delivery.' using errcode = '42501';
  end if;
  if coalesce(trim(p_from_address), '') <> '' and trim(p_from_address) !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'That from-address is not a valid email.'; end if;
  if coalesce(trim(p_reply_to), '') <> '' and trim(p_reply_to) !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'That reply-to address is not a valid email.'; end if;
  select * into s from public.email_settings where id = 1;
  sid := s.key_secret_id;
  if p_key is not null and length(trim(p_key)) > 0 then
    if sid is null then sid := vault.create_secret(trim(p_key), 'email_provider_key', 'Email provider API key');
    else perform vault.update_secret(sid, trim(p_key), 'email_provider_key', 'Email provider API key'); end if;
  end if;
  if p_enabled and (sid is null or coalesce(trim(p_from_address), '') = '') then
    raise exception 'Add an API key and a from-address before turning email delivery on.';
  end if;
  update public.email_settings
     set enabled = p_enabled, from_address = nullif(trim(p_from_address), ''), from_name = coalesce(nullif(trim(p_from_name), ''), 'PROFILE'),
         reply_to = nullif(trim(p_reply_to), ''), key_secret_id = sid, updated_at = now(), updated_by = auth.uid()
   where id = 1;
end $$;

-- Internal sender. Returns the provider request id, or null when delivery is off.
create or replace function public.email_send(p_to text, p_subject text, p_text text, p_kind text, p_force boolean default false) returns bigint
language plpgsql security definer set search_path = public, vault, net as $$
declare s public.email_settings%rowtype; k text; req bigint; body jsonb;
begin
  select * into s from public.email_settings where id = 1;
  if s.key_secret_id is null or coalesce(s.from_address, '') = '' then return null; end if;
  if not s.enabled and not p_force then return null; end if;
  select decrypted_secret into k from vault.decrypted_secrets where id = s.key_secret_id;
  if k is null then return null; end if;
  body := jsonb_build_object('from', s.from_name || ' <' || s.from_address || '>', 'to', jsonb_build_array(p_to), 'subject', p_subject, 'text', p_text);
  if s.reply_to is not null then body := body || jsonb_build_object('reply_to', s.reply_to); end if;
  req := net.http_post(url := 'https://api.resend.com/emails', body := body,
                       headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || k));
  insert into public.email_log (to_email, kind, subject, request_id) values (lower(p_to), p_kind, p_subject, req);
  return req;
exception when others then
  return null;  -- an email failing must never block the action that caused it
end $$;
revoke all on function public.email_send(text, text, text, text, boolean) from public, anon, authenticated;

-- Is email delivery switched on? (Any signed-in account may ask, so screens can say honestly whether an invitation was emailed.)
create or replace function public.email_delivery_on() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select enabled and key_secret_id is not null and from_address is not null from public.email_settings where id = 1), false)
$$;
revoke all on function public.email_delivery_on() from public;
grant execute on function public.email_delivery_on() to authenticated;

create or replace function public.admin_test_email(p_to text) returns bigint
language plpgsql security definer set search_path = public as $$
declare req bigint;
begin
  if not exists (select 1 from public.platform_admins pa where pa.id = auth.uid() and pa.status = 'active' and pa.role = 'super_administrator') then
    raise exception 'Only a super administrator can send a test email.' using errcode = '42501';
  end if;
  if coalesce(trim(p_to), '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Enter a valid email address to send the test to.'; end if;
  req := public.email_send(trim(p_to), 'PROFILE test email', 'This is a test email from the PROFILE Admin Centre. Email delivery is working.', 'test', true);
  if req is null then raise exception 'Save an API key and a from-address first.'; end if;
  return req;
end $$;

create or replace function public.admin_email_result(p_request bigint) returns jsonb
language plpgsql stable security definer set search_path = public, net as $$
declare r record;
begin
  if not public.can_manage_platform_settings() then raise exception 'Settings access required.' using errcode = '42501'; end if;
  select status_code, error_msg, left(content::text, 300) as content into r from net._http_response where id = p_request;
  if not found then return jsonb_build_object('done', false); end if;
  return jsonb_build_object('done', true, 'status', r.status_code, 'error', r.error_msg, 'detail', r.content);
end $$;

-- Recent emails and whether the provider accepted them.
create or replace function public.admin_email_log() returns jsonb
language plpgsql stable security definer set search_path = public, net as $$
begin
  if not public.can_manage_platform_settings() then raise exception 'Settings access required.' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('to', l.to_email, 'kind', l.kind, 'subject', l.subject, 'at', l.created_at,
                     'status', (select r.status_code from net._http_response r where r.id = l.request_id)) order by l.created_at desc)
                   from (select * from public.email_log order by created_at desc limit 25) l), '[]'::jsonb);
end $$;

revoke all on function public.admin_get_email_settings() from public;
revoke all on function public.admin_set_email(text, text, text, text, boolean) from public;
revoke all on function public.admin_test_email(text) from public;
revoke all on function public.admin_email_result(bigint) from public;
revoke all on function public.admin_email_log() from public;
grant execute on function public.admin_get_email_settings() to authenticated;
grant execute on function public.admin_set_email(text, text, text, text, boolean) to authenticated;
grant execute on function public.admin_test_email(text) to authenticated;
grant execute on function public.admin_email_result(bigint) to authenticated;
grant execute on function public.admin_email_log() to authenticated;

-- Staff invitations also go out by email (people without an account yet get a sign-up link).
do $$
declare def text;
begin
  select pg_get_functiondef('public.org_invite_staff(text[], text)'::regprocedure) into def;
  def := replace(def, '    invited := invited || cleaned;',
$r$    invited := invited || cleaned;
    perform public.email_send(cleaned, org.legal_name || ' invited you to join their PROFILE workspace',
      org.legal_name || ' has invited you to join their workspace on PROFILE as ' || replace(p_role, '_', ' ') || '.' || E'\n\n' ||
      case when exists (select 1 from public.accounts where email = cleaned)
           then 'Sign in and open Workspaces to accept or decline: ' || (select app_url from public.platform_settings where id = 1) || '/workspaces'
           else 'Create a PROFILE account with this email address, then open Workspaces to accept: ' || (select app_url from public.platform_settings where id = 1) || '/workspaces' end ||
      E'\n\nIf you were not expecting this, you can ignore the email and nothing will happen.', 'org_staff_invite');$r$);
  execute def;
end $$;
