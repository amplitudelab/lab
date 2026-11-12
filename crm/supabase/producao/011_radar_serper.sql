-- Radar com Serper.dev: mesmo cache (radar_cache, chaves "s:...") e contagem do mês por fonte em radar_usage,
-- Já aplicada em produção (migração radar_serper, 2026-11-12).
-- com a chave "<fonte>:AAAA-MM" (ex.: "serper:2026-11"). O Google continua na chave "AAAA-MM" de radar_use.
create or replace function public.radar_use_src(p_src text, p_calls int) returns int language sql security definer set search_path to '' as $$
  insert into public.radar_usage (month, calls) values (p_src || ':' || to_char(now(), 'YYYY-MM'), p_calls)
  on conflict (month) do update set calls = public.radar_usage.calls + excluded.calls
  returning calls;
$$;
revoke execute on function public.radar_use_src(text, int) from public, anon, authenticated;
grant execute on function public.radar_use_src(text, int) to service_role;
