-- Phase 4 — real communities & groups (Master Prompt §21.2 GROUP_TYPES, §50.6).
--
-- Roles: owner > admin > moderator > member. Every privileged action goes
-- through a SECURITY DEFINER function that re-checks the caller's role in
-- Postgres; there are no client write policies on members/requests/invites/
-- audit, so a client cannot grant itself anything. Content is RLS-gated by
-- membership + privacy. Platform staff (platform_admins) keep oversight.

-- ----------------------------------------------------------------- helpers
create or replace function public.is_platform_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins pa where pa.id = auth.uid() and pa.status = 'active')
$$;

create or replace function public.role_rank(r text) returns integer
language sql immutable as $$ select case r when 'owner' then 4 when 'admin' then 3 when 'moderator' then 2 when 'member' then 1 else 0 end $$;

-- ------------------------------------------------------------------ tables
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null check (char_length(name) between 3 and 80),
  kind text not null default 'community' check (kind in ('community', 'group')),
  type text not null check (type in ('Guild', 'Trade Association', 'Industry Network', 'Research Group', 'Learning Cohort', 'Mentorship Circle', 'Professional Community')),
  description text not null default '' check (char_length(description) <= 1000),
  rules text not null default '' check (char_length(rules) <= 2000),
  privacy text not null default 'public' check (privacy in ('public', 'private', 'invite_only')),
  owner_email text not null references public.accounts(email) on delete cascade,
  avatar_path text,
  cover_path text,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);
create index if not exists communities_owner_idx on public.communities (owner_email);

create table if not exists public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  member_email text not null references public.accounts(email) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'moderator', 'member')),
  status text not null default 'active' check (status in ('active', 'banned')),
  muted_until timestamptz,
  joined_at timestamptz not null default now(),
  primary key (community_id, member_email)
);
create index if not exists community_members_email_idx on public.community_members (member_email);

create table if not exists public.community_join_requests (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  requester_email text not null references public.accounts(email) on delete cascade,
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists community_join_requests_pending_uniq on public.community_join_requests (community_id, requester_email) where status = 'pending';

create table if not exists public.community_invites (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  invitee_email text not null references public.accounts(email) on delete cascade,
  invited_by text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);
create unique index if not exists community_invites_pending_uniq on public.community_invites (community_id, invitee_email) where status = 'pending';

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_email text not null references public.accounts(email) on delete cascade,
  kind text not null default 'discussion' check (kind in ('discussion', 'announcement')),
  body text not null check (char_length(body) between 1 and 5000),
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by text
);
create index if not exists community_posts_feed_idx on public.community_posts (community_id, pinned desc, created_at desc);

