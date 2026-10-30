-- Amplitude CRM · esquema do banco (Supabase / Postgres 15+)
--
-- Multi-tenant: toda linha tem tenant_id e toda tabela tem RLS ligado.
-- Quem pode ver o quê sai da tabela memberships (perfis owner, sales, finance, viewer),
-- os mesmos do protótipo em crm/app/index.html.
--
-- Rodar uma vez no SQL Editor do Supabase (ou `supabase db push` com este arquivo
-- como migração). Depois rode seed.sql se quiser os dados de exemplo.

create extension if not exists pgcrypto;

-- ============ tipos ============
create type crm_role     as enum ('owner', 'sales', 'finance', 'viewer');
create type crm_plan     as enum ('Essencial', 'Pro', 'White-label', 'Interno');
create type lead_source  as enum ('site', 'form', 'whatsapp', 'instagram', 'email', 'indicacao', 'presencial');
create type stage_kind   as enum ('won', 'lost');
create type activity_kind as enum ('note', 'call', 'whatsapp', 'email', 'stage', 'form', 'proposal', 'payment');
create type proposal_status as enum ('draft', 'sent', 'viewed', 'accepted', 'declined');
create type task_kind    as enum ('task', 'meeting');
create type charge_status as enum ('pending', 'paid', 'overdue', 'canceled');
create type pay_method   as enum ('pix', 'boleto', 'card', 'transfer');
create type cash_dir     as enum ('in', 'out');

-- ============ tabelas ============
-- 1. Clientes da Amplitude Lab que usam o CRM (cada um é um tenant)
create table tenants (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),  -- <slug>.amplitudelab.com.br
  name          text not null,
  niche         text,
  plan          crm_plan not null default 'Essencial',
  brand_name    text,
  brand_color   text check (brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  hide_credit   boolean not null default false,                         -- só White-label
  custom_domain text unique,
  whatsapp      text check (whatsapp ~ '^[0-9]{10,13}$'),
  created_at    timestamptz not null default now()
);

-- 2. Quem entra em cada painel e com qual perfil
create table memberships (
  tenant_id  uuid not null references tenants(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       crm_role not null default 'viewer',
  name       text,
  email      text,
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create index on memberships (user_id);

-- 3. Etapas do funil (Novo, Contato feito, Proposta, Negociação, Fechado, Perdido)
create table pipeline_stages (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name      text not null,
  position  int  not null,
  kind      stage_kind,                     -- null = etapa aberta
  unique (tenant_id, position),
  unique (tenant_id, id)
);

-- 4. Clientes do tenant (quem já comprou)
create table clients (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  name       text not null,
  email      text,
  phone      text,
  doc        text,                          -- CPF/CNPJ, só se precisar emitir cobrança
  since      date not null default current_date,
  created_at timestamptz not null default now(),
  unique (tenant_id, id)
);

-- 5. Pessoas de contato de cada cliente
create table contacts (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  client_id uuid not null,
  name      text not null,
  role      text,
  email     text,
  phone     text,
  foreign key (tenant_id, client_id) references clients(tenant_id, id) on delete cascade
);

-- 6. Leads (oportunidades no funil)
create table leads (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  name          text not null,
  phone         text,
  email         text,
  interest      text,
  source        lead_source not null default 'form',
  stage_id      uuid not null,
  value_cents   bigint not null default 0 check (value_cents >= 0),
  follow_up_at  timestamptz,
  consent_at    timestamptz,                -- LGPD: quando aceitou ser contatado
  consent_text  text,                       -- e o texto exato que aceitou
  client_id     uuid,
  lost_reason   text,
  anonymized_at timestamptz,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, stage_id)  references pipeline_stages(tenant_id, id),
  foreign key (tenant_id, client_id) references clients(tenant_id, id) on delete set null (client_id)
);
create index on leads (tenant_id, stage_id);
create index on leads (tenant_id, follow_up_at) where follow_up_at is not null;

-- 7. Histórico do lead (notas, ligações, mudanças de etapa, pagamentos)
create table activities (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  lead_id    uuid not null,
  kind       activity_kind not null default 'note',
  body       text not null,
  by_label   text,                          -- "Vendas", "Sistema", "Página"
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, lead_id) references leads(tenant_id, id) on delete cascade
);
create index on activities (tenant_id, lead_id, created_at desc);

