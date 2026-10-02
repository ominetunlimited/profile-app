-- Phase 1 — real-time chat: atomic conversation start, blocks, reactions,
-- attachments, read state, soft delete, authorised realtime channels.
--
-- SECURITY FIX folded in: 0001 let any signed-in user insert THEMSELVES into
-- any conversation (conversation ids are sorted emails, so guessable) and
-- then read its messages. Membership now changes only through SECURITY
-- DEFINER functions below; the open insert policies are dropped.

-- ---------------------------------------------------------------- blocks
create table if not exists public.user_blocks (
  blocker_email text not null references public.accounts(email) on delete cascade,
  blocked_email text not null references public.accounts(email) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_email, blocked_email),
  check (blocker_email <> blocked_email)
);
alter table public.user_blocks enable row level security;
drop policy if exists user_blocks_select_self on public.user_blocks;
create policy user_blocks_select_self on public.user_blocks for select using (blocker_email = public.current_account_email());
drop policy if exists user_blocks_insert_self on public.user_blocks;
create policy user_blocks_insert_self on public.user_blocks for insert with check (blocker_email = public.current_account_email());
drop policy if exists user_blocks_delete_self on public.user_blocks;
create policy user_blocks_delete_self on public.user_blocks for delete using (blocker_email = public.current_account_email());

-- Either direction. SECURITY DEFINER so a blocked user can be refused
-- without ever being able to read who blocked them.
create or replace function public.is_blocked_pair(a text, b text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_blocks
    where (blocker_email = lower(a) and blocked_email = lower(b))
       or (blocker_email = lower(b) and blocked_email = lower(a))
  )
$$;

-- --------------------------------------------------- membership helpers
create or replace function public.is_conversation_member(conv text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conv and cp.participant_email = public.current_account_email()
  )
$$;

create or replace function public.conversation_has_block(conv text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conv
      and cp.participant_email <> public.current_account_email()
      and public.is_blocked_pair(public.current_account_email(), cp.participant_email)
  )
$$;

-- ------------------------------------------------- atomic conversation start
create or replace function public.start_conversation(other_email text)
returns text language plpgsql security definer set search_path = public as $$
declare
  me text := public.current_account_email();
  other text := lower(other_email);
  conv text;
begin
  if me is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if other = me then raise exception 'cannot start a conversation with yourself'; end if;
  if not exists (select 1 from public.accounts where email = other) then
    raise exception 'recipient not found';
  end if;
  if public.is_blocked_pair(me, other) then
    raise exception 'conversation unavailable' using errcode = '42501';
  end if;
  conv := case when me < other then me || '::' || other else other || '::' || me end;
  insert into public.conversations (id) values (conv) on conflict (id) do nothing;
  insert into public.conversation_participants (conversation_id, participant_email)
    values (conv, me), (conv, other) on conflict do nothing;
  return conv;
end $$;
revoke all on function public.start_conversation(text) from public;
grant execute on function public.start_conversation(text) to authenticated;

-- Backfill: every pre-existing 1:1 conversation gets both participants, so
-- recipients who never opened a thread now receive it.
insert into public.conversation_participants (conversation_id, participant_email)
select c.id, e.email
from public.conversations c
cross join lateral unnest(string_to_array(c.id, '::')) as e(email)
where c.id like '%::%' and exists (select 1 from public.accounts a where a.email = e.email)
on conflict do nothing;

-- Close the membership hole: no direct client inserts.
drop policy if exists conversations_insert_participant on public.conversations;
drop policy if exists conversation_participants_insert on public.conversation_participants;

-- ---------------------------------------------- participants: read state
alter table public.conversation_participants
  add column if not exists last_read_at timestamptz not null default now(),
  add column if not exists muted boolean not null default false,
  add column if not exists archived boolean not null default false;

-- Members can see each other's rows (needed for read receipts).
drop policy if exists conversation_participants_select on public.conversation_participants;
create policy conversation_participants_select on public.conversation_participants for select using (
  public.is_conversation_member(conversation_id)
);
drop policy if exists conversation_participants_update_self on public.conversation_participants;
create policy conversation_participants_update_self on public.conversation_participants for update
  using (participant_email = public.current_account_email())
  with check (participant_email = public.current_account_email());

-- ------------------------------------------------------- messages upgrades
alter table public.messages
  add column if not exists client_id uuid,
  add column if not exists reply_to uuid references public.messages(id) on delete set null,
  add column if not exists deleted_at timestamptz,
  add column if not exists kind text not null default 'text' check (kind in ('text', 'attachment', 'shared_item'));

-- Idempotent sends: a retried send with the same client_id is a no-op.
create unique index if not exists messages_client_id_uniq on public.messages (conversation_id, client_id) where client_id is not null;
create index if not exists messages_conversation_recent_idx on public.messages (conversation_id, sent_at desc);

