-- Real activity media-upload pipeline (§11.4 COMPOSER_UPLOAD_SPEC, §37.21
-- file-upload security, §50.10.5 processing pipeline). Polymorphic
-- target_type/target_id, same pattern as `reactions`/`comments` — 'activity'
-- for the Composer today, 'credential' reserved for TrustPassport's identity-
-- document upload (wired in the same pass, closing its existing "PDF storage
-- needs a real file backend" gap).
--
-- Honest scope note: §37.21/§50.10.5 specify resumable uploads up to 20GB,
-- server-side virus scanning, and automatic thumbnail/preview generation.
-- This is a direct (non-resumable) Supabase Storage upload with a practical
-- client-side size cap, no virus scanning, no server-side thumbnailing —
-- flagged here and in the client code, not silently narrowed.
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null references public.accounts(email) on delete cascade,
  target_type text not null check (target_type in ('activity', 'credential')),
  target_id text not null,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  file_category text not null check (file_category in ('image', 'video', 'audio', 'pdf', 'docx', 'pptx', 'xlsx', 'epub', 'other')),
  size_bytes bigint not null,
  -- §11.4/§50.10.8's Copyright ID — the Master Prompt itself is inconsistent
  -- on exact digit count (#PRF-YYYY-XXXX vs -XXXXXX elsewhere); picked 6
  -- alphanumeric characters here and documented the choice rather than
  -- silently picking one with no record of the discrepancy.
  copyright_id text not null unique,
  content_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists media_assets_target_idx on public.media_assets (target_type, target_id);
create index if not exists media_assets_owner_idx on public.media_assets (owner_email);
create index if not exists media_assets_content_hash_idx on public.media_assets (content_hash);

alter table public.media_assets enable row level security;

-- Visible to whoever can see the parent entity — mirrors activities' own
-- visibility rule exactly (same EXISTS shape as comments_select_via_activity
-- in 0001_init.sql). 'credential' rows are owner-only (identity documents
-- are never public).
create policy media_assets_select_via_target on public.media_assets for select
  using (
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
  );

create policy media_assets_insert_self on public.media_assets for insert
  with check (owner_email = current_account_email());
create policy media_assets_delete_self on public.media_assets for delete
  using (owner_email = current_account_email());

do $$
begin
  alter publication supabase_realtime add table public.media_assets;
exception when duplicate_object then
  null;
end $$;

-- Storage bucket — private (public = false): every read goes through a
-- signed, time-limited URL (§37.21's own requirement for private files),
-- which Supabase only issues if the requester's RLS check below passes.
insert into storage.buckets (id, name, public, file_size_limit)
values ('activity-media', 'activity-media', false, 52428800) -- 50MB practical cap, see note above re: the spec's 20GB/resumable requirement
on conflict (id) do nothing;

-- Path convention: `{owner_email}/{media_asset_id}/{filename}` — the first
-- path segment is the uploader's own email, which is what makes the upload
-- policy a simple prefix check.
do $$
begin
  create policy activity_media_insert_own_prefix on storage.objects for insert
    with check (bucket_id = 'activity-media' and (storage.foldername(name))[1] = current_account_email());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy activity_media_delete_own_prefix on storage.objects for delete
    using (bucket_id = 'activity-media' and (storage.foldername(name))[1] = current_account_email());
exception when duplicate_object then null;
end $$;

-- Read (and createSignedUrl, which itself requires a passing SELECT policy)
-- mirrors media_assets' own visibility rule by joining back to it via path.
do $$
begin
  create policy activity_media_select_via_asset on storage.objects for select
    using (
      bucket_id = 'activity-media' and exists (
        select 1 from public.media_assets ma
        where ma.storage_path = storage.objects.name
      )
    );
exception when duplicate_object then null;
end $$;