-- 8. Propostas com link público (token) para o cliente ver e aceitar
create table proposals (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  lead_id     uuid,
  client_id   uuid,
  title       text not null,
  items       jsonb not null default '[]',  -- [{d: descrição, q: quantidade, u: centavos}]
  total_cents bigint not null default 0,    -- soma de q × u, calculada pelo trigger proposal_total
  status      proposal_status not null default 'draft',
  valid_until date,
  token       text not null unique default encode(gen_random_bytes(18), 'hex'),
  viewed_at   timestamptz,
  accepted_at timestamptz,
  created_at  timestamptz not null default now(),
  foreign key (tenant_id, lead_id)   references leads(tenant_id, id) on delete set null (lead_id),
  foreign key (tenant_id, client_id) references clients(tenant_id, id) on delete set null (client_id)
);

-- 9. Tarefas e compromissos da agenda
create table tasks (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  lead_id        uuid,
  title          text not null,
  kind           task_kind not null default 'task',
  due_at         timestamptz not null,
  done_at        timestamptz,
  remind_minutes int not null default 15,
  reminded_at    timestamptz,               -- preenchido pela função lembretes
  assigned_to    uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  foreign key (tenant_id, lead_id) references leads(tenant_id, id) on delete set null (lead_id)
);
create index on tasks (tenant_id, due_at) where done_at is null;

-- 10. Formulário público de captação (um por tenant no MVP)
create table forms (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null unique references tenants(id) on delete cascade,
  title         text not null default 'Fale com a gente',
  ask_email     boolean not null default true,
  ask_interest  boolean not null default true,
  ask_message   boolean not null default false,
  interests     text[] not null default '{}',
  consent_text  text not null default 'Autorizo o contato por WhatsApp e e-mail sobre este pedido.',
  active        boolean not null default true
);

-- 11. Cobranças (Asaas na Fase 2; no MVP, registro manual)
create table charges (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  client_id    uuid,
  lead_id      uuid,
  description  text not null,
  amount_cents bigint not null check (amount_cents > 0),
  due_date     date not null,
  status       charge_status not null default 'pending',
  method       pay_method not null default 'pix',
  paid_at      timestamptz,
  asaas_id     text unique,
  payment_url  text,
  created_at   timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, client_id) references clients(tenant_id, id) on delete set null (client_id),
  foreign key (tenant_id, lead_id)   references leads(tenant_id, id) on delete set null (lead_id)
);
create index on charges (tenant_id, status, due_date);

-- 12. Fluxo de caixa (entradas e saídas)
create table cash_entries (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  direction    cash_dir not null,
  category     text not null,
  description  text,
  amount_cents bigint not null check (amount_cents > 0),
  entry_date   date not null default current_date,
  charge_id    uuid unique,                 -- entrada criada quando a cobrança é paga
  created_at   timestamptz not null default now(),
  foreign key (tenant_id, charge_id) references charges(tenant_id, id) on delete set null (charge_id)
);
create index on cash_entries (tenant_id, entry_date);

-- 13. Registro de alterações (só o banco escreve aqui)
create table audit_log (
  id          bigint generated always as identity primary key,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  actor       uuid,
  actor_label text,
  action      text not null,                -- insert, update, delete, anonymize, accept…
  entity      text not null,
  entity_id   uuid,
  summary     text,
  at          timestamptz not null default now()
);
create index on audit_log (tenant_id, at desc);

