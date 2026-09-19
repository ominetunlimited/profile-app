-- Pipeline repair Phase A — the `accounts` cache in demoAccountStore.ts is
-- kept live across devices via a Realtime subscription (postgres_changes),
-- which requires the table to be in the `supabase_realtime` publication.
alter publication supabase_realtime add table public.accounts;
