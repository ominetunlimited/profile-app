-- Pipeline repair Phase A continued — connectionStore.ts's removeConnection
-- (used by ConnectionsPage.tsx to disconnect) had no matching DELETE policy
-- in 0001, so every real disconnect attempt was silently a no-op (RLS
-- filters deletes to 0 affected rows rather than erroring). Participant-only,
-- same shape as connections_update_participant.
do $$
begin
  create policy connections_delete_participant on public.connections for delete
    using (requester_email = current_account_email() or recipient_email = current_account_email());
exception when duplicate_object then
  null;
end $$;
