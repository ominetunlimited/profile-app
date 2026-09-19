-- PROFILE backend — Phase A foundation schema.
-- Mirrors the existing client-side TypeScript shapes in src/app/*.ts as
-- closely as possible (Account/OrganisationAccount in accountTypes.ts,
-- ActivityRecord in activityStore.ts, ConnectionRecord in connectionStore.ts,
-- FollowRecord in followStore.ts, CommentRecord in commentStore.ts,
-- MessageRecord/ConversationSummary in messageStore.ts, NotificationRecord
-- in notificationStore.ts) rather than the Master Prompt's more elaborate
-- prose schema, per this project's own "extend in place" rule — the goal is
-- the existing ~40 store modules can be repointed at these tables with their
-- exported function signatures unchanged, not a rename sweep across 100+
-- screens. Reactions are modelled as one generic table (target_type/
-- target_id) reused by activities and comments, per the pipeline-repair
-- brief's R7.2, even though comment-reaction UI wiring is a later phase.

-- ============================================================
-- 1. accounts — one row per auth.users row, discriminated by account_type
-- ============================================================
create table if not exists public.accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  account_type text not null check (account_type in ('individual', 'organisation')),
  legal_name text not null,
  username text unique,
  country text not null,

  -- individual-only fields (accountTypes.ts IndividualAccount)
  pathway text check (pathway in ('professional', 'competence', 'hybrid')),
  career_stage text,
  preferred_display_name text,
  headline text,
  city text,
  state_or_region text,
  linked_in_url text,
  external_website_url text,
  phone text,

  -- organisation-only fields (accountTypes.ts OrganisationAccount)
  org_type text,
  official_email text,
  registry_level text check (registry_level in ('verified', 'recognized', 'user_submitted', 'rejected')),
  org_role text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists accounts_username_idx on public.accounts (lower(username));
create index if not exists accounts_email_idx on public.accounts (lower(email));

-- Real search needs typo-tolerant, case/diacritic-insensitive name matching
-- (Pipeline brief R4.4) — pg_trgm gives that without a separate search
-- service, which is enough for Phase A's "search works cross-device" goal.
create extension if not exists pg_trgm;
create index if not exists accounts_legal_name_trgm_idx on public.accounts using gin (legal_name gin_trgm_ops);

-- ============================================================
-- 2. activities — mirrors ActivityRecord in activityStore.ts exactly
-- ============================================================
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null references public.accounts(email) on delete cascade,
  type text not null,
  title text not null,
  description text not null default '',
  role text,
  organisation text,
  location text,
  skills text[] not null default '{}',
  tools text[] not null default '{}',
  collaborators text[] not null default '{}',
  cv_portfolio_include boolean not null default true,
  visibility text not null default 'public' check (visibility in ('public', 'connections_only', 'private')),
  created_at timestamptz not null default now()
);

create index if not exists activities_owner_idx on public.activities (owner_email);
create index if not exists activities_visibility_idx on public.activities (visibility);
create index if not exists activities_title_trgm_idx on public.activities using gin (title gin_trgm_ops);

-- ============================================================
-- 3. connections — mirrors ConnectionRecord in connectionStore.ts
-- ============================================================
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_email text not null references public.accounts(email) on delete cascade,
  recipient_email text not null references public.accounts(email) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (requester_email, recipient_email)
);

create index if not exists connections_recipient_idx on public.connections (recipient_email);

-- ============================================================
-- 4. follows — mirrors FollowRecord in followStore.ts
-- ============================================================
create table if not exists public.follows (
  follower_email text not null references public.accounts(email) on delete cascade,
  org_email text not null references public.accounts(email) on delete cascade,
  followed_at timestamptz not null default now(),
  primary key (follower_email, org_email)
);

-- ============================================================
-- 5. comments — mirrors CommentRecord in commentStore.ts
-- ============================================================
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  author_email text not null references public.accounts(email) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_activity_idx on public.comments (activity_id);

-- ============================================================
-- 6. reactions — generic target_type/target_id, reused by activities +
--    comments (pipeline-repair brief R7.2's "same reaction service" rule)
-- ============================================================
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('activity', 'comment')),
  target_id uuid not null,
  user_email text not null references public.accounts(email) on delete cascade,
  reaction_type text not null check (reaction_type in ('appreciate', 'respect', 'insightful', 'support', 'skilled', 'well_explained')),
  created_at timestamptz not null default now(),
  unique (target_type, target_id, user_email)
);

create index if not exists reactions_target_idx on public.reactions (target_type, target_id);

-- ============================================================
-- 7. conversations + participants + messages — mirrors messageStore.ts's
--    conversationIdFor() canonical-id scheme (sorted emails joined by '::')
-- ============================================================
create table if not exists public.conversations (
  id text primary key,
  conversation_type text not null default 'Collaboration' check (
    conversation_type in ('Hiring', 'Collaboration', 'Verification', 'Partnership', 'Consulting', 'Marketplace')
  ),
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id text not null references public.conversations(id) on delete cascade,
  participant_email text not null references public.accounts(email) on delete cascade,
  primary key (conversation_id, participant_email)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null references public.conversations(id) on delete cascade,
  sender_email text not null references public.accounts(email) on delete cascade,
  text text not null,
  sent_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, sent_at);

-- ============================================================
-- 8. notifications — mirrors NotificationRecord in notificationStore.ts
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null references public.accounts(email) on delete cascade,
  category text not null check (category in ('verification', 'messages', 'opportunities', 'community', 'security', 'marketing')),
  text text not null,
  deep_link text not null,
  created_at timestamptz not null default now(),
  read boolean not null default false
);

create index if not exists notifications_recipient_idx on public.notifications (recipient_email, created_at desc);

-- ============================================================
-- Helper function — one place to resolve "who is calling", explicit
-- search_path per Master Prompt §37.4 ("every SQL function must set
-- explicit search_path").
-- ============================================================
create or replace function public.current_account_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email from public.accounts where id = auth.uid()
$$;

-- ============================================================
-- Row Level Security — every table gets RLS enabled AND an explicit policy.
-- §37.5's own hard rule: "no table may ship with an unrestricted policy...
-- no policy defined is a security defect." This is the canView predicate
-- (§4.3 visibility + connection status) enforced in Postgres itself, not
-- just in application code.
-- ============================================================
alter table public.accounts enable row level security;
alter table public.activities enable row level security;
alter table public.connections enable row level security;
alter table public.follows enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- accounts: the directory is the whole point of fixing S1/S2 — public read
-- (including signed-out visitors, matching the brief's own share-link
-- requirement), write restricted to the row's own owner.
drop policy if exists accounts_select_all on public.accounts;
create policy accounts_select_all on public.accounts for select using (true);
drop policy if exists accounts_insert_self on public.accounts;
create policy accounts_insert_self on public.accounts for insert with check (auth.uid() = id);
drop policy if exists accounts_update_self on public.accounts;
create policy accounts_update_self on public.accounts for update using (auth.uid() = id);

-- activities: public / owner / accepted-connection, never anything else.
drop policy if exists activities_select on public.activities;
create policy activities_select on public.activities for select using (
  visibility = 'public'
  or owner_email = public.current_account_email()
  or (
    visibility = 'connections_only'
    and exists (
      select 1 from public.connections c
      where c.status = 'accepted'
        and (
          (c.requester_email = activities.owner_email and c.recipient_email = public.current_account_email())
          or (c.recipient_email = activities.owner_email and c.requester_email = public.current_account_email())
        )
    )
  )
);
drop policy if exists activities_insert_self on public.activities;
create policy activities_insert_self on public.activities for insert with check (owner_email = public.current_account_email());
drop policy if exists activities_update_self on public.activities;
create policy activities_update_self on public.activities for update using (owner_email = public.current_account_email());
drop policy if exists activities_delete_self on public.activities;
create policy activities_delete_self on public.activities for delete using (owner_email = public.current_account_email());

-- connections: only the two participants ever see or act on a request.
drop policy if exists connections_select_participant on public.connections;
create policy connections_select_participant on public.connections for select using (
  requester_email = public.current_account_email() or recipient_email = public.current_account_email()
);
drop policy if exists connections_insert_self on public.connections;
create policy connections_insert_self on public.connections for insert with check (requester_email = public.current_account_email());
drop policy if exists connections_update_participant on public.connections;
create policy connections_update_participant on public.connections for update using (
  requester_email = public.current_account_email() or recipient_email = public.current_account_email()
);

-- follows: follower counts are shown publicly on org profiles (§24.2), so
-- read is public; only the follower can create/remove their own follow.
drop policy if exists follows_select_all on public.follows;
create policy follows_select_all on public.follows for select using (true);
drop policy if exists follows_insert_self on public.follows;
create policy follows_insert_self on public.follows for insert with check (follower_email = public.current_account_email());
drop policy if exists follows_delete_self on public.follows;
create policy follows_delete_self on public.follows for delete using (follower_email = public.current_account_email());

-- comments: visible exactly where the parent activity is visible (same
-- canView predicate, joined through).
drop policy if exists comments_select_via_activity on public.comments;
create policy comments_select_via_activity on public.comments for select using (
  exists (
    select 1 from public.activities a
    where a.id = comments.activity_id
      and (
        a.visibility = 'public'
        or a.owner_email = public.current_account_email()
        or (
          a.visibility = 'connections_only'
          and exists (
            select 1 from public.connections c
            where c.status = 'accepted'
              and (
                (c.requester_email = a.owner_email and c.recipient_email = public.current_account_email())
                or (c.recipient_email = a.owner_email and c.requester_email = public.current_account_email())
              )
          )
        )
      )
  )
);
drop policy if exists comments_insert_self on public.comments;
create policy comments_insert_self on public.comments for insert with check (author_email = public.current_account_email());
drop policy if exists comments_delete_self on public.comments;
create policy comments_delete_self on public.comments for delete using (author_email = public.current_account_email());

-- reactions: raw rows (which reveal WHO reacted) are readable only by the
-- reactor themselves — totals are exposed instead via the public
-- reaction_counts view below, per Constraint 1's "individual choices not
-- public" rule and the brief's own R7.1 REACTION_RULES.
drop policy if exists reactions_select_self on public.reactions;
create policy reactions_select_self on public.reactions for select using (user_email = public.current_account_email());
drop policy if exists reactions_upsert_self on public.reactions;
create policy reactions_upsert_self on public.reactions for insert with check (user_email = public.current_account_email());
drop policy if exists reactions_update_self on public.reactions;
create policy reactions_update_self on public.reactions for update using (user_email = public.current_account_email());
drop policy if exists reactions_delete_self on public.reactions;
create policy reactions_delete_self on public.reactions for delete using (user_email = public.current_account_email());

-- conversations/messages: participants only, ever.
drop policy if exists conversations_select_participant on public.conversations;
create policy conversations_select_participant on public.conversations for select using (
  exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversations.id and cp.participant_email = public.current_account_email()
  )
);
drop policy if exists conversations_insert_participant on public.conversations;
create policy conversations_insert_participant on public.conversations for insert with check (true);

drop policy if exists conversation_participants_select on public.conversation_participants;
create policy conversation_participants_select on public.conversation_participants for select using (
  participant_email = public.current_account_email()
);
drop policy if exists conversation_participants_insert on public.conversation_participants;
create policy conversation_participants_insert on public.conversation_participants for insert with check (
  participant_email = public.current_account_email()
);

drop policy if exists messages_select_participant on public.messages;
create policy messages_select_participant on public.messages for select using (
  exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id and cp.participant_email = public.current_account_email()
  )
);
drop policy if exists messages_insert_participant on public.messages;
create policy messages_insert_participant on public.messages for insert with check (
  sender_email = public.current_account_email()
  and exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id and cp.participant_email = public.current_account_email()
  )
);

-- notifications: any authenticated user may create one addressed to someone
-- else (that's how a comment/follow/etc. notifies its target), but only the
-- recipient can ever read or mark their own as read.
drop policy if exists notifications_select_recipient on public.notifications;
create policy notifications_select_recipient on public.notifications for select using (
  recipient_email = public.current_account_email()
);
drop policy if exists notifications_insert_any_authenticated on public.notifications;
create policy notifications_insert_any_authenticated on public.notifications for insert with check (auth.role() = 'authenticated');
drop policy if exists notifications_update_recipient on public.notifications;
create policy notifications_update_recipient on public.notifications for update using (
  recipient_email = public.current_account_email()
);

-- Public, anonymised reaction totals — never exposes who reacted, only
-- counts per target, matching Constraint 1's "totals public, individual
-- choices private, never a ranking input" rule. Deliberately NOT
-- security_invoker: this must aggregate every user's reactions regardless
-- of who's asking, which is exactly the one place running as the view's
-- definer (bypassing each caller's own row-level restriction on the base
-- table) is correct rather than a bug — the view itself only ever exposes
-- a count, never the underlying user_email column.
create or replace view public.reaction_counts as
select target_type, target_id, reaction_type, count(*) as total
from public.reactions
group by target_type, target_id, reaction_type;

grant select on public.reaction_counts to anon, authenticated;
