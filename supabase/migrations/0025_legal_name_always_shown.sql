-- PROFILE is built on authenticity: a person's verified legal name is always the name shown. There is no setting to hide it
-- and no alias to show in its place, so both columns are removed and the functions that read them use the legal name.

do $$
declare def text;
begin
  select pg_get_functiondef('public.get_shared_passport(uuid)'::regprocedure) into def;
  def := replace(def, 'coalesce(case when a.legal_name_visibility = ''private'' then a.preferred_display_name end, a.legal_name)', 'a.legal_name');
  execute def;

  select pg_get_functiondef('public.trg_notify_verification()'::regprocedure) into def;
  def := replace(def, 'coalesce(a.preferred_display_name, a.legal_name)', 'a.legal_name');
  execute def;
end $$;

alter table public.accounts drop column if exists legal_name_visibility;
alter table public.accounts drop column if exists preferred_display_name;
