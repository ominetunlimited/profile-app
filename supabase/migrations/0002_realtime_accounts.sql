-- Pipeline repair Phase A — the `accounts` cache in demoAccountStore.ts is
-- kept live across devices via a Realtime subscription (postgres_changes),
-- which requires the table to be in the `supabase_realtime` publication.
-- Wrapped in a DO block so re-running this migration (e.g. pasted into the
-- SQL editor a second time, or after it was already applied via the
-- Management API) is a no-op instead of erroring with 42710 duplicate_object.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
