-- Radar com Google sem surpresa na conta: resultados guardados por 30 dias e contagem de pedidos do mês.
create table public.radar_cache (
  key text primary key,
  items jsonb not null,
  created_at timestamptz not null default now()
);
create table public.radar_usage (
  month text primary key,              -- AAAA-MM
  calls int not null default 0
);
alter table public.radar_cache enable row level security;
alter table public.radar_usage enable row level security;
revoke all on public.radar_cache, public.radar_usage from anon, authenticated;
grant all on public.radar_cache, public.radar_usage to service_role;

-- Soma pedidos do mês sem corrida entre duas buscas ao mesmo tempo.
create or replace function public.radar_use(p_calls int) returns int language sql security definer set search_path to '' as $$
  insert into public.radar_usage (month, calls) values (to_char(now(), 'YYYY-MM'), p_calls)
  on conflict (month) do update set calls = public.radar_usage.calls + excluded.calls
  returning calls;
$$;
revoke execute on function public.radar_use(int) from public, anon, authenticated;
grant execute on function public.radar_use(int) to service_role;
