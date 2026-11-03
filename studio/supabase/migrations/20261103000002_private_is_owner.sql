-- Move is_owner() out of the API-exposed public schema, so it can't be called as /rest/v1/rpc/is_owner.
-- RLS policies still use it.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_owner o
    where o.email = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  );
$$;
revoke execute on function private.is_owner() from public, anon;
grant execute on function private.is_owner() to authenticated;

alter policy "owner reads owners" on public.app_owner using ((select private.is_owner()));
alter policy "owner all" on public.channels using ((select private.is_owner())) with check ((select private.is_owner()));
alter policy "owner all" on public.videos using ((select private.is_owner())) with check ((select private.is_owner()));
alter policy "owner all" on public.video_snapshots using ((select private.is_owner())) with check ((select private.is_owner()));
alter policy "owner all" on public.channel_baselines using ((select private.is_owner())) with check ((select private.is_owner()));
alter policy "owner all" on public.outliers using ((select private.is_owner())) with check ((select private.is_owner()));
alter policy "owner reads" on public.api_usage using ((select private.is_owner()));
alter policy "owner reads" on public.cron_runs using ((select private.is_owner()));

drop function public.is_owner();