-- ============ funções de acesso ============
-- security definer + search_path fixo: rodam com o dono e não caem em recursão de RLS
create or replace function is_member(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships m where m.tenant_id = t and m.user_id = auth.uid());
$$;

create or replace function has_role(t uuid, roles crm_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships m where m.tenant_id = t and m.user_id = auth.uid() and m.role = any(roles));
$$;

-- ============ RLS ============
alter table tenants         enable row level security;
alter table memberships     enable row level security;
alter table pipeline_stages enable row level security;
alter table clients         enable row level security;
alter table contacts        enable row level security;
alter table leads           enable row level security;
alter table activities      enable row level security;
alter table proposals       enable row level security;
alter table tasks           enable row level security;
alter table forms           enable row level security;
alter table charges         enable row level security;
alter table cash_entries    enable row level security;
alter table audit_log       enable row level security;

-- tenant: membros leem, dono altera marca e plano visível
create policy tenants_read  on tenants for select using (is_member(id));
create policy tenants_owner on tenants for update using (has_role(id, '{owner}')) with check (has_role(id, '{owner}'));

-- equipe: todos veem quem está no painel, só o dono convida, troca perfil ou remove
create policy mem_read  on memberships for select using (is_member(tenant_id));
create policy mem_ins   on memberships for insert with check (has_role(tenant_id, '{owner}'));
create policy mem_upd   on memberships for update using (has_role(tenant_id, '{owner}')) with check (has_role(tenant_id, '{owner}'));
create policy mem_del   on memberships for delete using (has_role(tenant_id, '{owner}') and user_id <> auth.uid());

-- CRM (funil, clientes, propostas, agenda): ler = qualquer membro; criar/editar = dono e vendas;
-- excluir = só dono. Leads ficam fora do select direto do perfil Leitura: ele lê pela view
-- leads_masked, que esconde telefone e e-mail.
do $$
declare t text;
begin
  foreach t in array array['pipeline_stages', 'clients', 'contacts', 'activities', 'proposals', 'tasks', 'forms'] loop
    execute format('create policy %1$s_read on %1$I for select using (is_member(tenant_id))', t);
    execute format('create policy %1$s_ins  on %1$I for insert with check (has_role(tenant_id, ''{owner,sales}''))', t);
    execute format('create policy %1$s_upd  on %1$I for update using (has_role(tenant_id, ''{owner,sales}'')) with check (has_role(tenant_id, ''{owner,sales}''))', t);
    execute format('create policy %1$s_del  on %1$I for delete using (has_role(tenant_id, ''{owner}''))', t);
  end loop;
end $$;

create policy leads_read on leads for select using (has_role(tenant_id, '{owner,sales,finance}'));
create policy leads_ins  on leads for insert with check (has_role(tenant_id, '{owner,sales}'));
create policy leads_upd  on leads for update using (has_role(tenant_id, '{owner,sales}')) with check (has_role(tenant_id, '{owner,sales}'));
create policy leads_del  on leads for delete using (has_role(tenant_id, '{owner}'));

-- financeiro: dono e financeiro
do $$
declare t text;
begin
  foreach t in array array['charges', 'cash_entries'] loop
    execute format('create policy %1$s_read on %1$I for select using (has_role(tenant_id, ''{owner,finance}''))', t);
    execute format('create policy %1$s_ins  on %1$I for insert with check (has_role(tenant_id, ''{owner,finance}''))', t);
    execute format('create policy %1$s_upd  on %1$I for update using (has_role(tenant_id, ''{owner,finance}'')) with check (has_role(tenant_id, ''{owner,finance}''))', t);
    execute format('create policy %1$s_del  on %1$I for delete using (has_role(tenant_id, ''{owner}''))', t);
  end loop;
end $$;

-- registro: só o dono lê; ninguém escreve direto (só os triggers)
create policy audit_read on audit_log for select using (has_role(tenant_id, '{owner}'));

