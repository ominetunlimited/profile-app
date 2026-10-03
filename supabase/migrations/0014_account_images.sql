-- Canonical avatar + cover: one server-side source of truth on the account row,
-- readable by every user/device (replaces the per-browser localStorage store).
alter table public.accounts add column if not exists avatar_url text;
alter table public.accounts add column if not exists cover_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('account-images', 'account-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Path convention: `{auth.uid}/{avatar|cover}-{timestamp}.{ext}`; only the owner may write under their own folder.
do $$
begin
  create policy account_images_insert_own on storage.objects for insert to authenticated
    with check (bucket_id = 'account-images' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$
begin
  create policy account_images_delete_own on storage.objects for delete to authenticated
    using (bucket_id = 'account-images' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$
begin
  create policy account_images_select_all on storage.objects for select
    using (bucket_id = 'account-images');
exception when duplicate_object then null; end $$;
