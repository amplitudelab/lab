-- =====================================================================
-- Amplitude CRM · login por convite, Radar de leads e ajustes de permissão
-- =====================================================================
grant usage on schema app to service_role;

alter type app.lead_source add value if not exists 'site';
alter type app.lead_source add value if not exists 'radar';

-- Convites: link de uso único. A própria pessoa escolhe e-mail e senha no primeiro acesso.
create table public.invites (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  token      text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  role       app.role not null default 'sales',
  name       text,
  created_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  used_at    timestamptz,
  used_by    uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index invites_tenant_idx on public.invites (tenant_id);
create index invites_created_by_idx on public.invites (created_by);
create index invites_used_by_idx on public.invites (used_by);
alter table public.invites enable row level security;
create policy invites_read on public.invites for select to authenticated using (app.has_role(tenant_id, '{owner}'));
create policy invites_insert on public.invites for insert to authenticated with check (app.has_role(tenant_id, '{owner}') and role <> 'owner');
create policy invites_delete on public.invites for delete to authenticated using (app.has_role(tenant_id, '{owner}'));
grant select, insert, delete on public.invites to authenticated;
revoke all on public.invites from anon;

-- Equipe com e-mail: só quem é membro enxerga, e só da própria empresa.
create or replace function public.team_list(p_tenant uuid)
returns table (user_id uuid, email text, role app.role, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select m.user_id, u.email::text, m.role, m.created_at
  from public.memberships m join auth.users u on u.id = m.user_id
  where m.tenant_id = p_tenant and app.is_member(p_tenant) order by m.created_at;
$$;
revoke execute on function public.team_list(uuid) from public, anon;
grant execute on function public.team_list(uuid) to authenticated;

-- Avisos criados pelo próprio painel (recebimento manual).
create policy notifications_insert on public.notifications for insert to authenticated
  with check (app.has_role(tenant_id, '{owner,admin,sales,finance}'));
grant insert on public.notifications to authenticated;

-- Quem registra um recebimento também marca o lead como pagante e escreve no histórico.
drop policy leads_update on public.leads;
create policy leads_update on public.leads for update to authenticated
  using (app.has_role(tenant_id, '{owner,admin,sales,finance}')) with check (app.has_role(tenant_id, '{owner,admin,sales,finance}'));
drop policy activities_write on public.activities;
create policy activities_write on public.activities for insert to authenticated
  with check (app.has_role(tenant_id, '{owner,admin,sales,finance}'));
