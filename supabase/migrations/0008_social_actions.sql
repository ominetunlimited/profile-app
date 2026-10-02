-- Phase 2 — platform-wide social actions: polymorphic reactions/comments
-- (activity | job | advert | repost), reposts with commentary, bookmarks,
-- recommendations (endorsements), and REAL adverts (ad_campaigns was
-- localStorage-only, so one user's ad could never be seen by another).

-- ------------------------------------------------------------------ helpers
create or replace function public.are_connected(a text, b text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.connections c
    where c.status = 'accepted'
      and ((c.requester_email = lower(a) and c.recipient_email = lower(b))
        or (c.requester_email = lower(b) and c.recipient_email = lower(a)))
  )
$$;

-- ------------------------------------------------------------- ad_campaigns
create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_email text not null references public.accounts(email) on delete cascade,
  ad_type text not null,
  title text not null,
  description text not null default '',
  destination text not null default '',
  target_country text,
  placements text[] not null default '{}',
  duration_days integer not null check (duration_days > 0),
  estimated_cost_usd numeric not null default 0,
  status text not null default 'draft' check (status in ('draft', 'pending_payment', 'active', 'ended')),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ends_at timestamptz
);
create index if not exists ad_campaigns_advertiser_idx on public.ad_campaigns (advertiser_email);
create index if not exists ad_campaigns_active_idx on public.ad_campaigns (status, ends_at);
alter table public.ad_campaigns enable row level security;