-- Only soft-delete is mutable on a message; the sender cannot rewrite history.
create or replace function public.messages_guard_update() returns trigger language plpgsql as $$
begin
  if new.id is distinct from old.id or new.conversation_id is distinct from old.conversation_id
     or new.sender_email is distinct from old.sender_email or new.text is distinct from old.text
     or new.sent_at is distinct from old.sent_at or new.client_id is distinct from old.client_id
     or new.reply_to is distinct from old.reply_to or new.kind is distinct from old.kind then
    raise exception 'messages are immutable except deleted_at';
  end if;
  return new;
end $$;
drop trigger if exists messages_guard_update on public.messages;
create trigger messages_guard_update before update on public.messages for each row execute function public.messages_guard_update();

drop policy if exists messages_update_own_delete on public.messages;
create policy messages_update_own_delete on public.messages for update
  using (sender_email = public.current_account_email())
  with check (sender_email = public.current_account_email());

-- Replace insert policy: must be a member AND no block with any other member.
drop policy if exists messages_insert_participant on public.messages;
create policy messages_insert_participant on public.messages for insert with check (
  sender_email = public.current_account_email()
  and public.is_conversation_member(conversation_id)
  and not public.conversation_has_block(conversation_id)
);

-- --------------------------------------------------- message reactions
create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_email text not null references public.accounts(email) on delete cascade,
  type text not null check (type in ('appreciate', 'respect', 'insightful', 'support', 'skilled', 'well_explained')),
  created_at timestamptz not null default now(),
  primary key (message_id, user_email)
);
create index if not exists message_reactions_message_idx on public.message_reactions (message_id);
alter table public.message_reactions enable row level security;

create or replace function public.can_see_message(mid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.messages m
    where m.id = mid and public.is_conversation_member(m.conversation_id)
  )
$$;

drop policy if exists message_reactions_select on public.message_reactions;
create policy message_reactions_select on public.message_reactions for select using (public.can_see_message(message_id));
drop policy if exists message_reactions_insert on public.message_reactions;
create policy message_reactions_insert on public.message_reactions for insert
  with check (user_email = public.current_account_email() and public.can_see_message(message_id));
drop policy if exists message_reactions_update on public.message_reactions;
create policy message_reactions_update on public.message_reactions for update
  using (user_email = public.current_account_email()) with check (user_email = public.current_account_email());
drop policy if exists message_reactions_delete on public.message_reactions;
create policy message_reactions_delete on public.message_reactions for delete using (user_email = public.current_account_email());

-- ------------------------------------------------------ message attachments
create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  owner_email text not null references public.accounts(email) on delete cascade,
  storage_path text not null,
  preview_path text,
  thumb_path text,
  file_name text not null,
  mime_type text not null,
  file_category text not null check (file_category in ('image', 'audio', 'pdf', 'zip', 'video', 'docx', 'pptx', 'xlsx', 'epub', 'other')),
  size_bytes bigint not null,
  content_hash text not null,
  width integer,
  height integer,
  duration_seconds numeric,
  created_at timestamptz not null default now()
);
create index if not exists message_attachments_message_idx on public.message_attachments (message_id);
alter table public.message_attachments enable row level security;

drop policy if exists message_attachments_select on public.message_attachments;
create policy message_attachments_select on public.message_attachments for select using (public.can_see_message(message_id));
drop policy if exists message_attachments_insert on public.message_attachments;
create policy message_attachments_insert on public.message_attachments for insert with check (
  owner_email = public.current_account_email()
  and exists (select 1 from public.messages m where m.id = message_id and m.sender_email = public.current_account_email())
);
drop policy if exists message_attachments_delete on public.message_attachments;
create policy message_attachments_delete on public.message_attachments for delete using (owner_email = public.current_account_email());

-- Private bucket; objects readable only by members of the message's conversation
-- (the EXISTS inherits message_attachments' own RLS, same trick as 0006).
insert into storage.buckets (id, name, public, file_size_limit)
values ('message-media', 'message-media', false, 52428800)
on conflict (id) do nothing;

drop policy if exists message_media_insert on storage.objects;
create policy message_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'message-media' and (storage.foldername(name))[1] = public.current_account_email());
drop policy if exists message_media_delete on storage.objects;
create policy message_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'message-media' and (storage.foldername(name))[1] = public.current_account_email());
drop policy if exists message_media_select on storage.objects;
create policy message_media_select on storage.objects for select to authenticated using (
  bucket_id = 'message-media' and (
    (storage.foldername(name))[1] = public.current_account_email()
    or exists (
      select 1 from public.message_attachments ma
      where name in (ma.storage_path, ma.preview_path, ma.thumb_path)
    )
  )
);

-- ------------------------------------------- authorised realtime channels
-- Typing/presence travel on private channels named `conv:<conversation_id>`;
-- only members of that conversation may join or broadcast on them.
drop policy if exists conv_channel_select on realtime.messages;
create policy conv_channel_select on realtime.messages for select to authenticated
  using (realtime.topic() like 'conv:%' and public.is_conversation_member(substring(realtime.topic() from 6)));