-- ============ view com telefone mascarado (todos os perfis leem por aqui) ============
create or replace view leads_masked with (security_barrier = true) as
  select l.id, l.tenant_id, l.name,
    case when has_role(l.tenant_id, '{owner,sales,finance}') then l.phone
         else regexp_replace(coalesce(l.phone, ''), '\d(?=\d{2})', '•', 'g') end as phone,
    case when has_role(l.tenant_id, '{owner,sales,finance}') then l.email
         else regexp_replace(coalesce(l.email, ''), '^(.).*(@.*)$', '\1•••\2') end as email,
    l.interest, l.source, l.stage_id, l.value_cents, l.follow_up_at, l.consent_at,
    l.client_id, l.lost_reason, l.anonymized_at, l.created_at, l.updated_at
  from leads l
  where is_member(l.tenant_id);

-- fluxo de caixa por mês (Financeiro → gráfico)
create or replace view cashflow_monthly with (security_invoker = true) as
  select tenant_id, date_trunc('month', entry_date)::date as month,
    sum(amount_cents) filter (where direction = 'in')  as in_cents,
    sum(amount_cents) filter (where direction = 'out') as out_cents,
    coalesce(sum(amount_cents) filter (where direction = 'in'), 0)
      - coalesce(sum(amount_cents) filter (where direction = 'out'), 0) as balance_cents
  from cash_entries group by 1, 2;

-- ============ triggers ============
-- tenant_id nunca muda depois de criado (impede "mover" dados de um cliente para outro)
create or replace function lock_tenant_id() returns trigger language plpgsql as $$
begin
  if new.tenant_id is distinct from old.tenant_id then
    raise exception 'tenant_id não pode ser alterado';
  end if;
  return new;
end $$;

-- updated_at automático
create or replace function touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- total da proposta = soma de q × u dos itens
create or replace function proposal_total() returns trigger language plpgsql as $$
begin
  select coalesce(sum((i->>'q')::numeric * (i->>'u')::numeric), 0)::bigint into new.total_cents
  from jsonb_array_elements(new.items) i;
  return new;
end $$;

-- registro de alterações
create or replace function audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare r record; label text;
begin
  r := case when tg_op = 'DELETE' then old else new end;
  select coalesce(m.name, m.role::text) into label from memberships m where m.tenant_id = r.tenant_id and m.user_id = auth.uid();
  insert into audit_log (tenant_id, actor, actor_label, action, entity, entity_id)
  values (r.tenant_id, auth.uid(), coalesce(label, 'Sistema'), lower(tg_op), tg_table_name, r.id);
  return null;
end $$;

-- mudança de etapa vira atividade no histórico do lead
create or replace function lead_stage_activity() returns trigger
language plpgsql security definer set search_path = public as $$
declare a text; b text;
begin
  if new.stage_id is distinct from old.stage_id then
    select name into a from pipeline_stages where id = old.stage_id;
    select name into b from pipeline_stages where id = new.stage_id;
    insert into activities (tenant_id, lead_id, kind, body, by_label, created_by)
    values (new.tenant_id, new.id, 'stage', format('Etapa: %s → %s', a, b), 'Sistema', auth.uid());
  end if;
  return new;
end $$;

-- cobrança paga gera entrada no caixa (uma só vez)
create or replace function charge_paid_cash() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'paid' and (tg_op = 'INSERT' or old.status is distinct from 'paid') then
    new.paid_at := coalesce(new.paid_at, now());
  end if;
  return new;
end $$;
create or replace function charge_paid_cash_after() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'paid' and (tg_op = 'INSERT' or old.status is distinct from 'paid') then
    insert into cash_entries (tenant_id, direction, category, description, amount_cents, entry_date, charge_id)
    values (new.tenant_id, 'in', 'Cobranças', new.description, new.amount_cents, (new.paid_at at time zone 'America/Sao_Paulo')::date, new.id)
    on conflict (charge_id) do nothing;
  end if;
  return null;
