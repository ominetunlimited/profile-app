-- §11.4 Organisation Mention System + §5.2 "Activity (org mentioned) → Org
-- Notification" — closes the last missing Feature-Linkage row. When a recorded
-- activity names a registered organisation, that organisation's account is
-- notified in-app (and by email, per its 'profile' preference) exactly as the
-- Master Prompt specifies: "[User Name] referenced [Organisation] in a
-- professional activity. Review and verify."
--
-- Registered the same way as every other event — one row in the central
-- notification_event_types table — so it flows through the identical
-- emit_notification engine (eligibility, block/self/mute checks, preference
-- gating, text templating, grouping) with no bespoke client logic. Idempotent
-- via the existing on-conflict upsert, matching migration 0009's own pattern.
insert into public.notification_event_types (event_type, category, mandatory, self_allowed, group_window, template) values
  ('org_mention', 'profile', false, false, null, '{actor} referenced you in a professional activity: "{title}".')
on conflict (event_type) do update set
  category = excluded.category, mandatory = excluded.mandatory, self_allowed = excluded.self_allowed,
  group_window = excluded.group_window, template = excluded.template;