drop policy if exists conv_channel_insert on realtime.messages;
create policy conv_channel_insert on realtime.messages for insert to authenticated
  with check (realtime.topic() like 'conv:%' and public.is_conversation_member(substring(realtime.topic() from 6)));

-- ------------------------------------------------------- realtime publication
do $$
declare t text;
begin
  foreach t in array array['messages', 'conversation_participants', 'message_reactions', 'message_attachments']
  loop
    if not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ------------------------------------------- conversation list in one query
-- security INVOKER: RLS still decides which conversations/messages are visible.
create or replace function public.my_conversations()
returns table (
  conversation_id text,
  other_email text,
  last_message_id uuid,
  last_text text,
  last_sender text,
  last_sent_at timestamptz,
  last_kind text,
  last_deleted boolean,
  unread_count bigint,
  muted boolean,
  archived boolean,
  my_last_read_at timestamptz,
  other_last_read_at timestamptz
)
language sql stable set search_path = public as $$
  with me as (select public.current_account_email() as email)
  select
    c.id,
    o.participant_email,
    lm.id, lm.text, lm.sender_email, lm.sent_at, lm.kind, (lm.deleted_at is not null),
    (select count(*) from public.messages m
       where m.conversation_id = c.id and m.sent_at > cp.last_read_at
         and m.sender_email <> (select email from me) and m.deleted_at is null),
    cp.muted, cp.archived, cp.last_read_at, o.last_read_at
  from public.conversation_participants cp
  join public.conversations c on c.id = cp.conversation_id
  left join public.conversation_participants o
    on o.conversation_id = c.id and o.participant_email <> cp.participant_email
  left join lateral (
    select * from public.messages m where m.conversation_id = c.id order by m.sent_at desc limit 1
  ) lm on true
  where cp.participant_email = (select email from me)
  order by coalesce(lm.sent_at, c.created_at) desc
$$;
grant execute on function public.my_conversations() to authenticated;

-- ---------------------------------------------------- send-rate limiting
-- RLS cannot rate-limit; this trigger caps a sender at 120 messages/minute.
create or replace function public.messages_rate_limit() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.messages
        where sender_email = new.sender_email and sent_at > now() - interval '1 minute') >= 120 then
    raise exception 'rate limit exceeded' using errcode = '54000';
  end if;
  return new;
end $$;
drop trigger if exists messages_rate_limit on public.messages;
create trigger messages_rate_limit before insert on public.messages for each row execute function public.messages_rate_limit();
create index if not exists messages_sender_recent_idx on public.messages (sender_email, sent_at desc);

-- ------------------------------------------ generic reports (reused later)
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_email text not null references public.accounts(email) on delete cascade,
  target_type text not null check (target_type in ('message', 'user', 'activity', 'comment', 'community', 'community_post', 'job', 'advert')),
  target_id text not null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'actioned', 'dismissed')),
  created_at timestamptz not null default now()
);
alter table public.content_reports enable row level security;
drop policy if exists content_reports_insert_self on public.content_reports;
create policy content_reports_insert_self on public.content_reports for insert with check (reporter_email = public.current_account_email());
drop policy if exists content_reports_select_self on public.content_reports;
create policy content_reports_select_self on public.content_reports for select using (reporter_email = public.current_account_email());
drop policy if exists content_reports_select_admin on public.content_reports;
create policy content_reports_select_admin on public.content_reports for select using (
  exists (select 1 from public.platform_admins pa where pa.id = auth.uid() and pa.status = 'active')
);
drop policy if exists content_reports_update_admin on public.content_reports;
create policy content_reports_update_admin on public.content_reports for update using (
  exists (select 1 from public.platform_admins pa where pa.id = auth.uid() and pa.status = 'active')
);

-- Server-clock read marker (client clocks skew; unread math must use one clock).
create or replace function public.mark_conversation_read(conv text) returns void
language sql security invoker set search_path = public as $$
  update public.conversation_participants set last_read_at = now()
  where conversation_id = conv and participant_email = public.current_account_email()
$$;
grant execute on function public.mark_conversation_read(text) to authenticated;

-- ------------------------------------------ activity media: optimised variants
alter table public.media_assets
  add column if not exists preview_path text,
  add column if not exists thumb_path text,
  add column if not exists width integer,
  add column if not exists height integer;

drop policy if exists activity_media_select_via_asset on storage.objects;
drop policy if exists activity_media_select on storage.objects;
create policy activity_media_select on storage.objects for select to authenticated using (
  bucket_id = 'activity-media' and (
    (storage.foldername(name))[1] = public.current_account_email()
    or exists (
      select 1 from public.media_assets ma
      where name in (ma.storage_path, ma.preview_path, ma.thumb_path)
    )
  )
);
