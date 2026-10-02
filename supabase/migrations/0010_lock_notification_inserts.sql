-- Applied after the Phase 3 client was deployed: notifications can now only be
-- created by the server-side engine (emit_notification / trg_notify_*), which
-- composes the text itself. The old policy let any signed-in user insert any
-- text for any recipient (a phishing/spam vector).
drop policy if exists notifications_insert_any_authenticated on public.notifications;