end $$;

-- tenant novo já nasce com as 6 etapas e o formulário
create or replace function tenant_defaults() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into pipeline_stages (tenant_id, name, position, kind) values
    (new.id, 'Novo', 1, null), (new.id, 'Contato feito', 2, null), (new.id, 'Proposta', 3, null),
    (new.id, 'Negociação', 4, null), (new.id, 'Fechado', 5, 'won'), (new.id, 'Perdido', 6, 'lost');
  insert into forms (tenant_id) values (new.id);
  return null;
end $$;
create trigger tenant_defaults after insert on tenants for each row execute function tenant_defaults();

do $$
declare t text;
begin
  foreach t in array array['memberships', 'pipeline_stages', 'clients', 'contacts', 'leads', 'activities', 'proposals', 'tasks', 'forms', 'charges', 'cash_entries'] loop
    execute format('create trigger lock_tenant before update on %I for each row execute function lock_tenant_id()', t);
  end loop;
  foreach t in array array['clients', 'leads', 'proposals', 'tasks', 'charges', 'cash_entries'] loop
    execute format('create trigger audit after insert or update or delete on %I for each row execute function audit_row()', t);
  end loop;
end $$;
create trigger touch before update on leads for each row execute function touch();
create trigger lead_stage after update of stage_id on leads for each row execute function lead_stage_activity();
create trigger total before insert or update of items on proposals for each row execute function proposal_total();
create trigger paid_at before insert or update of status on charges for each row execute function charge_paid_cash();
create trigger paid_cash after insert or update of status on charges for each row execute function charge_paid_cash_after();

-- ============ funções chamadas pelo app ============
-- LGPD: apaga dados pessoais do lead e o texto do histórico; números do funil continuam
create or replace function anonymize_lead(p_lead uuid) returns void
language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  select tenant_id into t from leads where id = p_lead;
  if t is null or not has_role(t, '{owner}') then raise exception 'sem permissão'; end if;
  update leads set name = 'Titular anonimizado', phone = null, email = null, interest = null,
    lost_reason = null, anonymized_at = now() where id = p_lead;
  update activities set body = '[removido a pedido do titular]' where lead_id = p_lead;
  insert into audit_log (tenant_id, actor, action, entity, entity_id, summary)
  values (t, auth.uid(), 'anonymize', 'leads', p_lead, 'Dados pessoais removidos (LGPD)');
end $$;

-- página pública: só o que o visitante precisa (marca e formulário), sem dados internos
create or replace function tenant_public(p_slug text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'name', coalesce(t.brand_name, t.name), 'color', t.brand_color, 'whatsapp', t.whatsapp,
    'hide_credit', t.hide_credit and t.plan = 'White-label',
    'form', json_build_object('title', f.title, 'email', f.ask_email, 'interest', f.ask_interest,
      'message', f.ask_message, 'interests', f.interests, 'consent', f.consent_text))
  from tenants t join forms f on f.tenant_id = t.id and f.active
  where t.slug = p_slug or t.custom_domain = p_slug;
$$;

-- proposta pelo link: o token é a senha; marca como vista na primeira abertura
create or replace function proposal_public(p_token text) returns json
language plpgsql security definer set search_path = public as $$
declare p proposals; tn tenants;
begin
  select * into p from proposals where token = p_token and status <> 'draft';
  if not found then return null; end if;
  if p.status = 'sent' then update proposals set status = 'viewed', viewed_at = now() where id = p.id; p.status := 'viewed'; end if;
  select * into tn from tenants where id = p.tenant_id;
  return json_build_object('title', p.title, 'items', p.items, 'total_cents', p.total_cents, 'status', p.status,
    'valid_until', p.valid_until, 'brand', coalesce(tn.brand_name, tn.name), 'color', tn.brand_color);
end $$;

