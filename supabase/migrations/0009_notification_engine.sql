-- Phase 3 — central notification engine.
--
-- Feature event -> emit_notification() -> event rules (category / mandatory /
-- grouping / template) -> eligibility (blocks, mute, self) -> user preferences
-- -> grouped insert -> Realtime delivery -> read state.
--
-- Text is composed SERVER-SIDE from a fixed template + a few sanitised slots,
-- so a client can no longer author an arbitrary notification for someone else
-- (the old "any authenticated user may insert any text for anyone" policy is
-- removed in 0010 once the new client is deployed). Core social + messaging
-- events are emitted by database triggers, so they cannot be skipped or
-- forged by a client; failures in the engine never block the user's action.

-- ------------------------------------------------------ table upgrades
alter table public.notifications
  add column if not exists event_type text,
  add column if not exists actor_email text,
  add column if not exists target_type text,
  add column if not exists target_id text,
  add column if not exists actors text[] not null default '{}',
  add column if not exists group_count integer not null default 1;

alter table public.notifications drop constraint if exists notifications_category_check;
alter table public.notifications add constraint notifications_category_check check (
  category in ('verification', 'messages', 'opportunities', 'community', 'security', 'marketing',
               'social', 'professional', 'profile', 'career', 'system')
);
create index if not exists notifications_group_idx on public.notifications (recipient_email, event_type, target_type, target_id) where read = false;
create index if not exists notifications_actor_recent_idx on public.notifications (actor_email, recipient_email, created_at desc);

-- --------------------------------------------------- event rules (data)
create table if not exists public.notification_event_types (
  event_type text primary key,
  category text not null,
  mandatory boolean not null default false,
  self_allowed boolean not null default false,
  group_window interval,
  template text not null
);
alter table public.notification_event_types enable row level security;
drop policy if exists notification_event_types_read on public.notification_event_types;
create policy notification_event_types_read on public.notification_event_types for select to authenticated using (true);

insert into public.notification_event_types (event_type, category, mandatory, self_allowed, group_window, template) values
  ('reaction',            'social',        false, false, interval '6 hours',  '{actor} marked "{title}" as {detail}.'),
  ('comment',             'social',        false, false, interval '6 hours',  '{actor} commented on "{title}".'),
  ('reply',               'social',        false, false, null,                '{actor} replied to your comment on "{title}".'),
  ('mention',             'social',        false, false, null,                '{actor} mentioned you in a comment on "{title}".'),
  ('repost',              'social',        false, false, null,                '{actor} reposted "{title}".'),
  ('repost_comment',      'social',        false, false, null,                '{actor} reposted "{title}" with a comment.'),
  ('recommend',           'social',        false, false, interval '6 hours',  '{actor} recommended "{title}".'),
  ('follow',              'social',        false, false, null,                '{actor} started following you.'),
  ('credit',              'social',        false, false, null,                '{actor} credited you as "{role}" on an activity.'),
  ('credit_dispute',      'social',        false, false, null,                '{actor} disputed the "{role}" credit you gave them.'),
  ('tag_request',         'social',        false, false, null,                '{actor} wants to be tagged as "{role}" on "{title}".'),
  ('tag_response',        'social',        false, false, null,                'Your tag request on "{title}" was {detail}.'),
  ('message_new',         'messages',      false, false, interval '10 minutes', '{actor} sent you a message.'),
  ('message_reaction',    'messages',      false, false, null,                '{actor} reacted to your message.'),
  ('connection_request',  'professional',  false, false, null,                '{actor} sent you a connection request.'),
  ('connection_accepted', 'professional',  false, false, null,                '{actor} accepted your connection request.'),
  ('mentorship_request',  'professional',  false, false, null,                '{actor} requested mentorship from you.'),
  ('mentorship_response', 'professional',  false, false, null,                '{actor} {detail} your mentorship request.'),
  ('staff_invite',        'professional',  false, false, null,                '{actor} invited you to join their PROFILE workspace as {role}.'),
  ('job_posted',          'opportunities', false, false, null,                '{actor} posted a new opportunity: {title}.'),
  ('application_received','opportunities', false, false, null,                '{actor} applied with PROFILE for "{title}".'),
  ('application_status',  'opportunities', false, false, null,                'Your application for "{title}" at {actor} is now "{detail}".'),
  ('interview_scheduled', 'opportunities', false, false, null,                '{actor} scheduled an interview for "{title}" — {detail}.'),
  ('passport_revoked',    'security',      true,  true,  null,                'You revoked {detail}''s access to your Trust Passport.')
