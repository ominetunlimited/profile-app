-- The last browser-only stores, moved to the server with row-level security.
-- Person-to-person records (CV requests, mentorship, tag requests, credits, passport shares) now reach the other person;
-- content and commerce (blog/news, marketplace items, creator templates, schemas) are shared; feedback reaches staff.
-- Every change a second person must agree to (a request response, a dispute, a removal) goes through a SECURITY DEFINER
-- function so neither side can edit the other's record.

create or replace function public.can_manage_content() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins pa where pa.id = auth.uid() and pa.status = 'active'
                 and pa.role in ('super_administrator', 'admin', 'moderator', 'customer_support'))
$$;

-- ---------------------------------------------------------------- display-name privacy (on the account itself)
alter table public.accounts add column if not exists legal_name_visibility text not null default 'public'
  check (legal_name_visibility in ('public', 'private'));

-- ---------------------------------------------------------------- CV requests
create table if not exists public.cv_requests (
  id uuid primary key default gen_random_uuid(),
  requester_email text not null references public.accounts(email) on delete cascade,
  requester_name text not null,
  target_email text not null references public.accounts(email) on delete cascade,
  target_username text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (requester_email, target_email)
);
alter table public.cv_requests enable row level security;
drop policy if exists cv_requests_select on public.cv_requests;
create policy cv_requests_select on public.cv_requests for select using (requester_email = public.current_account_email() or target_email = public.current_account_email() or public.can_review_data_requests());
drop policy if exists cv_requests_insert on public.cv_requests;
create policy cv_requests_insert on public.cv_requests for insert with check (
  requester_email = public.current_account_email() and requester_email <> target_email and status = 'pending' and responded_at is null and public.can_see_account(target_email)
);
create or replace function public.respond_cv_request(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('approved', 'denied') then raise exception 'Invalid response.'; end if;
  update public.cv_requests set status = p_status, responded_at = now() where id = p_id and target_email = public.current_account_email() and status = 'pending';
  if not found then raise exception 'Request not found.' using errcode = '42501'; end if;
end $$;
revoke all on function public.respond_cv_request(uuid, text) from public;
grant execute on function public.respond_cv_request(uuid, text) to authenticated;

-- ---------------------------------------------------------------- mentorship
create table if not exists public.mentorship_prefs (
  owner_email text primary key references public.accounts(email) on delete cascade,
  open_to_mentoring boolean not null default false,
  mentee_capacity integer not null default 0 check (mentee_capacity between 0 and 200)
);
alter table public.mentorship_prefs enable row level security;
drop policy if exists mentorship_prefs_select on public.mentorship_prefs;
create policy mentorship_prefs_select on public.mentorship_prefs for select using (owner_email = public.current_account_email() or public.can_see_account(owner_email));
drop policy if exists mentorship_prefs_insert on public.mentorship_prefs;
create policy mentorship_prefs_insert on public.mentorship_prefs for insert with check (owner_email = public.current_account_email());
drop policy if exists mentorship_prefs_update on public.mentorship_prefs;
create policy mentorship_prefs_update on public.mentorship_prefs for update using (owner_email = public.current_account_email()) with check (owner_email = public.current_account_email());

create table if not exists public.mentee_requests (
  id uuid primary key default gen_random_uuid(),
  mentee_email text not null references public.accounts(email) on delete cascade,
  mentor_email text not null references public.accounts(email) on delete cascade,
  message text not null default '' check (length(message) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (mentee_email, mentor_email)
);
alter table public.mentee_requests enable row level security;
drop policy if exists mentee_requests_select on public.mentee_requests;
create policy mentee_requests_select on public.mentee_requests for select using (mentee_email = public.current_account_email() or mentor_email = public.current_account_email());
drop policy if exists mentee_requests_insert on public.mentee_requests;
create policy mentee_requests_insert on public.mentee_requests for insert with check (
  mentee_email = public.current_account_email() and mentee_email <> mentor_email and status = 'pending' and responded_at is null and public.can_see_account(mentor_email)
);
create or replace function public.respond_mentee_request(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('accepted', 'declined') then raise exception 'Invalid response.'; end if;
  update public.mentee_requests set status = p_status, responded_at = now() where id = p_id and mentor_email = public.current_account_email() and status = 'pending';
  if not found then raise exception 'Request not found.' using errcode = '42501'; end if;
end $$;
revoke all on function public.respond_mentee_request(uuid, text) from public;
grant execute on function public.respond_mentee_request(uuid, text) to authenticated;

-- ---------------------------------------------------------------- tag requests ("I was part of this")
create table if not exists public.self_tags (
  id uuid primary key default gen_random_uuid(),
  requester_email text not null references public.accounts(email) on delete cascade,
  requester_name text not null,
  activity_id uuid not null references public.activities(id) on delete cascade,
  activity_owner_email text not null references public.accounts(email) on delete cascade,
  activity_title text not null default '',
  role text not null default '',
  status text not null default 'requested' check (status in ('requested', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  unique (requester_email, activity_id)
);
alter table public.self_tags enable row level security;
drop policy if exists self_tags_select on public.self_tags;
create policy self_tags_select on public.self_tags for select using (
  requester_email = public.current_account_email() or activity_owner_email = public.current_account_email()
  or (status = 'approved' and public.can_see_account(requester_email))
);
drop policy if exists self_tags_insert on public.self_tags;
create policy self_tags_insert on public.self_tags for insert with check (
  requester_email = public.current_account_email() and status = 'requested' and requester_email <> activity_owner_email
  and exists (select 1 from public.activities a where a.id = activity_id and a.owner_email = activity_owner_email)
);
create or replace function public.respond_self_tag(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('approved', 'rejected') then raise exception 'Invalid response.'; end if;
  update public.self_tags set status = p_status where id = p_id and activity_owner_email = public.current_account_email() and status = 'requested';
  if not found then raise exception 'Request not found.' using errcode = '42501'; end if;
end $$;
revoke all on function public.respond_self_tag(uuid, text) from public;
grant execute on function public.respond_self_tag(uuid, text) to authenticated;

-- ---------------------------------------------------------------- credits (collaborators, organisations, tools)
create table if not exists public.attributions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  activity_owner_email text not null references public.accounts(email) on delete cascade,
  subject_type text not null check (subject_type in ('person', 'organisation', 'provider', 'tool', 'project')),
  subject_email text,
  subject_name text not null,
  role text not null default '',
  tagged_by text not null,
  status text not null default 'active' check (status in ('active', 'disputed', 'removed')),
  created_at timestamptz not null default now()
);
create index if not exists attributions_activity_idx on public.attributions (activity_id);
alter table public.attributions enable row level security;
drop policy if exists attributions_select on public.attributions;
create policy attributions_select on public.attributions for select using (
  activity_owner_email = public.current_account_email() or subject_email = public.current_account_email()
  or exists (select 1 from public.activities a where a.id = activity_id)
);
drop policy if exists attributions_insert on public.attributions;
create policy attributions_insert on public.attributions for insert with check (
  tagged_by = public.current_account_email() and activity_owner_email = public.current_account_email() and status = 'active'
  and exists (select 1 from public.activities a where a.id = activity_id and a.owner_email = public.current_account_email())
);
create or replace function public.dispute_attribution(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.attributions set status = 'disputed' where id = p_id and subject_email = public.current_account_email() and status = 'active';
  if not found then raise exception 'Credit not found.' using errcode = '42501'; end if;
end $$;
create or replace function public.remove_attribution(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.attributions set status = 'removed'
   where id = p_id and status <> 'removed' and (tagged_by = public.current_account_email() or subject_email = public.current_account_email());
  if not found then raise exception 'Credit not found.' using errcode = '42501'; end if;
end $$;
revoke all on function public.dispute_attribution(uuid) from public;
revoke all on function public.remove_attribution(uuid) from public;
grant execute on function public.dispute_attribution(uuid) to authenticated;
grant execute on function public.remove_attribution(uuid) to authenticated;

-- ---------------------------------------------------------------- Trust Passport shares
create table if not exists public.trust_passport_shares (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null references public.accounts(email) on delete cascade,
  shared_with text not null check (length(trim(shared_with)) between 1 and 200),
  access_expiry text not null check (access_expiry in ('30_days', '90_days', 'until_revoked')),
  shared_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked boolean not null default false
);
alter table public.trust_passport_shares enable row level security;
drop policy if exists passport_shares_all_own on public.trust_passport_shares;
create policy passport_shares_all_own on public.trust_passport_shares for all using (owner_email = public.current_account_email()) with check (owner_email = public.current_account_email());

create table if not exists public.passport_access_log (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.trust_passport_shares(id) on delete cascade,
  opened_at timestamptz not null default now()
);
alter table public.passport_access_log enable row level security;
drop policy if exists passport_log_select on public.passport_access_log;
create policy passport_log_select on public.passport_access_log for select using (
  exists (select 1 from public.trust_passport_shares s where s.id = share_id and s.owner_email = public.current_account_email())
);

-- The recipient opens a passport with the link (the share id is the secret). Only confirmed facts are returned.
create or replace function public.get_shared_passport(p_share uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s public.trust_passport_shares%rowtype; a public.accounts%rowtype; result jsonb;
begin
  select * into s from public.trust_passport_shares where id = p_share;
  if s.id is null or s.revoked or (s.expires_at is not null and s.expires_at < now()) then
    raise exception 'This passport link is no longer valid.' using errcode = 'P0002';
  end if;
  select * into a from public.accounts where email = s.owner_email;
  insert into public.passport_access_log (share_id) values (s.id);
  select jsonb_build_object(
    'name', coalesce(case when a.legal_name_visibility = 'private' then a.preferred_display_name end, a.legal_name),
    'headline', a.headline,
    'country', a.country,
    'shared_with', s.shared_with,
    'shared_at', s.shared_at,
    'expires_at', s.expires_at,
    'identity_verified', exists (select 1 from public.kyc_submissions k where k.user_email = s.owner_email and k.status = 'approved'),
    'confirmed_records', coalesce((select jsonb_agg(jsonb_build_object('record', v.module_name, 'confirmed_by', v.issuer_name, 'confirmed_at', v.decided_at) order by v.decided_at desc)
                                     from public.verification_requests v where v.owner_email = s.owner_email and v.status = 'verified'), '[]'::jsonb),
    'recorded_activities', (select count(*) from public.activities x where x.owner_email = s.owner_email and x.visibility = 'public')
  ) into result;
  return result;
end $$;
revoke all on function public.get_shared_passport(uuid) from public;
grant execute on function public.get_shared_passport(uuid) to anon, authenticated;

-- ---------------------------------------------------------------- feedback to staff
create table if not exists public.feedback_items (
  id uuid primary key default gen_random_uuid(),
  user_email text not null references public.accounts(email) on delete cascade,
  category text not null check (category in ('bug', 'idea', 'praise', 'other')),
  message text not null check (length(trim(message)) between 3 and 4000),
  status text not null default 'new' check (status in ('new', 'seen', 'resolved')),
  created_at timestamptz not null default now()
);
alter table public.feedback_items enable row level security;
drop policy if exists feedback_select on public.feedback_items;
create policy feedback_select on public.feedback_items for select using (user_email = public.current_account_email() or public.can_review_data_requests());
drop policy if exists feedback_insert on public.feedback_items;
create policy feedback_insert on public.feedback_items for insert with check (user_email = public.current_account_email() and status = 'new');
create or replace function public.staff_set_feedback_status(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.can_review_data_requests() then raise exception 'Feedback review access required.' using errcode = '42501'; end if;
  if p_status not in ('new', 'seen', 'resolved') then raise exception 'Invalid status.'; end if;
  update public.feedback_items set status = p_status where id = p_id;
end $$;
revoke all on function public.staff_set_feedback_status(uuid, text) from public;
grant execute on function public.staff_set_feedback_status(uuid, text) to authenticated;

create or replace function public.trg_alert_feedback() returns trigger language plpgsql security definer set search_path = public as $$
declare base text;
begin
  select app_url into base from public.platform_settings where id = 1;
  perform public.notify_admins('feedback', 'PROFILE: new feedback (' || new.category || '). ' || base || '/admin/feedback');
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists trg_alert_feedback on public.feedback_items;
create trigger trg_alert_feedback after insert on public.feedback_items for each row execute function public.trg_alert_feedback();

-- ---------------------------------------------------------------- blog / news / announcements
create table if not exists public.content_posts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('news', 'blog', 'announcement')),
  title text not null check (length(trim(title)) > 0),
  body text not null default '',
  cover_image text not null default '',
  tags text[] not null default '{}',
  audience text not null default 'public' check (audience in ('public', 'individual', 'organisation', 'all_signed_in')),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published')),
  scheduled_for timestamptz,
  published_at timestamptz,
  author_id text not null default '',
  author_label text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.content_posts enable row level security;
drop policy if exists content_select on public.content_posts;
create policy content_select on public.content_posts for select using (
  public.can_manage_content()
  or (
    (status = 'published' or (status = 'scheduled' and scheduled_for <= now()))
    and (
      audience = 'public'
      or (audience = 'all_signed_in' and auth.uid() is not null)
      or (audience = 'individual' and exists (select 1 from public.accounts a where a.id = auth.uid() and a.account_type = 'individual'))
      or (audience = 'organisation' and exists (select 1 from public.accounts a where a.id = auth.uid() and a.account_type = 'organisation'))
    )
  )
);
drop policy if exists content_write on public.content_posts;
create policy content_write on public.content_posts for all using (public.can_manage_content()) with check (public.can_manage_content());

-- ---------------------------------------------------------------- marketplace items and creator templates
create table if not exists public.store_items (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null references public.accounts(email) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  short_description text not null default '',
  full_description text not null default '',
  category text not null default '',
  type text not null check (type in ('digital_product', 'service')),
  price_label text not null default '',
  cover_image_data_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);
alter table public.store_items enable row level security;
drop policy if exists store_items_select on public.store_items;
create policy store_items_select on public.store_items for select using (owner_email = public.current_account_email() or (status = 'published' and public.can_see_account(owner_email)));
drop policy if exists store_items_write on public.store_items;
create policy store_items_write on public.store_items for all using (owner_email = public.current_account_email()) with check (owner_email = public.current_account_email());

create table if not exists public.creator_templates (
  id uuid primary key default gen_random_uuid(),
  creator_email text not null references public.accounts(email) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  type text not null check (type in ('cv', 'portfolio')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  price numeric not null default 0 check (price >= 0),
  rating numeric,
  uses integer not null default 0,
  published_at timestamptz,
  earnings numeric not null default 0
);
alter table public.creator_templates enable row level security;
drop policy if exists creator_templates_select on public.creator_templates;
create policy creator_templates_select on public.creator_templates for select using (creator_email = public.current_account_email() or (status = 'published' and public.can_see_account(creator_email)));
drop policy if exists creator_templates_insert on public.creator_templates;
create policy creator_templates_insert on public.creator_templates for insert with check (
  creator_email = public.current_account_email() and status = 'draft' and price = 0 and rating is null and uses = 0 and earnings = 0 and published_at is null
);
-- Earnings, uses and ratings are never client-writable; publishing goes through a function.
create or replace function public.publish_creator_template(p_id uuid, p_price numeric) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_price < 0 then raise exception 'Price cannot be negative.'; end if;
  update public.creator_templates set status = 'published', price = p_price, published_at = now() where id = p_id and creator_email = public.current_account_email();
  if not found then raise exception 'Template not found.' using errcode = '42501'; end if;
end $$;
revoke all on function public.publish_creator_template(uuid, numeric) from public;
grant execute on function public.publish_creator_template(uuid, numeric) to authenticated;

create table if not exists public.commerce_settings (
  owner_email text primary key references public.accounts(email) on delete cascade,
  store_activated boolean not null default false,
  selling_activated boolean not null default false
);
alter table public.commerce_settings enable row level security;
drop policy if exists commerce_settings_own on public.commerce_settings;
create policy commerce_settings_own on public.commerce_settings for all using (owner_email = public.current_account_email()) with check (owner_email = public.current_account_email());

-- ---------------------------------------------------------------- tool references, organisation portfolio, verification schemas
create table if not exists public.provider_references (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null,
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_email text not null references public.accounts(email) on delete cascade,
  created_at timestamptz not null default now(),
  unique (tool_id, activity_id, user_email)
);
alter table public.provider_references enable row level security;
drop policy if exists provider_refs_select on public.provider_references;
create policy provider_refs_select on public.provider_references for select using (user_email = public.current_account_email() or public.can_see_account(user_email));
drop policy if exists provider_refs_insert on public.provider_references;
create policy provider_refs_insert on public.provider_references for insert with check (
  user_email = public.current_account_email() and exists (select 1 from public.activities a where a.id = activity_id and a.owner_email = public.current_account_email())
);

create table if not exists public.org_portfolio_config (
  owner_email text primary key references public.accounts(email) on delete cascade,
  enabled_sections jsonb not null default '{}'::jsonb
);
alter table public.org_portfolio_config enable row level security;
drop policy if exists org_portfolio_select on public.org_portfolio_config;
create policy org_portfolio_select on public.org_portfolio_config for select using (owner_email = public.current_account_email() or public.can_see_account(owner_email));
drop policy if exists org_portfolio_write on public.org_portfolio_config;
create policy org_portfolio_write on public.org_portfolio_config for all using (public.can_act_for_org(owner_email, array['super_admin', 'admin'])) with check (public.can_act_for_org(owner_email, array['super_admin', 'admin']));

create table if not exists public.verification_schemas (
  id uuid primary key default gen_random_uuid(),
  institution_email text not null references public.accounts(email) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  version text not null default '1.0',
  verification_type text not null,
  fields jsonb not null default '[]'::jsonb,
  evidence_required text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  created_at timestamptz not null default now()
);
alter table public.verification_schemas enable row level security;
drop policy if exists vschemas_select on public.verification_schemas;
create policy vschemas_select on public.verification_schemas for select using (
  status = 'published' or public.can_act_for_org(institution_email, array['super_admin', 'admin', 'credential_manager', 'compliance_officer', 'verification_officer'])
);
drop policy if exists vschemas_write on public.verification_schemas;
create policy vschemas_write on public.verification_schemas for all using (public.can_act_for_org(institution_email, array['super_admin', 'admin', 'credential_manager']))
  with check (public.can_act_for_org(institution_email, array['super_admin', 'admin', 'credential_manager']));

do $$
declare t text;
begin
  foreach t in array array['cv_requests', 'mentorship_prefs', 'mentee_requests', 'self_tags', 'attributions', 'trust_passport_shares', 'feedback_items', 'content_posts', 'store_items', 'creator_templates', 'commerce_settings', 'provider_references', 'org_portfolio_config', 'verification_schemas'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
