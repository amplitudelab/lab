-- =====================================================================
-- Amplitude CRM · schema multi-tenant para Supabase (Postgres 15+)
-- Um banco, muitos clientes (tenants). Isolamento por Row Level Security.
-- Rode no SQL Editor do Supabase ou como migration (supabase db push).
-- Valores em dinheiro: inteiros em centavos. Datas: timestamptz (UTC).
-- =====================================================================

create schema if not exists app;

-- ---------------------------------------------------------------------
-- 1. Tenants (cada cliente da Amplitude Lab) e membros
-- ---------------------------------------------------------------------
create type app.role as enum ('owner', 'admin', 'sales', 'finance', 'viewer');
create type app.plan as enum ('essencial', 'pro', 'white_label');

create table public.tenants (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9](-?[a-z0-9]){2,30}$'),
  name          text not null,
  niche         text,                       -- barbearia, artista, evento, clínica...
  plan          app.plan not null default 'essencial',
  brand         jsonb not null default '{}'::jsonb,  -- {primary, logo_url, hide_powered_by}
  custom_domain text unique,                -- crm.cliente.com.br (plano white_label)
  created_at    timestamptz not null default now()
);

create table public.memberships (
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       app.role not null default 'sales',
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create index on public.memberships (user_id);

-- Funções de checagem usadas por TODAS as policies.
-- security definer + search_path fixo: evita recursão de RLS e sequestro de schema.
create or replace function app.is_member(t uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.tenant_id = t and m.user_id = (select auth.uid())
  );
$$;

create or replace function app.has_role(t uuid, roles app.role[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.tenant_id = t and m.user_id = (select auth.uid()) and m.role = any(roles)
  );
$$;

-- Dados públicos de marca para a tela de login (sem nenhum dado pessoal).
create or replace function public.tenant_public(p_slug text)
returns table (name text, brand jsonb, plan app.plan)
language sql stable security definer set search_path = '' as $$
  select t.name, t.brand, t.plan from public.tenants t where t.slug = p_slug;
$$;
grant execute on function public.tenant_public(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. CRM: clientes, contatos, funil, leads, histórico
-- ---------------------------------------------------------------------
create type app.lead_source as enum ('form', 'whatsapp', 'instagram', 'email', 'indicacao', 'presencial', 'outro');

create table public.clients (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  name       text not null,
  doc        text,                          -- CPF/CNPJ (opcional, dado pessoal)
  email      text,
  phone      text,
  notes      text,
  created_at timestamptz not null default now()
);

create table public.contacts (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  client_id  uuid references public.clients(id) on delete cascade,
  name       text not null,
  role       text,
  email      text,
  phone      text
);

create table public.pipeline_stages (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  name       text not null,
  position   int  not null,
  kind       text not null default 'open' check (kind in ('open', 'won', 'lost')),
  unique (tenant_id, position)
);

create table public.leads (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  stage_id         uuid not null references public.pipeline_stages(id),
  client_id        uuid references public.clients(id) on delete set null,
  owner_id         uuid references auth.users(id) on delete set null,
  name             text not null,
  phone            text,
  email            text,
  interest         text,
  source           app.lead_source not null default 'outro',
  utm              jsonb not null default '{}'::jsonb,
  value_cents      bigint not null default 0 check (value_cents >= 0),
  next_follow_up   timestamptz,
  consent_at       timestamptz,            -- LGPD: quando o titular aceitou o contato
  consent_text     text,
  lost_reason      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index on public.leads (tenant_id, stage_id);
create index on public.leads (tenant_id, next_follow_up) where next_follow_up is not null;

create table public.activities (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  lead_id    uuid references public.leads(id) on delete cascade,
  client_id  uuid references public.clients(id) on delete cascade,
  actor_id   uuid references auth.users(id) on delete set null,
  kind       text not null check (kind in ('note', 'call', 'whatsapp', 'email', 'stage', 'form', 'proposal', 'payment')),
  body       text,
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.activities (tenant_id, lead_id, created_at desc);

-- ---------------------------------------------------------------------
-- 3. Propostas (com link público para o cliente final aceitar)
-- ---------------------------------------------------------------------
create table public.proposals (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  lead_id      uuid references public.leads(id) on delete set null,
  client_id    uuid references public.clients(id) on delete set null,
  title        text not null,
  items        jsonb not null default '[]'::jsonb,  -- [{desc, qty, unit_cents}]
  total_cents  bigint not null default 0,
  status       text not null default 'draft' check (status in ('draft', 'sent', 'viewed', 'accepted', 'declined')),
  valid_until  date,
  public_token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  accepted_at  timestamptz,
  accepted_ip  inet,
  created_at   timestamptz not null default now()
);

-- O cliente final vê a proposta só com o token (sem login), e só campos seguros.
create or replace function public.proposal_public(p_token text)
returns table (title text, items jsonb, total_cents bigint, status text, valid_until date, tenant_name text, brand jsonb)
language sql stable security definer set search_path = '' as $$
  select p.title, p.items, p.total_cents, p.status, p.valid_until, t.name, t.brand
  from public.proposals p join public.tenants t on t.id = p.tenant_id
  where p.public_token = p_token;
$$;
grant execute on function public.proposal_public(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. Tarefas, agenda e lembretes
-- ---------------------------------------------------------------------
create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  lead_id     uuid references public.leads(id) on delete cascade,
  client_id   uuid references public.clients(id) on delete cascade,
  assignee_id uuid references auth.users(id) on delete set null,
  title       text not null,
  kind        text not null default 'task' check (kind in ('task', 'meeting', 'follow_up')),
  due_at      timestamptz,
  remind_at   timestamptz,                -- lido por um cron (pg_cron) que dispara o lembrete
  done_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index on public.tasks (tenant_id, due_at) where done_at is null;

-- ---------------------------------------------------------------------
-- 5. Financeiro: cobranças e fluxo de caixa
-- ---------------------------------------------------------------------
create table public.charges (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  client_id     uuid references public.clients(id) on delete set null,
  proposal_id   uuid references public.proposals(id) on delete set null,
  description   text not null,
  amount_cents  bigint not null check (amount_cents > 0),
  due_date      date not null,
  method        text check (method in ('pix', 'boleto', 'card', 'cash', 'transfer')),
  status        text not null default 'pending' check (status in ('pending', 'paid', 'canceled')),
  paid_at       timestamptz,
  gateway       text,                     -- 'asaas', 'mercadopago'...
  gateway_id    text,                     -- id da cobrança no gateway (webhook confirma)
  created_at    timestamptz not null default now(),
  unique (gateway, gateway_id)
);
create index on public.charges (tenant_id, status, due_date);

create table public.cash_entries (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  charge_id    uuid references public.charges(id) on delete set null,
  direction    text not null check (direction in ('in', 'out')),
  category     text not null,
  description  text,
  amount_cents bigint not null check (amount_cents > 0),
  occurred_on  date not null,
  created_at   timestamptz not null default now()
);
create index on public.cash_entries (tenant_id, occurred_on);

-- Fluxo de caixa mensal. security_invoker: a view respeita a RLS de quem consulta.
create view public.cashflow_monthly with (security_invoker = true) as
  select tenant_id,
         date_trunc('month', occurred_on)::date as month,
         sum(amount_cents) filter (where direction = 'in')  as in_cents,
         sum(amount_cents) filter (where direction = 'out') as out_cents
  from public.cash_entries group by 1, 2;

-- ---------------------------------------------------------------------
-- 6. Captação: formulários públicos
-- ---------------------------------------------------------------------
create table public.forms (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  slug        text not null,
  title       text not null,
  fields      jsonb not null default '[]'::jsonb,
  stage_id    uuid references public.pipeline_stages(id),
  whatsapp_redirect text,                 -- abre o WhatsApp depois de enviar
  active      boolean not null default true,
  unique (tenant_id, slug)
);
-- Envios NÃO entram direto pela API pública: passam pela Edge Function
-- `capture-lead`, que valida Turnstile, honeypot, rate limit por IP e só então
-- grava em public.leads com a service role. Anon não tem insert em nenhuma tabela.

-- ---------------------------------------------------------------------
-- 7. Auditoria (quem fez o quê) — LGPD art. 37 e investigação de incidentes
-- ---------------------------------------------------------------------
create table public.audit_log (
  id         bigint generated always as identity primary key,
  tenant_id  uuid not null,
  actor_id   uuid,
  action     text not null,               -- INSERT / UPDATE / DELETE
  table_name text not null,
  row_id     uuid,
  diff       jsonb,
  at         timestamptz not null default now()
);
create index on public.audit_log (tenant_id, at desc);

create or replace function app.audit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log (tenant_id, actor_id, action, table_name, row_id, diff)
  values (
    coalesce(new.tenant_id, old.tenant_id),
    (select auth.uid()),
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op = 'UPDATE' then jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
         else to_jsonb(coalesce(new, old)) end
  );
  return coalesce(new, old);
end $$;

-- tenant_id nunca muda depois de criado (impede "mover" linha para outro cliente).
create or replace function app.lock_tenant() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.tenant_id <> old.tenant_id then
    raise exception 'tenant_id é imutável';
  end if;
  if tg_table_name = 'leads' then new.updated_at := now(); end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 8. RLS: liga em tudo e aplica a matriz de permissões
--    owner/admin: tudo · sales: CRM, propostas, tarefas · finance: financeiro
--    viewer: só leitura do CRM (sem financeiro)
-- ---------------------------------------------------------------------
alter table public.tenants         enable row level security;
alter table public.memberships     enable row level security;
alter table public.clients         enable row level security;
alter table public.contacts        enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.leads           enable row level security;
alter table public.activities      enable row level security;
alter table public.proposals       enable row level security;
alter table public.tasks           enable row level security;
alter table public.charges         enable row level security;
alter table public.cash_entries    enable row level security;
alter table public.forms           enable row level security;
alter table public.audit_log       enable row level security;

create policy tenant_read on public.tenants for select to authenticated
  using (app.is_member(id));
create policy tenant_edit on public.tenants for update to authenticated
  using (app.has_role(id, '{owner,admin}')) with check (app.has_role(id, '{owner,admin}'));

create policy members_read on public.memberships for select to authenticated
  using (app.is_member(tenant_id));
create policy members_insert on public.memberships for insert to authenticated
  with check (app.has_role(tenant_id, '{owner}'));
create policy members_update on public.memberships for update to authenticated
  using (app.has_role(tenant_id, '{owner}')) with check (app.has_role(tenant_id, '{owner}'));
create policy members_delete on public.memberships for delete to authenticated
  using (app.has_role(tenant_id, '{owner}'));

-- Tabelas de CRM: membros leem; owner/admin/sales escrevem.
do $$
declare t text;
begin
  foreach t in array array['clients','contacts','pipeline_stages','leads','activities','proposals','tasks','forms'] loop
    execute format('create policy %1$s_read on public.%1$s for select to authenticated using (app.is_member(tenant_id))', t);
    execute format('create policy %1$s_write on public.%1$s for insert to authenticated with check (app.has_role(tenant_id, ''{owner,admin,sales}''))', t);
    execute format('create policy %1$s_update on public.%1$s for update to authenticated using (app.has_role(tenant_id, ''{owner,admin,sales}'')) with check (app.has_role(tenant_id, ''{owner,admin,sales}''))', t);
    execute format('create policy %1$s_delete on public.%1$s for delete to authenticated using (app.has_role(tenant_id, ''{owner,admin}''))', t);
    execute format('create trigger %1$s_lock before update on public.%1$s for each row execute function app.lock_tenant()', t);
    execute format('create trigger %1$s_audit after insert or update or delete on public.%1$s for each row execute function app.audit()', t);
    execute format('create index if not exists %1$s_tenant_idx on public.%1$s (tenant_id)', t);
  end loop;

  -- Financeiro: só owner/admin/finance leem e escrevem.
  foreach t in array array['charges','cash_entries'] loop
    execute format('create policy %1$s_all on public.%1$s for all to authenticated using (app.has_role(tenant_id, ''{owner,admin,finance}'')) with check (app.has_role(tenant_id, ''{owner,admin,finance}''))', t);
    execute format('create trigger %1$s_lock before update on public.%1$s for each row execute function app.lock_tenant()', t);
    execute format('create trigger %1$s_audit after insert or update or delete on public.%1$s for each row execute function app.audit()', t);
  end loop;
end $$;

create policy audit_read on public.audit_log for select to authenticated
  using (app.has_role(tenant_id, '{owner,admin}'));
-- Ninguém edita ou apaga a auditoria pela API (sem policies de insert/update/delete).

-- ---------------------------------------------------------------------
-- 9. LGPD: anonimizar um lead a pedido do titular (art. 18)
-- ---------------------------------------------------------------------
create or replace function public.anonymize_lead(p_lead uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  update public.leads
     set name = 'Titular anonimizado', phone = null, email = null,
         interest = null, utm = '{}'::jsonb, consent_text = null
   where id = p_lead;               -- a RLS de update garante que é do tenant certo
  update public.activities set body = '[removido a pedido do titular]'
   where lead_id = p_lead;
end $$;

-- ---------------------------------------------------------------------
-- 10. Funil padrão ao criar um tenant
-- ---------------------------------------------------------------------
create or replace function app.seed_tenant() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.pipeline_stages (tenant_id, name, position, kind) values
    (new.id, 'Novo', 1, 'open'), (new.id, 'Contato feito', 2, 'open'),
    (new.id, 'Proposta', 3, 'open'), (new.id, 'Negociação', 4, 'open'),
    (new.id, 'Fechado', 5, 'won'), (new.id, 'Perdido', 6, 'lost');
  return new;
end $$;
create trigger tenants_seed after insert on public.tenants
  for each row execute function app.seed_tenant();

-- Índices para todas as chaves estrangeiras (joins e exclusões em cascata rápidos).
create index if not exists activities_actor_idx    on public.activities (actor_id);
create index if not exists activities_client_idx   on public.activities (client_id);
create index if not exists activities_lead_idx     on public.activities (lead_id);
create index if not exists cash_entries_charge_idx on public.cash_entries (charge_id);
create index if not exists charges_client_idx      on public.charges (client_id);
create index if not exists charges_proposal_idx    on public.charges (proposal_id);
create index if not exists contacts_client_idx     on public.contacts (client_id);
create index if not exists forms_stage_idx         on public.forms (stage_id);
create index if not exists leads_client_idx        on public.leads (client_id);
create index if not exists leads_owner_idx         on public.leads (owner_id);
create index if not exists leads_stage_idx         on public.leads (stage_id);
create index if not exists proposals_client_idx    on public.proposals (client_id);
create index if not exists proposals_lead_idx      on public.proposals (lead_id);
create index if not exists tasks_assignee_idx      on public.tasks (assignee_id);
create index if not exists tasks_client_idx        on public.tasks (client_id);
create index if not exists tasks_lead_idx          on public.tasks (lead_id);

-- Permissões explícitas (não dependem dos padrões do projeto).
-- anon não enxerga nenhuma tabela, só as funções públicas acima.
revoke all on all tables in schema public from anon;
revoke execute on function public.anonymize_lead(uuid) from public, anon;
grant usage on schema app to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke insert, update, delete on public.audit_log from authenticated;
grant execute on function public.anonymize_lead(uuid) to authenticated;