-- Anyone signed in sees live, non-expired campaigns (that's what an ad is);
-- advertisers additionally see their own drafts/ended campaigns.
drop policy if exists ad_campaigns_select on public.ad_campaigns;
create policy ad_campaigns_select on public.ad_campaigns for select using (
  advertiser_email = public.current_account_email()
  or (status = 'active' and (ends_at is null or ends_at > now()))
);
drop policy if exists ad_campaigns_insert_own on public.ad_campaigns;
create policy ad_campaigns_insert_own on public.ad_campaigns for insert with check (advertiser_email = public.current_account_email());
drop policy if exists ad_campaigns_update_own on public.ad_campaigns;
create policy ad_campaigns_update_own on public.ad_campaigns for update
  using (advertiser_email = public.current_account_email()) with check (advertiser_email = public.current_account_email());
drop policy if exists ad_campaigns_delete_own on public.ad_campaigns;
create policy ad_campaigns_delete_own on public.ad_campaigns for delete using (advertiser_email = public.current_account_email() and status = 'draft');

-- ------------------------------------------------------------------- reposts
create table if not exists public.reposts (
  id uuid primary key default gen_random_uuid(),
  reposter_email text not null references public.accounts(email) on delete cascade,
  original_type text not null check (original_type in ('activity', 'job', 'advert')),
  original_id uuid not null,
  original_author_email text not null references public.accounts(email) on delete cascade,
  commentary text,
  visibility text not null default 'public' check (visibility in ('public', 'connections_only', 'private')),
  status text not null default 'active' check (status in ('active', 'removed')),
  created_at timestamptz not null default now(),
  unique (reposter_email, original_type, original_id)
);
create index if not exists reposts_reposter_idx on public.reposts (reposter_email, created_at desc);
create index if not exists reposts_original_idx on public.reposts (original_type, original_id);
alter table public.reposts enable row level security;

-- Visibility of the things a social row can point at. SECURITY INVOKER on
-- purpose: each branch runs under the caller's own RLS, so "can I see the
-- target" is answered by the target's own policy, never duplicated here.
create or replace function public.can_view_target(t text, tid uuid)
returns boolean language sql stable set search_path = public as $$
  select case t
    when 'activity' then exists (select 1 from public.activities a where a.id = tid)
    when 'job' then exists (select 1 from public.jobs j where j.id = tid)
    when 'advert' then exists (select 1 from public.ad_campaigns c where c.id = tid)
    when 'repost' then exists (select 1 from public.reposts r where r.id = tid)
    when 'comment' then exists (select 1 from public.comments c where c.id = tid)
    else false
  end
$$;

drop policy if exists reposts_select on public.reposts;
create policy reposts_select on public.reposts for select using (
  reposter_email = public.current_account_email()
  or (
    status = 'active'
    and not public.is_blocked_pair(reposter_email, public.current_account_email())
    and public.can_view_target(original_type, original_id)
    and (visibility = 'public' or (visibility = 'connections_only' and public.are_connected(reposter_email, public.current_account_email())))
  )
);
drop policy if exists reposts_insert on public.reposts;
create policy reposts_insert on public.reposts for insert with check (
  reposter_email = public.current_account_email()
  and public.can_view_target(original_type, original_id)
  and not public.is_blocked_pair(reposter_email, original_author_email)
);
drop policy if exists reposts_update_own on public.reposts;
create policy reposts_update_own on public.reposts for update
  using (reposter_email = public.current_account_email()) with check (reposter_email = public.current_account_email());
drop policy if exists reposts_delete_own on public.reposts;
create policy reposts_delete_own on public.reposts for delete using (reposter_email = public.current_account_email());

-- ----------------------------------------------------------------- bookmarks
create table if not exists public.bookmarks (
  user_email text not null references public.accounts(email) on delete cascade,
  target_type text not null check (target_type in ('activity', 'job', 'advert', 'repost')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_email, target_type, target_id)
);
alter table public.bookmarks enable row level security;
drop policy if exists bookmarks_select_self on public.bookmarks;
create policy bookmarks_select_self on public.bookmarks for select using (user_email = public.current_account_email());
drop policy if exists bookmarks_insert_self on public.bookmarks;
create policy bookmarks_insert_self on public.bookmarks for insert
  with check (user_email = public.current_account_email() and public.can_view_target(target_type, target_id));
drop policy if exists bookmarks_delete_self on public.bookmarks;
create policy bookmarks_delete_self on public.bookmarks for delete using (user_email = public.current_account_email());

-- ------------------------------------------------ recommendations (endorse)
create table if not exists public.endorsements (
  user_email text not null references public.accounts(email) on delete cascade,
  target_type text not null check (target_type in ('activity', 'job', 'advert', 'repost')),
  target_id uuid not null,
  note text,
  created_at timestamptz not null default now(),
  primary key (user_email, target_type, target_id)
);
create index if not exists endorsements_target_idx on public.endorsements (target_type, target_id);
alter table public.endorsements enable row level security;
-- Public social proof: visible to whoever can see the thing being recommended.
drop policy if exists endorsements_select on public.endorsements;
create policy endorsements_select on public.endorsements for select using (
  user_email = public.current_account_email() or public.can_view_target(target_type, target_id)
);
drop policy if exists endorsements_insert_self on public.endorsements;
create policy endorsements_insert_self on public.endorsements for insert
  with check (user_email = public.current_account_email() and public.can_view_target(target_type, target_id));
drop policy if exists endorsements_delete_self on public.endorsements;
create policy endorsements_delete_self on public.endorsements for delete using (user_email = public.current_account_email());

-- ----------------------------------------- comments → polymorphic + replies
alter table public.comments
  add column if not exists target_type text not null default 'activity',
  add column if not exists target_id uuid,
  add column if not exists parent_comment_id uuid references public.comments(id) on delete cascade;
update public.comments set target_id = activity_id where target_id is null;
alter table public.comments alter column target_id set not null;
alter table public.comments alter column activity_id drop not null;
alter table public.comments drop constraint if exists comments_target_type_check;
alter table public.comments add constraint comments_target_type_check check (target_type in ('activity', 'job', 'advert', 'repost'));
create index if not exists comments_target_idx on public.comments (target_type, target_id, created_at);

drop policy if exists comments_select_via_activity on public.comments;
drop policy if exists comments_select_via_target on public.comments;
create policy comments_select_via_target on public.comments for select using (
  not public.is_blocked_pair(author_email, public.current_account_email())
  and public.can_view_target(target_type, target_id)
);
drop policy if exists comments_insert_self on public.comments;
create policy comments_insert_self on public.comments for insert with check (
  author_email = public.current_account_email() and public.can_view_target(target_type, target_id)
);

-- ------------------------------------------------ reactions on more targets
alter table public.reactions drop constraint if exists reactions_target_type_check;
alter table public.reactions add constraint reactions_target_type_check check (target_type in ('activity', 'comment', 'job', 'advert', 'repost'));
drop policy if exists reactions_upsert_self on public.reactions;
create policy reactions_upsert_self on public.reactions for insert
  with check (user_email = public.current_account_email() and public.can_view_target(target_type, target_id));

-- ------------------------------------------- anonymised engagement totals
-- Counts only, never identities (same stance as reaction_counts); definer so
-- it aggregates across every user.
create or replace view public.engagement_counts as
  select target_type, target_id, 'comment'::text as kind, count(*)::int as total
    from public.comments group by target_type, target_id
  union all
  select original_type, original_id, 'repost'::text, count(*)::int
    from public.reposts where status = 'active' group by original_type, original_id
  union all
  select target_type, target_id, 'endorsement'::text, count(*)::int
    from public.endorsements group by target_type, target_id;
grant select on public.engagement_counts to anon, authenticated;

-- ---------------------------------------------------- realtime publication
do $$
declare t text;
begin
  foreach t in array array['ad_campaigns', 'reposts', 'bookmarks', 'endorsements']
  loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Keep the currently-deployed client working during rollout: it still inserts
-- only activity_id, so derive the polymorphic target from it.
create or replace function public.comments_default_target() returns trigger language plpgsql as $$
begin
  if new.target_id is null then new.target_id := new.activity_id; end if;
  return new;
end $$;
drop trigger if exists comments_default_target on public.comments;
create trigger comments_default_target before insert on public.comments for each row execute function public.comments_default_target();