on conflict (event_type) do update set
  category = excluded.category, mandatory = excluded.mandatory, self_allowed = excluded.self_allowed,
  group_window = excluded.group_window, template = excluded.template;

-- -------------------------------------------------------- preferences
create table if not exists public.notification_preferences (
  user_email text not null references public.accounts(email) on delete cascade,
  category text not null check (category in ('verification', 'messages', 'opportunities', 'community', 'security', 'marketing',
                                              'social', 'professional', 'profile', 'career', 'system')),
  in_app boolean not null default true,
  email boolean not null default true,
  push boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_email, category)
);
alter table public.notification_preferences enable row level security;
drop policy if exists notification_preferences_own on public.notification_preferences;
create policy notification_preferences_own on public.notification_preferences for all
  using (user_email = public.current_account_email()) with check (user_email = public.current_account_email());
-- Security/system notices can never be switched off.
create or replace function public.notification_preferences_guard() returns trigger language plpgsql as $$
begin
  if new.category in ('security', 'system') then new.in_app := true; end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists notification_preferences_guard on public.notification_preferences;
create trigger notification_preferences_guard before insert or update on public.notification_preferences
  for each row execute function public.notification_preferences_guard();

-- --------------------------------------------------------- helpers
create or replace function public.clean_notification_text(v text) returns text
language sql immutable as $$ select regexp_replace(left(coalesce(v, ''), 140), '[\x00-\x1f]', '', 'g') $$;

create or replace function public.target_title(t text, tid text) returns text
language plpgsql stable security definer set search_path = public as $$
declare r text;
begin
  if tid is null then return null; end if;
  if t = 'activity' then select title into r from activities where id::text = tid;
  elsif t = 'job' then select title into r from jobs where id::text = tid;
  elsif t = 'advert' then select title into r from ad_campaigns where id::text = tid;
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
  elsif t = 'repost' then select reposter_email into r from reposts where id::text = tid;
  end if;
  return r;
end $$;

create or replace function public.target_link(t text, tid text) returns text
language plpgsql stable security definer set search_path = public as $$
declare oid uuid; ot text;
begin
  if t = 'activity' then return '/activity/' || tid; end if;
  if t = 'job' then return '/job/' || tid; end if;
  if t = 'repost' then
    select original_type, original_id into ot, oid from reposts where id::text = tid;
    if ot is not null then return public.target_link(ot, oid::text); end if;
  end if;
  return '/home';
end $$;

create or replace function public.profile_link(p_email text) returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select '/profile/' || a.username from accounts a where a.email = lower(p_email) and a.username is not null and a.username <> ''), '/notifications')
$$;

create or replace function public.render_notification(tpl text, actors text[], n integer, title text, detail text, role text)
returns text language plpgsql stable security definer set search_path = public as $$
declare lead text; actor_label text;
begin
  select coalesce(legal_name, 'Someone') into lead from accounts where email = actors[array_upper(actors, 1)];
  lead := coalesce(lead, 'Someone');
  actor_label := case when n <= 1 then lead when n = 2 then lead || ' and 1 other' else lead || ' and ' || (n - 1) || ' others' end;
  return replace(replace(replace(replace(tpl, '{actor}', actor_label),
    '{title}', coalesce(title, 'a post')), '{detail}', coalesce(detail, '')), '{role}', coalesce(role, ''));
end $$;