-- cliente aceita pelo link: proposta aceita + lead vai para Fechado
create or replace function proposal_accept(p_token text) returns boolean
language plpgsql security definer set search_path = public as $$
declare p proposals; won uuid;
begin
  select * into p from proposals where token = p_token and status in ('sent', 'viewed')
    and (valid_until is null or valid_until >= current_date) for update;
  if not found then return false; end if;
  update proposals set status = 'accepted', accepted_at = now() where id = p.id;
  if p.lead_id is not null then
    select id into won from pipeline_stages where tenant_id = p.tenant_id and kind = 'won';
    update leads set stage_id = won where id = p.lead_id and stage_id <> won;
    insert into activities (tenant_id, lead_id, kind, body, by_label)
    values (p.tenant_id, p.lead_id, 'proposal', format('Proposta “%s” aceita pelo cliente', p.title), 'Cliente');
  end if;
  insert into audit_log (tenant_id, action, actor_label, entity, entity_id, summary)
  values (p.tenant_id, 'accept', 'Cliente', 'proposals', p.id, p.title);
  return true;
end $$;

-- captação: chamada só pela Edge Function capture-lead (service_role), depois do Turnstile
create or replace function capture_lead(
  p_slug text, p_name text, p_phone text, p_email text, p_interest text, p_message text,
  p_consent_text text, p_source lead_source default 'form', p_value_cents bigint default 0,
  p_when timestamptz default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare t uuid; s1 uuid; l uuid;
begin
  select id into t from tenants where slug = p_slug or custom_domain = p_slug;
  if t is null then raise exception 'tenant não encontrado'; end if;
  if length(trim(p_name)) < 2 or length(regexp_replace(p_phone, '\D', '', 'g')) not between 10 and 13 then
    raise exception 'dados inválidos';
  end if;
  select id into s1 from pipeline_stages where tenant_id = t order by position limit 1;
  insert into leads (tenant_id, name, phone, email, interest, source, stage_id, value_cents, follow_up_at, consent_at, consent_text)
  values (t, trim(p_name), p_phone, nullif(trim(p_email), ''), p_interest, p_source, s1, coalesce(p_value_cents, 0), p_when, now(), p_consent_text)
  returning id into l;
  insert into activities (tenant_id, lead_id, kind, body, by_label)
  values (t, l, 'form', concat_ws(' · ', 'Chegou pelo ' || case when p_source = 'site' then 'site' else 'formulário' end,
    'interesse: ' || p_interest, nullif(p_message, '')), 'Página');
  if p_when is not null then
    insert into tasks (tenant_id, lead_id, title, kind, due_at, remind_minutes)
    values (t, l, format('Atendimento: %s · %s', trim(p_name), p_interest), 'meeting', p_when, 60);
  end if;
  return l;
end $$;

-- convite: o dono adiciona alguém que já criou conta (o e-mail de convite sai pela Edge Function)
create or replace function invite_member(p_tenant uuid, p_email text, p_role crm_role, p_name text) returns void
language plpgsql security definer set search_path = public, auth as $$
declare u uuid;
begin
  if not has_role(p_tenant, '{owner}') then raise exception 'sem permissão'; end if;
  select id into u from auth.users where lower(email) = lower(p_email);
  if u is null then raise exception 'pessoa ainda não tem conta: envie o link de acesso primeiro'; end if;
  insert into memberships (tenant_id, user_id, role, name, email) values (p_tenant, u, p_role, p_name, p_email)
  on conflict (tenant_id, user_id) do update set role = excluded.role, name = excluded.name;
end $$;

-- ============ permissões ============
revoke all on function capture_lead from public, anon, authenticated;
grant execute on function capture_lead to service_role;
grant execute on function tenant_public, proposal_public, proposal_accept to anon, authenticated;
grant execute on function anonymize_lead, invite_member, is_member, has_role to authenticated;
grant select on leads_masked, cashflow_monthly to authenticated;
revoke all on leads_masked from anon;