create table if not exists public.community_audit_log (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  actor text not null,
  action text not null,
  target text,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists community_audit_idx on public.community_audit_log (community_id, created_at desc);

create table if not exists public.community_appeals (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  member_email text not null references public.accounts(email) on delete cascade,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by text,
  created_at timestamptz not null default now()
);
create unique index if not exists community_appeals_pending_uniq on public.community_appeals (community_id, member_email) where status = 'pending';

alter table public.content_reports add column if not exists community_id uuid references public.communities(id) on delete cascade;

-- ------------------------------------------------------- role/visibility fns
create or replace function public.community_role(cid uuid) returns text
language sql stable security definer set search_path = public as $$
  select m.role from public.community_members m
  where m.community_id = cid and m.member_email = public.current_account_email() and m.status = 'active'
$$;

create or replace function public.is_community_mod(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.community_role(cid) in ('owner', 'admin', 'moderator'), false)
$$;

create or replace function public.community_can_post(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.community_members m join public.communities c on c.id = m.community_id
    where m.community_id = cid and m.member_email = public.current_account_email() and m.status = 'active'
      and (m.muted_until is null or m.muted_until < now()) and c.status = 'active'
  )
$$;

create or replace function public.can_read_community(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_platform_staff() or (
    exists (select 1 from public.communities c where c.id = cid and c.status = 'active'
            and (c.privacy = 'public' or public.community_role(cid) is not null))
    and not exists (select 1 from public.community_members b where b.community_id = cid
                    and b.member_email = public.current_account_email() and b.status = 'banned')
  )
$$;

-- ---------------------------------------------------------------------- RLS
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.community_join_requests enable row level security;
alter table public.community_invites enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_audit_log enable row level security;
alter table public.community_appeals enable row level security;

drop policy if exists communities_select on public.communities;
create policy communities_select on public.communities for select using (
  public.is_platform_staff()
  or owner_email = public.current_account_email()
  or (status = 'active' and (
    privacy in ('public', 'private')
    or public.community_role(id) is not null
    or exists (select 1 from public.community_invites i where i.community_id = communities.id and i.invitee_email = public.current_account_email() and i.status = 'pending')
  ))
);
drop policy if exists communities_update_settings on public.communities;
create policy communities_update_settings on public.communities for update
  using (public.community_role(id) in ('owner', 'admin')) with check (public.community_role(id) in ('owner', 'admin'));

-- Settings editors may change identity/rules/privacy, never ownership/status/slug.
create or replace function public.communities_guard_update() returns trigger language plpgsql as $$
begin
  if public.is_platform_staff() or current_setting('app.community_internal', true) = 'on' then return new; end if;
  if new.id is distinct from old.id or new.slug is distinct from old.slug or new.kind is distinct from old.kind
     or new.owner_email is distinct from old.owner_email or new.status is distinct from old.status or new.created_at is distinct from old.created_at then
    raise exception 'ownership, status and slug can only change through their dedicated actions';
  end if;
  return new;
end $$;
drop trigger if exists communities_guard_update on public.communities;
create trigger communities_guard_update before update on public.communities for each row execute function public.communities_guard_update();

drop policy if exists community_members_select on public.community_members;
create policy community_members_select on public.community_members for select using (
  member_email = public.current_account_email() or public.community_role(community_id) is not null or public.is_platform_staff()
);

drop policy if exists community_join_requests_select on public.community_join_requests;
create policy community_join_requests_select on public.community_join_requests for select using (
  requester_email = public.current_account_email() or public.is_community_mod(community_id) or public.is_platform_staff()
);
drop policy if exists community_invites_select on public.community_invites;
create policy community_invites_select on public.community_invites for select using (
  invitee_email = public.current_account_email() or public.is_community_mod(community_id) or public.is_platform_staff()
);
drop policy if exists community_audit_select on public.community_audit_log;
create policy community_audit_select on public.community_audit_log for select using (public.is_community_mod(community_id) or public.is_platform_staff());
drop policy if exists community_appeals_select on public.community_appeals;
create policy community_appeals_select on public.community_appeals for select using (
  member_email = public.current_account_email() or public.is_community_mod(community_id) or public.is_platform_staff()
);

drop policy if exists community_posts_select on public.community_posts;
create policy community_posts_select on public.community_posts for select using (
  public.can_read_community(community_id)
  and (deleted_at is null or author_email = public.current_account_email() or public.is_community_mod(community_id) or public.is_platform_staff())
);
drop policy if exists community_posts_insert on public.community_posts;
create policy community_posts_insert on public.community_posts for insert with check (
  author_email = public.current_account_email()
  and public.community_can_post(community_id)
  and (kind = 'discussion' or public.is_community_mod(community_id))
);

-- Reports: community moderators can read/handle reports raised inside their community.
drop policy if exists content_reports_select_community_mod on public.content_reports;
create policy content_reports_select_community_mod on public.content_reports for select using (community_id is not null and public.is_community_mod(community_id));
drop policy if exists content_reports_update_community_mod on public.content_reports;
create policy content_reports_update_community_mod on public.content_reports for update using (community_id is not null and public.is_community_mod(community_id));

-- ------------------------------- social actions on community posts (Phase 2)
alter table public.comments drop constraint if exists comments_target_type_check;
alter table public.comments add constraint comments_target_type_check check (target_type in ('activity', 'job', 'advert', 'repost', 'community_post'));
alter table public.reactions drop constraint if exists reactions_target_type_check;
alter table public.reactions add constraint reactions_target_type_check check (target_type in ('activity', 'comment', 'job', 'advert', 'repost', 'community_post'));
alter table public.bookmarks drop constraint if exists bookmarks_target_type_check;
alter table public.bookmarks add constraint bookmarks_target_type_check check (target_type in ('activity', 'job', 'advert', 'repost', 'community_post'));
alter table public.endorsements drop constraint if exists endorsements_target_type_check;
alter table public.endorsements add constraint endorsements_target_type_check check (target_type in ('activity', 'job', 'advert', 'repost', 'community_post'));

create or replace function public.can_view_target(t text, tid uuid)
returns boolean language sql stable set search_path = public as $$
  select case t
    when 'activity' then exists (select 1 from public.activities a where a.id = tid)
    when 'job' then exists (select 1 from public.jobs j where j.id = tid)
    when 'advert' then exists (select 1 from public.ad_campaigns c where c.id = tid)
    when 'repost' then exists (select 1 from public.reposts r where r.id = tid)
    when 'comment' then exists (select 1 from public.comments c where c.id = tid)
    when 'community_post' then exists (select 1 from public.community_posts p where p.id = tid)
    else false
  end
$$;

-- Only members (not mere viewers of a public community) may interact with its posts.
create or replace function public.can_interact_target(t text, tid uuid) returns boolean
language sql stable set search_path = public as $$
  select public.can_view_target(t, tid) and (
    t <> 'community_post' or exists (select 1 from public.community_posts p where p.id = tid and public.community_can_post(p.community_id))
  )
$$;
drop policy if exists comments_insert_self on public.comments;
create policy comments_insert_self on public.comments for insert with check (author_email = public.current_account_email() and public.can_interact_target(target_type, target_id));
drop policy if exists reactions_upsert_self on public.reactions;
create policy reactions_upsert_self on public.reactions for insert with check (user_email = public.current_account_email() and public.can_interact_target(target_type, target_id));
drop policy if exists endorsements_insert_self on public.endorsements;
create policy endorsements_insert_self on public.endorsements for insert with check (user_email = public.current_account_email() and public.can_interact_target(target_type, target_id));

-- Notification helpers learn the new target types.
create or replace function public.target_title(t text, tid text) returns text
language plpgsql stable security definer set search_path = public as $$
declare r text;
begin
  if tid is null then return null; end if;
  if t = 'activity' then select title into r from activities where id::text = tid;
  elsif t = 'job' then select title into r from jobs where id::text = tid;
  elsif t = 'advert' then select title into r from ad_campaigns where id::text = tid;
  elsif t = 'community' then select name into r from communities where id::text = tid;
  elsif t = 'community_post' then select left(body, 50) into r from community_posts where id::text = tid;
  elsif t = 'repost' then
    select case rp.original_type
      when 'activity' then (select title from activities where id = rp.original_id)
      when 'job' then (select title from jobs where id = rp.original_id)
      else (select title from ad_campaigns where id = rp.original_id) end
    into r from reposts rp where rp.id::text = tid;
  end if;
  return r;
end $$;

create or replace function public.target_author(t text, tid text) returns text
language plpgsql stable security definer set search_path = public as $$
declare r text;
begin
  if tid is null then return null; end if;
  if t = 'activity' then select owner_email into r from activities where id::text = tid;
  elsif t = 'job' then select org_email into r from jobs where id::text = tid;
  elsif t = 'advert' then select advertiser_email into r from ad_campaigns where id::text = tid;
  elsif t = 'community_post' then select author_email into r from community_posts where id::text = tid;
  elsif t = 'repost' then select reposter_email into r from reposts where id::text = tid;
  end if;
  return r;
end $$;

create or replace function public.target_link(t text, tid text) returns text
language plpgsql stable security definer set search_path = public as $$
declare oid uuid; ot text; sl text;
begin
  if t = 'activity' then return '/activity/' || tid; end if;
  if t = 'job' then return '/job/' || tid; end if;
  if t = 'community' then select slug into sl from communities where id::text = tid; return '/communities/' || coalesce(sl, tid); end if;
  if t = 'community_post' then
    select c.slug into sl from community_posts p join communities c on c.id = p.community_id where p.id::text = tid;
    return '/communities/' || coalesce(sl, '') || '?post=' || tid;
  end if;
  if t = 'repost' then
    select original_type, original_id into ot, oid from reposts where id::text = tid;
    if ot is not null then return public.target_link(ot, oid::text); end if;
  end if;
  return '/home';
end $$;

-- ------------------------------------------------------- notification events
insert into public.notification_event_types (event_type, category, mandatory, self_allowed, group_window, template) values
  ('community_invite',        'community', false, false, null, '{actor} invited you to join "{title}".'),
  ('community_join_request',  'community', false, false, interval '12 hours', '{actor} requested to join "{title}".'),
  ('community_join_approved', 'community', false, false, null, 'Your request to join "{title}" was approved.'),
  ('community_join_rejected', 'community', false, false, null, 'Your request to join "{title}" was not approved.'),
  ('community_announcement',  'community', false, false, null, '{actor} posted an announcement in "{title}": {detail}'),
  ('community_role_changed',  'community', false, false, null, 'You are now {detail} in "{title}".'),
  ('community_moderation',    'community', true,  false, null, 'A moderator {detail} you in "{title}".'),
  ('community_appeal',        'community', false, false, interval '12 hours', '{actor} appealed a moderation action in "{title}".'),
  ('community_appeal_decided','community', false, false, null, 'Your appeal in "{title}" was {detail}.'),
  ('community_report',        'community', false, false, interval '12 hours', '{actor} reported content in "{title}".'),
  ('community_suspended',     'community', true,  false, null, 'The community "{title}" was suspended by PROFILE moderators.')
on conflict (event_type) do update set category = excluded.category, mandatory = excluded.mandatory, self_allowed = excluded.self_allowed,
  group_window = excluded.group_window, template = excluded.template;

-- Group chats are one conversation per `group` community; DM-only block rules.
create or replace function public.conversation_has_block(conv text)
returns boolean language sql stable security definer set search_path = public as $$
  select conv like '%::%' and exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conv
      and cp.participant_email <> public.current_account_email()
      and public.is_blocked_pair(public.current_account_email(), cp.participant_email)
  )
$$;

-- ----------------------------------------------------- audit + notify helpers
create or replace function public.community_audit(cid uuid, act text, tgt text, det text) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.community_audit_log (community_id, actor, action, target, detail)
  values (cid, coalesce(public.current_account_email(), 'platform-staff'), act, tgt, left(det, 500));
end $$;

create or replace function public.community_notify_mods(cid uuid, ev text, link text) returns void
language plpgsql security definer set search_path = public as $$
declare m record;
begin
  begin
    for m in select member_email from public.community_members where community_id = cid and status = 'active' and role in ('owner', 'admin', 'moderator') loop
      perform public.emit_notification(m.member_email, ev, link, 'community', cid::text);
    end loop;
  exception when others then null;
  end;
end $$;

-- ------------------------------------------------------------- lifecycle RPCs
create or replace function public.create_community(p_name text, p_kind text, p_type text, p_description text, p_rules text, p_privacy text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me text := public.current_account_email();
  cid uuid := gen_random_uuid();
  base text; candidate text;
begin
  if me is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if (select count(*) from public.communities where owner_email = me) >= 10 then
    raise exception 'You can own up to 10 communities.';
  end if;
  if length(trim(p_name)) < 3 then raise exception 'Give your community a name (3+ characters).'; end if;
  base := trim(both '-' from regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g'));
  if base = '' then base := 'community'; end if;
  candidate := base;
  while exists (select 1 from public.communities where slug = candidate) loop
    candidate := base || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
  end loop;
  insert into public.communities (id, slug, name, kind, type, description, rules, privacy, owner_email)
  values (cid, candidate, trim(p_name), p_kind, p_type, coalesce(p_description, ''), coalesce(p_rules, ''), p_privacy, me);
  if p_kind = 'group' then
    insert into public.conversations (id) values ('community:' || cid) on conflict do nothing;
  end if;
  insert into public.community_members (community_id, member_email, role) values (cid, me, 'owner');
  perform public.community_audit(cid, 'created', me, trim(p_name));
  return cid;
end $$;

create or replace function public.join_community(cid uuid) returns text
language plpgsql security definer set search_path = public as $$
declare me text := public.current_account_email(); c public.communities%rowtype; existing record; inv uuid;
begin
  if me is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select * into c from public.communities where id = cid and status = 'active';
  if not found then raise exception 'Community not found.'; end if;
  select * into existing from public.community_members where community_id = cid and member_email = me;
  if found then
    if existing.status = 'banned' then raise exception 'You are not able to join this community.' using errcode = '42501'; end if;
    return 'already_member';
  end if;
  if c.privacy = 'public' then
    insert into public.community_members (community_id, member_email) values (cid, me);
    return 'joined';
  elsif c.privacy = 'private' then
    insert into public.community_join_requests (community_id, requester_email) values (cid, me) on conflict do nothing;
    perform public.community_notify_mods(cid, 'community_join_request', '/communities/' || c.slug || '?tab=manage');
    return 'requested';
  else
    select id into inv from public.community_invites where community_id = cid and invitee_email = me and status = 'pending';
    if inv is null then raise exception 'This community is invite-only.' using errcode = '42501'; end if;
    update public.community_invites set status = 'accepted' where id = inv;
    insert into public.community_members (community_id, member_email) values (cid, me);
    return 'joined';
  end if;
end $$;

create or replace function public.decide_join_request(rid uuid, approve boolean) returns void
language plpgsql security definer set search_path = public as $$
declare me text := public.current_account_email(); r public.community_join_requests%rowtype; c public.communities%rowtype;
begin
  select * into r from public.community_join_requests where id = rid and status = 'pending';
  if not found then raise exception 'Request not found.'; end if;
  if not public.is_community_mod(r.community_id) then raise exception 'Moderator access required.' using errcode = '42501'; end if;
  select * into c from public.communities where id = r.community_id;
  update public.community_join_requests set status = case when approve then 'approved' else 'rejected' end, decided_by = me, decided_at = now() where id = rid;
  if approve then
    insert into public.community_members (community_id, member_email) values (r.community_id, r.requester_email) on conflict do nothing;
  end if;
  perform public.community_audit(r.community_id, case when approve then 'approved_request' else 'rejected_request' end, r.requester_email, null);
  begin
    perform public.emit_notification(r.requester_email, case when approve then 'community_join_approved' else 'community_join_rejected' end,
      '/communities/' || c.slug, 'community', c.id::text);
  exception when others then null;
  end;
end $$;

create or replace function public.invite_to_community(cid uuid, invitee text) returns void
language plpgsql security definer set search_path = public as $$
declare me text := public.current_account_email(); target text := lower(invitee); c public.communities%rowtype;
begin
  if not public.is_community_mod(cid) then raise exception 'Moderator access required.' using errcode = '42501'; end if;
  select * into c from public.communities where id = cid and status = 'active';
  if not found then raise exception 'Community not found.'; end if;
  if not exists (select 1 from public.accounts where email = target) then raise exception 'No PROFILE account with that email.'; end if;
  if public.is_blocked_pair(me, target) then raise exception 'You cannot invite that person.' using errcode = '42501'; end if;
  if exists (select 1 from public.community_members where community_id = cid and member_email = target) then raise exception 'Already a member (or restricted).'; end if;
  insert into public.community_invites (community_id, invitee_email, invited_by) values (cid, target, me) on conflict do nothing;
  perform public.community_audit(cid, 'invited', target, null);
  begin
    perform public.emit_notification(target, 'community_invite', '/communities/' || c.slug, 'community', cid::text);
  exception when others then null;
  end;
end $$;

create or replace function public.respond_community_invite(iid uuid, accept boolean) returns void
language plpgsql security definer set search_path = public as $$
declare me text := public.current_account_email(); i public.community_invites%rowtype;
begin
  select * into i from public.community_invites where id = iid and invitee_email = me and status = 'pending';
  if not found then raise exception 'Invitation not found.'; end if;
  update public.community_invites set status = case when accept then 'accepted' else 'declined' end where id = iid;
  if accept then
    if exists (select 1 from public.community_members where community_id = i.community_id and member_email = me and status = 'banned') then
      raise exception 'You are not able to join this community.' using errcode = '42501';
    end if;
    insert into public.community_members (community_id, member_email) values (i.community_id, me) on conflict do nothing;
  end if;
end $$;

create or replace function public.leave_community(cid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me text := public.current_account_email(); r text;
begin
  select role into r from public.community_members where community_id = cid and member_email = me and status = 'active';
  if r is null then return; end if;
  if r = 'owner' then raise exception 'Transfer ownership before leaving, or delete the community.'; end if;
  delete from public.community_members where community_id = cid and member_email = me;
end $$;

create or replace function public.delete_community(cid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.community_role(cid) is distinct from 'owner' then raise exception 'Only the owner can delete a community.' using errcode = '42501'; end if;
  delete from public.conversations where id = 'community:' || cid;
  delete from public.communities where id = cid;
end $$;

create or replace function public.set_member_role(cid uuid, target text, new_role text) returns void
language plpgsql security definer set search_path = public as $$
declare me text := public.current_account_email(); my_role text := public.community_role(cid); t record; c public.communities%rowtype;
begin
  if my_role not in ('owner', 'admin') then raise exception 'Admin access required.' using errcode = '42501'; end if;
  if new_role not in ('admin', 'moderator', 'member') then raise exception 'Invalid role.'; end if;
  select * into t from public.community_members where community_id = cid and member_email = lower(target) and status = 'active';
  if not found then raise exception 'Member not found.'; end if;
  if t.role = 'owner' then raise exception 'The owner role can only be transferred.'; end if;
  -- admins can manage moderators/members only; only the owner can create or change admins
  if my_role = 'admin' and (public.role_rank(t.role) >= 3 or new_role = 'admin') then raise exception 'Only the owner can manage admins.' using errcode = '42501'; end if;
  update public.community_members set role = new_role where community_id = cid and member_email = lower(target);
  perform public.community_audit(cid, 'role_changed', lower(target), t.role || ' -> ' || new_role);
  select * into c from public.communities where id = cid;
  begin
    perform public.emit_notification(lower(target), 'community_role_changed', '/communities/' || c.slug, 'community', cid::text, jsonb_build_object('detail', new_role));
  exception when others then null;
  end;
end $$;

create or replace function public.transfer_community_ownership(cid uuid, target text) returns void
language plpgsql security definer set search_path = public as $$
declare me text := public.current_account_email();
begin
  if public.community_role(cid) is distinct from 'owner' then raise exception 'Only the owner can transfer ownership.' using errcode = '42501'; end if;
  if not exists (select 1 from public.community_members where community_id = cid and member_email = lower(target) and status = 'active') then raise exception 'Target must be an active member.'; end if;
  perform set_config('app.community_internal', 'on', true);
  update public.community_members set role = 'admin' where community_id = cid and member_email = me;
  update public.community_members set role = 'owner' where community_id = cid and member_email = lower(target);
  update public.communities set owner_email = lower(target) where id = cid;
  perform public.community_audit(cid, 'ownership_transferred', lower(target), null);
end $$;

-- ---------------------------------------------------------------- moderation
create or replace function public.moderate_member(cid uuid, target text, act text, hours integer default null, reason text default '')
returns void language plpgsql security definer set search_path = public as $$
declare me text := public.current_account_email(); my_role text := public.community_role(cid); t record; c public.communities%rowtype; verb text;
begin
  if my_role not in ('owner', 'admin', 'moderator') then raise exception 'Moderator access required.' using errcode = '42501'; end if;
  select * into t from public.community_members where community_id = cid and member_email = lower(target);
  if not found then raise exception 'Member not found.'; end if;
  if lower(target) = me then raise exception 'You cannot moderate yourself.'; end if;
  if public.role_rank(t.role) >= public.role_rank(my_role) then raise exception 'You cannot moderate someone of equal or higher role.' using errcode = '42501'; end if;
  select * into c from public.communities where id = cid;
  if act = 'warn' then verb := 'warned';
  elsif act = 'mute' then
    update public.community_members set muted_until = now() + make_interval(hours => greatest(coalesce(hours, 24), 1)) where community_id = cid and member_email = lower(target);
    verb := 'muted';
  elsif act = 'unmute' then
    update public.community_members set muted_until = null where community_id = cid and member_email = lower(target); verb := null;
  elsif act = 'remove' then
    delete from public.community_members where community_id = cid and member_email = lower(target); verb := 'removed';
  elsif act = 'ban' then
    update public.community_members set status = 'banned', role = 'member' where community_id = cid and member_email = lower(target); verb := 'banned';
  elsif act = 'unban' then
    delete from public.community_members where community_id = cid and member_email = lower(target); verb := null;
  else raise exception 'Unknown action.';
  end if;
  perform public.community_audit(cid, act, lower(target), reason);
  if verb is not null then
    begin
      perform public.emit_notification(lower(target), 'community_moderation', '/communities/' || c.slug, 'community', cid::text, jsonb_build_object('detail', verb));
    exception when others then null;
    end;
  end if;
end $$;

create or replace function public.delete_community_post(pid uuid, reason text default '') returns void
language plpgsql security definer set search_path = public as $$
declare me text := public.current_account_email(); p public.community_posts%rowtype;
begin
  select * into p from public.community_posts where id = pid and deleted_at is null;
  if not found then return; end if;
  if p.author_email <> me and not public.is_community_mod(p.community_id) then raise exception 'Not allowed.' using errcode = '42501'; end if;
  update public.community_posts set deleted_at = now(), deleted_by = me where id = pid;
  if p.author_email <> me then perform public.community_audit(p.community_id, 'removed_post', p.author_email, reason); end if;
end $$;

create or replace function public.set_post_pinned(pid uuid, pin boolean) returns void
language plpgsql security definer set search_path = public as $$
declare p public.community_posts%rowtype;
begin
  select * into p from public.community_posts where id = pid;
  if not found or not public.is_community_mod(p.community_id) then raise exception 'Moderator access required.' using errcode = '42501'; end if;
  update public.community_posts set pinned = pin where id = pid;
  perform public.community_audit(p.community_id, case when pin then 'pinned_post' else 'unpinned_post' end, p.author_email, null);
end $$;

create or replace function public.report_community_content(cid uuid, ttype text, tid text, why text) returns void
language plpgsql security definer set search_path = public as $$
declare me text := public.current_account_email();
begin
  if me is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if not public.can_read_community(cid) then raise exception 'Not allowed.' using errcode = '42501'; end if;
  insert into public.content_reports (reporter_email, target_type, target_id, reason, community_id) values (me, ttype, tid, why, cid);
  perform public.community_notify_mods(cid, 'community_report', '/communities/' || (select slug from public.communities where id = cid) || '?tab=manage');
end $$;

create or replace function public.appeal_community_action(cid uuid, why text) returns void
language plpgsql security definer set search_path = public as $$
declare me text := public.current_account_email();
begin
  if not exists (select 1 from public.community_members where community_id = cid and member_email = me and (status = 'banned' or muted_until > now())) then
    raise exception 'There is nothing to appeal.';
  end if;
  insert into public.community_appeals (community_id, member_email, message) values (cid, me, why) on conflict do nothing;
  perform public.community_audit(cid, 'appeal_filed', me, why);
  begin
    perform public.community_notify_mods(cid, 'community_appeal', '/communities/' || (select slug from public.communities where id = cid) || '?tab=manage');
  exception when others then null;
  end;
end $$;

create or replace function public.decide_community_appeal(aid uuid, approve boolean) returns void
language plpgsql security definer set search_path = public as $$
declare a public.community_appeals%rowtype; c public.communities%rowtype;
begin
  select * into a from public.community_appeals where id = aid and status = 'pending';
  if not found then raise exception 'Appeal not found.'; end if;
  if public.community_role(a.community_id) not in ('owner', 'admin') then raise exception 'Admin access required.' using errcode = '42501'; end if;
  update public.community_appeals set status = case when approve then 'approved' else 'rejected' end, decided_by = public.current_account_email() where id = aid;
  if approve then
    update public.community_members set muted_until = null where community_id = a.community_id and member_email = a.member_email and status = 'active';
    delete from public.community_members where community_id = a.community_id and member_email = a.member_email and status = 'banned';
  end if;
  perform public.community_audit(a.community_id, 'appeal_decided', a.member_email, case when approve then 'approved' else 'rejected' end);
  select * into c from public.communities where id = a.community_id;
  begin
    perform public.emit_notification(a.member_email, 'community_appeal_decided', '/communities/' || c.slug, 'community', c.id::text, jsonb_build_object('detail', case when approve then 'approved' else 'declined' end));
  exception when others then null;
  end;
end $$;

-- ------------------------------------------------- platform staff oversight
create or replace function public.staff_set_community_status(cid uuid, new_status text, why text default '') returns void
language plpgsql security definer set search_path = public as $$
declare c public.communities%rowtype;
begin
  if not public.is_platform_staff() then raise exception 'Platform staff only.' using errcode = '42501'; end if;
  if new_status not in ('active', 'suspended') then raise exception 'Invalid status.'; end if;
  perform set_config('app.community_internal', 'on', true);
  update public.communities set status = new_status where id = cid returning * into c;
  perform public.community_audit(cid, 'staff_' || new_status, null, why);
end $$;

create or replace function public.staff_remove_community_post(pid uuid, why text default '') returns void
language plpgsql security definer set search_path = public as $$
declare p public.community_posts%rowtype;
begin
  if not public.is_platform_staff() then raise exception 'Platform staff only.' using errcode = '42501'; end if;
  select * into p from public.community_posts where id = pid;
  update public.community_posts set deleted_at = now(), deleted_by = 'platform-staff' where id = pid;
  if found then perform public.community_audit(p.community_id, 'staff_removed_post', p.author_email, why); end if;
end $$;

-- ------------------------------------------------------------------- stats
create or replace function public.community_counts()
returns table (community_id uuid, members integer, posts integer)
language sql stable security definer set search_path = public as $$
  select c.id,
    (select count(*)::int from public.community_members m where m.community_id = c.id and m.status = 'active'),
    (select count(*)::int from public.community_posts p where p.community_id = c.id and p.deleted_at is null)
  from public.communities c
  where public.is_platform_staff() or c.owner_email = public.current_account_email()
     or (c.status = 'active' and (c.privacy in ('public', 'private') or public.community_role(c.id) is not null))
$$;
grant execute on function public.community_counts() to authenticated;

-- --------------------------------------------- group chat membership sync
create or replace function public.trg_sync_group_conversation() returns trigger language plpgsql security definer set search_path = public as $$
declare cid uuid; mail text; keep boolean;
begin
  if tg_op = 'DELETE' then cid := old.community_id; mail := old.member_email; keep := false;
  else cid := new.community_id; mail := new.member_email; keep := (new.status = 'active'); end if;
  if exists (select 1 from public.communities where id = cid and kind = 'group') then
    if keep then
      insert into public.conversation_participants (conversation_id, participant_email) values ('community:' || cid, mail) on conflict do nothing;
    else
      delete from public.conversation_participants where conversation_id = 'community:' || cid and participant_email = mail;
    end if;
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists trg_sync_group_conversation on public.community_members;
create trigger trg_sync_group_conversation after insert or update or delete on public.community_members for each row execute function public.trg_sync_group_conversation();

-- Group-chat messages link back to the community, not "?with=<sender>".
create or replace function public.trg_notify_message() returns trigger language plpgsql security definer set search_path = public as $$
declare p record; link text; grp uuid;
begin
  begin
    if new.deleted_at is null then
      if new.conversation_id like 'community:%' then
        grp := substring(new.conversation_id from 11)::uuid;
        link := public.target_link('community', grp::text) || '?tab=chat';
      else
        link := '/messages?with=' || new.sender_email;
      end if;
      for p in select participant_email from conversation_participants where conversation_id = new.conversation_id and participant_email <> new.sender_email loop
        perform public.emit_notification(p.participant_email, 'message_new', link, 'conversation', new.conversation_id);
      end loop;
    end if;
  exception when others then null;
  end;
  return new;
end $$;

-- Announcements notify every active member.
create or replace function public.trg_notify_community_post() returns trigger language plpgsql security definer set search_path = public as $$
declare m record;
begin
  begin
    if new.kind = 'announcement' then
      for m in select member_email from community_members where community_id = new.community_id and status = 'active' and member_email <> new.author_email loop
        perform public.emit_notification(m.member_email, 'community_announcement', public.target_link('community_post', new.id::text), 'community', new.community_id::text,
          jsonb_build_object('detail', left(new.body, 80)));
      end loop;
    end if;
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists trg_notify_community_post on public.community_posts;
create trigger trg_notify_community_post after insert on public.community_posts for each row execute function public.trg_notify_community_post();

-- Staff suspension tells the owner.
create or replace function public.trg_notify_community_suspension() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'suspended' and old.status <> 'suspended' then
    insert into public.notifications (recipient_email, category, text, deep_link, event_type, actor_email, target_type, target_id, actors, group_count)
    values (new.owner_email, 'community', 'The community "' || new.name || '" was suspended by PROFILE moderators.', '/communities/' || new.slug,
            'community_suspended', null, 'community', new.id::text, '{}', 1);
  end if;
  return new;
end $$;
drop trigger if exists trg_notify_community_suspension on public.communities;
create trigger trg_notify_community_suspension after update on public.communities for each row execute function public.trg_notify_community_suspension();

-- ------------------------------------------------- media (avatar / cover)
create or replace function public.storage_community_id(object_name text) returns uuid
language sql immutable as $$
  select case when (storage.foldername(object_name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then ((storage.foldername(object_name))[1])::uuid end
$$;
insert into storage.buckets (id, name, public, file_size_limit)
values ('community-media', 'community-media', false, 5242880) on conflict (id) do nothing;
drop policy if exists community_media_insert on storage.objects;
create policy community_media_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'community-media' and public.community_role(public.storage_community_id(name)) in ('owner', 'admin')
);
drop policy if exists community_media_delete on storage.objects;
create policy community_media_delete on storage.objects for delete to authenticated using (
  bucket_id = 'community-media' and public.community_role(public.storage_community_id(name)) in ('owner', 'admin')
);
drop policy if exists community_media_select on storage.objects;
create policy community_media_select on storage.objects for select to authenticated using (
  bucket_id = 'community-media' and exists (select 1 from public.communities c where c.id = public.storage_community_id(name))
);

-- ------------------------------------------------- execute grants + realtime
do $$
declare f text;
begin
  foreach f in array array[
    'create_community(text,text,text,text,text,text)', 'join_community(uuid)', 'decide_join_request(uuid,boolean)',
    'invite_to_community(uuid,text)', 'respond_community_invite(uuid,boolean)', 'leave_community(uuid)', 'delete_community(uuid)',
    'set_member_role(uuid,text,text)', 'transfer_community_ownership(uuid,text)', 'moderate_member(uuid,text,text,integer,text)',
    'delete_community_post(uuid,text)', 'set_post_pinned(uuid,boolean)', 'report_community_content(uuid,text,text,text)',
    'appeal_community_action(uuid,text)', 'decide_community_appeal(uuid,boolean)',
    'staff_set_community_status(uuid,text,text)', 'staff_remove_community_post(uuid,text)'
  ] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array['communities', 'community_members', 'community_posts', 'community_join_requests', 'community_invites', 'community_appeals', 'community_audit_log']
  loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