-- ---------------------------------------------------------- the engine
create or replace function public.emit_notification(
  p_recipient text, p_event text, p_deep_link text,
  p_target_type text default null, p_target_id text default null,
  p_vars jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  actor text := public.current_account_email();
  rcpt text := lower(p_recipient);
  et public.notification_event_types%rowtype;
  pref boolean;
  ttl text;
  detail text := public.clean_notification_text(p_vars->>'detail');
  role text := public.clean_notification_text(p_vars->>'role');
  existing public.notifications%rowtype;
  new_actors text[];
  new_id uuid;
begin
  if actor is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select * into et from public.notification_event_types where event_type = p_event;
  if not found then raise exception 'unknown notification event %', p_event; end if;

  -- eligibility
  if rcpt = actor and not et.self_allowed then return null; end if;
  if not exists (select 1 from public.accounts where email = rcpt) then return null; end if;
  if rcpt <> actor and public.is_blocked_pair(actor, rcpt) then return null; end if;

  -- user preferences (mandatory events ignore them)
  if not et.mandatory then
    select in_app into pref from public.notification_preferences where user_email = rcpt and category = et.category;
    if pref is false then return null; end if;
  end if;

  -- muted conversation
  if et.category = 'messages' and p_target_type = 'conversation' and p_target_id is not null then
    if exists (select 1 from public.conversation_participants where conversation_id = p_target_id and participant_email = rcpt and muted) then
      return null;
    end if;
  end if;

  -- abuse guard: at most 30 notifications from one actor to one recipient per minute
  if rcpt <> actor and (select count(*) from public.notifications
        where actor_email = actor and recipient_email = rcpt and created_at > now() - interval '1 minute') >= 30 then
    return null;
  end if;

  ttl := coalesce(public.clean_notification_text(public.target_title(p_target_type, p_target_id)), public.clean_notification_text(p_vars->>'title'));

  -- grouping: fold repeats on the same target into one unread notification
  if et.group_window is not null and p_target_id is not null then
    select * into existing from public.notifications
      where recipient_email = rcpt and event_type = p_event and target_type is not distinct from p_target_type
        and target_id is not distinct from p_target_id and read = false and created_at > now() - et.group_window
      order by created_at desc limit 1;
    if found then
      if actor = any(existing.actors) then return existing.id; end if;
      new_actors := array_append(existing.actors, actor);
      update public.notifications set
        actors = new_actors, group_count = array_length(new_actors, 1), actor_email = actor,
        text = public.render_notification(et.template, new_actors, array_length(new_actors, 1), ttl, detail, role),
        created_at = now()
      where id = existing.id;
      return existing.id;
    end if;
  end if;

  insert into public.notifications (recipient_email, category, text, deep_link, event_type, actor_email, target_type, target_id, actors, group_count)
  values (rcpt, et.category, public.render_notification(et.template, array[actor], 1, ttl, detail, role), p_deep_link,
          p_event, actor, p_target_type, p_target_id, array[actor], 1)
  returning id into new_id;
  return new_id;
end $$;
revoke all on function public.emit_notification(text, text, text, text, text, jsonb) from public;
grant execute on function public.emit_notification(text, text, text, text, text, jsonb) to authenticated;

-- ---------------------------------------------- trigger-based emission
-- Every trigger swallows engine errors: a notification problem must never
-- block the user's real action (and service-role/admin SQL has no actor).
create or replace function public.trg_notify_message() returns trigger language plpgsql security definer set search_path = public as $$
declare p record;
begin
  begin
    if new.deleted_at is null then
      for p in select participant_email from conversation_participants where conversation_id = new.conversation_id and participant_email <> new.sender_email loop
        perform public.emit_notification(p.participant_email, 'message_new', '/messages?with=' || new.sender_email, 'conversation', new.conversation_id);
      end loop;
    end if;
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists trg_notify_message on public.messages;
create trigger trg_notify_message after insert on public.messages for each row execute function public.trg_notify_message();

create or replace function public.trg_notify_message_reaction() returns trigger language plpgsql security definer set search_path = public as $$
declare m record;
begin
  begin
    select sender_email, conversation_id into m from messages where id = new.message_id;
    if m.sender_email is not null then
      perform public.emit_notification(m.sender_email, 'message_reaction', '/messages?with=' || new.user_email, 'conversation', m.conversation_id);
    end if;
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists trg_notify_message_reaction on public.message_reactions;
create trigger trg_notify_message_reaction after insert on public.message_reactions for each row execute function public.trg_notify_message_reaction();

create or replace function public.trg_notify_reaction() returns trigger language plpgsql security definer set search_path = public as $$
declare a text;
begin
  begin
    if new.target_type <> 'comment' then
      a := public.target_author(new.target_type, new.target_id::text);
      if a is not null then
        perform public.emit_notification(a, 'reaction', public.target_link(new.target_type, new.target_id::text), new.target_type, new.target_id::text,
          jsonb_build_object('detail', initcap(replace(new.reaction_type, '_', ' '))));
      end if;
    end if;
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists trg_notify_reaction on public.reactions;
create trigger trg_notify_reaction after insert on public.reactions for each row execute function public.trg_notify_reaction();

create or replace function public.trg_notify_comment() returns trigger language plpgsql security definer set search_path = public as $$
declare
  a text; parent_author text; link text; handle text; mentioned text; done text[] := array[lower(new.author_email)];
begin
  begin
    link := public.target_link(new.target_type, new.target_id::text);
    -- @mentions first (a mention supersedes the generic comment notice for that person)
    for handle in select (regexp_matches(new.text, '@([A-Za-z0-9_]{3,30})', 'g'))[1] loop
      select email into mentioned from accounts where lower(username) = lower(handle);
      if mentioned is not null and not (lower(mentioned) = any(done)) then
        done := array_append(done, lower(mentioned));
        perform public.emit_notification(mentioned, 'mention', link, new.target_type, new.target_id::text);
      end if;
    end loop;
    if new.parent_comment_id is not null then
      select author_email into parent_author from comments where id = new.parent_comment_id;
      if parent_author is not null and not (lower(parent_author) = any(done)) then
        done := array_append(done, lower(parent_author));
        perform public.emit_notification(parent_author, 'reply', link, new.target_type, new.target_id::text);
      end if;
    end if;
    a := public.target_author(new.target_type, new.target_id::text);
    if a is not null and not (lower(a) = any(done)) then
      perform public.emit_notification(a, 'comment', link, new.target_type, new.target_id::text);
    end if;
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists trg_notify_comment on public.comments;
create trigger trg_notify_comment after insert on public.comments for each row execute function public.trg_notify_comment();

create or replace function public.trg_notify_repost() returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform public.emit_notification(new.original_author_email,
      case when new.commentary is not null and new.commentary <> '' then 'repost_comment' else 'repost' end,
      public.target_link(new.original_type, new.original_id::text), new.original_type, new.original_id::text);
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists trg_notify_repost on public.reposts;
create trigger trg_notify_repost after insert on public.reposts for each row execute function public.trg_notify_repost();

create or replace function public.trg_notify_endorsement() returns trigger language plpgsql security definer set search_path = public as $$
declare a text;
begin
  begin
    a := public.target_author(new.target_type, new.target_id::text);
    if a is not null then
      perform public.emit_notification(a, 'recommend', public.target_link(new.target_type, new.target_id::text), new.target_type, new.target_id::text);
    end if;
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists trg_notify_endorsement on public.endorsements;
create trigger trg_notify_endorsement after insert on public.endorsements for each row execute function public.trg_notify_endorsement();

create or replace function public.trg_notify_follow() returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform public.emit_notification(new.org_email, 'follow', public.profile_link(new.follower_email));
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists trg_notify_follow on public.follows;
create trigger trg_notify_follow after insert on public.follows for each row execute function public.trg_notify_follow();

create or replace function public.trg_notify_connection() returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    if tg_op = 'INSERT' then
      perform public.emit_notification(new.recipient_email, 'connection_request', '/connections');
    elsif tg_op = 'UPDATE' and new.status = 'accepted' and old.status <> 'accepted' then
      perform public.emit_notification(new.requester_email, 'connection_accepted', public.profile_link(new.recipient_email));
    end if;
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists trg_notify_connection on public.connections;
create trigger trg_notify_connection after insert or update on public.connections for each row execute function public.trg_notify_connection();

-- Unread count + mark-all-read in one round trip each.
create or replace function public.mark_all_notifications_read() returns integer
language sql security invoker set search_path = public as $$
  with u as (update public.notifications set read = true where recipient_email = public.current_account_email() and read = false returning 1)
  select count(*)::int from u
$$;
grant execute on function public.mark_all_notifications_read() to authenticated;

-- New job -> every follower of the posting organisation (set-based, server side).
create or replace function public.trg_notify_job() returns trigger language plpgsql security definer set search_path = public as $$
declare f record;
begin
  begin
    for f in select follower_email from follows where org_email = new.org_email loop
      perform public.emit_notification(f.follower_email, 'job_posted', '/job/' || new.id, 'job', new.id::text);
    end loop;
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists trg_notify_job on public.jobs;
create trigger trg_notify_job after insert on public.jobs for each row execute function public.trg_notify_job();
