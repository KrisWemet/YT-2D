-- Let the weekly session store a theme run over the REST API with the secret key (service_role),
-- for sessions that have no Supabase connector. The browser roles still can't call it.

create or replace function public.ingest_theme_run(payload jsonb)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select private.ingest_theme_run(payload);
$$;
revoke execute on function public.ingest_theme_run(jsonb) from public, anon, authenticated;
grant execute on function public.ingest_theme_run(jsonb) to service_role;
