-- AI Commander: supervisão da operação, auditoria, alertas, tarefas, aprovações e despacho para o AI Sales.
-- Exclusivo do dono: só empresas em app.commander_tenants (lista própria, fora da API) e só perfis dono e admin.
-- Reaproveita leads, propostas, cobranças, caixa, mensalidades, projetos, tarefas, notificações e ai_usage.
-- Para desligar: delete from app.commander_tenants where tenant_id = ...; o resto do CRM não muda.

create table app.commander_tenants (tenant_id uuid primary key references public.tenants(id) on delete cascade, enabled_at timestamptz not null default now());
revoke all on app.commander_tenants from public, anon, authenticated;
grant all on app.commander_tenants to service_role;
insert into app.commander_tenants select id from public.tenants where slug = 'amplitudelab' on conflict do nothing;

create or replace function app.cmd_ok(t uuid, roles app.role[] default '{owner,admin}') returns boolean
language sql stable security definer set search_path to '' as $$
  select exists (select 1 from app.commander_tenants c where c.tenant_id = t) and app.has_role(t, roles);
$$;
revoke execute on function app.cmd_ok(uuid, app.role[]) from public, anon;
grant execute on function app.cmd_ok(uuid, app.role[]) to authenticated, service_role;
create or replace function public.commander_status(p_tenant uuid) returns jsonb language sql stable security definer set search_path to '' as $$
  select jsonb_build_object('enabled', app.cmd_ok(p_tenant));
$$;
revoke execute on function public.commander_status(uuid) from public, anon;
grant execute on function public.commander_status(uuid) to authenticated;
create or replace function public.commander_allowed(p_tenant uuid) returns boolean language sql stable security definer set search_path to '' as $$
  select exists (select 1 from app.commander_tenants where tenant_id = p_tenant);
$$;
revoke execute on function public.commander_allowed(uuid) from public, anon, authenticated;
grant execute on function public.commander_allowed(uuid) to service_role;

-- ---------- tabelas existentes que ganham campos ----------
-- Tarefas: a mesma tabela da agenda, agora com categoria, prioridade, status, origem e histórico.
alter table public.tasks
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists priority text not null default 'medium' check (priority in ('critical', 'high', 'medium', 'low')),
  add column if not exists status text not null default 'pending' check (status in ('pending', 'in_progress', 'awaiting_approval', 'completed', 'failed', 'cancelled')),
  add column if not exists origin text not null default 'user' check (origin in ('user', 'commander', 'sales', 'system')),
  add column if not exists related_kind text,
  add column if not exists related_id uuid,
  add column if not exists result text,
  add column if not exists history jsonb not null default '[]',
  add column if not exists dedupe_key text,
  add column if not exists updated_at timestamptz not null default now();
update public.tasks set status = 'completed' where done_at is not null and status = 'pending';
create unique index if not exists tasks_dedupe_open on public.tasks (tenant_id, dedupe_key) where dedupe_key is not null and status in ('pending', 'in_progress', 'awaiting_approval');
-- A agenda marca done_at; o Commander usa status. Os dois ficam sempre de acordo.
create or replace function app.tasks_sync() returns trigger language plpgsql security definer set search_path to '' as $$
begin
  if new.done_at is not null and (tg_op = 'INSERT' or old.done_at is null) and new.status not in ('completed', 'cancelled', 'failed') then new.status := 'completed'; end if;
  if new.done_at is null and tg_op = 'UPDATE' and old.done_at is not null and new.status in ('completed', 'cancelled', 'failed') then new.status := 'pending'; end if;
  -- tarefa encerrada (concluída, cancelada ou com falha) sai da agenda
  if new.status in ('completed', 'cancelled', 'failed') and new.done_at is null then new.done_at := now(); end if;
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    new.history := coalesce(new.history, '[]'::jsonb) || jsonb_build_object('at', now(), 'from', old.status, 'to', new.status, 'by', auth.uid());
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists tasks_sync on public.tasks;
create trigger tasks_sync before insert or update on public.tasks for each row execute function app.tasks_sync();

-- Projetos: responsável, início e tipo de serviço.
alter table public.projects
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
  add column if not exists started_at timestamptz,
  add column if not exists kind text check (kind in ('site', 'crm', 'automacao', 'outro'));
-- O CRM não grava updated_at nem started_at: o banco cuida disso (o auditor usa para ver projeto parado).
create or replace function app.projects_touch() returns trigger language plpgsql set search_path to '' as $$
begin
  if tg_op = 'UPDATE' then new.updated_at := now(); end if;
  if new.stage <> 'briefing' and new.started_at is null then new.started_at := now(); end if;
  return new;
end $$;
drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before insert or update on public.projects for each row execute function app.projects_touch();

-- ---------- tabelas do Commander ----------
create table public.commander_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  name text not null default 'Commander',
  description text not null default 'Diretor operacional virtual: supervisiona vendas, entregas, finanças e os outros agentes.',
  personality text not null default 'analítico, direto e prático',
  tone text not null default 'objetivo e respeitoso',
  language text not null default 'português do Brasil',
  instructions text,
  autonomy text not null default 'assisted' check (autonomy in ('analysis', 'assisted', 'controlled')),
  permissions jsonb not null default '{"read_leads":true,"read_sales":true,"read_clients":true,"read_charges":true,"read_subscriptions":true,"read_projects":true,"create_tasks":true,"update_records":true,"dispatch_sales":true,"reports":true,"approvals":true}',
  monitoring jsonb not null default '{"enabled":true,"interval_minutes":60,"categories":["sales","finance","delivery","subscription","operations","ai"],"notify":true,"stale_days":7,"hot_hours":24,"proposal_days":5,"project_warning_days":3,"approval_days":5,"auto_dispatch":false}',
  provider text not null default 'anthropic',
  model text not null default 'claude-opus-5-5',
  effort text not null default 'medium' check (effort in ('low', 'medium', 'high')),
  limits jsonb not null default '{"monthly_usd":20,"chat_per_day":200}',
  updated_at timestamptz not null default now(),
  updated_by uuid
);
insert into public.commander_settings (tenant_id) select tenant_id from app.commander_tenants on conflict do nothing;

create table public.commander_audits (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  kind text not null default 'full',
  trigger text not null default 'schedule' check (trigger in ('schedule', 'user', 'chat')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  analyzed jsonb not null default '{}',
  findings int not null default 0,
  severity jsonb not null default '{}',
  new_alerts int not null default 0,
  resolved_alerts int not null default 0,
  summary text,
  status text not null default 'running' check (status in ('running', 'done', 'failed')),
  error text
);
create index commander_audits_tenant on public.commander_audits (tenant_id, started_at desc);

create table public.commander_alerts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category text not null check (category in ('sales', 'finance', 'delivery', 'subscription', 'operations', 'ai', 'security')),
  title text not null,
  description text,
  priority text not null check (priority in ('critical', 'high', 'medium', 'low')),
  related_kind text,
  related_id uuid,
  dedupe_key text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  assigned_to uuid,
  recommendation text,
  due_at timestamptz,
  audit_id uuid references public.commander_audits(id) on delete set null,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid,
  history jsonb not null default '[]'
);
create unique index commander_alerts_open on public.commander_alerts (tenant_id, dedupe_key) where status = 'open';
create index commander_alerts_list on public.commander_alerts (tenant_id, status, priority);

create table public.commander_approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  action text not null,
  payload jsonb not null default '{}',
  reason text not null,
  target_kind text,
  target_id uuid,
  changes jsonb not null default '{}',
  consequences text,
  agent text not null default 'commander',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'executed', 'failed', 'expired')),
  dedupe_key text,
  requested_by uuid,
  requested_at timestamptz not null default now(),
  decided_by uuid,
  decided_at timestamptz,
  result jsonb,
  history jsonb not null default '[]'
);
create unique index commander_approvals_open on public.commander_approvals (tenant_id, dedupe_key) where dedupe_key is not null and status = 'pending';

create table public.agent_dispatches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  source_agent text not null default 'commander',
  dest_agent text not null default 'sales',
  task_type text not null check (task_type in ('recover_lead', 'renewal', 'follow_up', 'qualify')),
  lead_id uuid references public.leads(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  approval_id uuid references public.commander_approvals(id) on delete set null,
  context text,
  objective text not null,
  priority text not null default 'medium' check (priority in ('critical', 'high', 'medium', 'low')),
  deadline timestamptz,
  restrictions text,
  authorized_actions jsonb not null default '["send_message","update_lead","schedule_followup","request_human"]',
  approval_required boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'dispatched', 'in_progress', 'completed', 'failed', 'cancelled', 'awaiting_human')),
  result jsonb,
  attempts int not null default 0,
  dedupe_key text,
  locked_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index agent_dispatches_open on public.agent_dispatches (tenant_id, dedupe_key) where dedupe_key is not null and status in ('pending', 'approved', 'dispatched', 'in_progress', 'awaiting_human');
create index agent_dispatches_queue on public.agent_dispatches (status, created_at);

create table public.agent_activity (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  agent text not null,
  action text not null,
  result text not null default 'ok',
  ref_kind text,
  ref_id uuid,
  detail text,
  data jsonb not null default '{}',
  actor uuid,
  created_at timestamptz not null default now()
);
create index agent_activity_tenant on public.agent_activity (tenant_id, created_at desc);

create table public.commander_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  kind text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  data jsonb not null,
  narrative text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table public.commander_chat (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  tools jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index commander_chat_user on public.commander_chat (tenant_id, user_id, id desc);

-- AI Squad: identidade visual de cada agente. O mascote é só a camada visual; a inteligência não depende dele.
create table public.agent_identities (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  agent_id text not null,
  name text not null,
  department text not null,
  description text,
  personality text,
  role text,
  pet_id text,
  avatar text,
  status text not null default 'active' check (status in ('active', 'paused', 'disabled')),
  animation_state text not null default 'idle' check (animation_state in ('idle', 'thinking', 'working', 'analyzing', 'waiting', 'alert', 'success', 'error', 'celebration')),
  performance jsonb not null default '{}',
  permissions jsonb not null default '{}',
  view text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, agent_id)
);
insert into public.agent_identities (tenant_id, agent_id, name, department, description, personality, role, view)
select t, 'commander', 'AI Commander', 'Gestão', 'Supervisiona a operação, audita, prioriza e coordena os outros agentes.', 'liderança, estratégia e clareza', 'Diretor operacional', 'commander' from app.commander_tenants c(t)
union all select t, 'sales', 'AI Sales', 'Comercial', 'Conversa com leads no WhatsApp, qualifica, faz follow-up e chama o time.', 'comunicação, rapidez e empatia', 'Vendedor consultivo', 'aisales' from app.commander_tenants c(t)
on conflict do nothing;

-- ---------- regras de acesso ----------
do $$
declare t text;
begin
  foreach t in array array['commander_settings', 'commander_audits', 'commander_alerts', 'commander_approvals', 'agent_dispatches', 'agent_activity', 'commander_reports', 'commander_chat', 'agent_identities'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('create policy %I on public.%I for select to authenticated using (app.cmd_ok(tenant_id))', t || '_ler', t);
  end loop;
end $$;
-- O chat de cada pessoa é só dela.
drop policy commander_chat_ler on public.commander_chat;
create policy commander_chat_ler on public.commander_chat for select to authenticated using (app.cmd_ok(tenant_id) and user_id = auth.uid());
-- Ver só as próprias empresas também para o AI Sales: o Commander lê ai_* pelas mesmas regras do AI Sales.

-- ---------- serviços determinísticos (sem IA) ----------
-- Painel: números reais do período. Cada número sai de uma consulta, nada é estimado aqui.
create or replace function public.commander_snapshot(p_tenant uuid, p_from timestamptz default date_trunc('month', now()), p_to timestamptz default now()) returns jsonb
language plpgsql stable security definer set search_path to '' as $$
declare r jsonb; open_stages uuid[]; won uuid; prop uuid; neg uuid; today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if auth.uid() is not null and not app.cmd_ok(p_tenant) then raise exception 'Commander não liberado'; end if;
  select array_agg(id) into open_stages from public.pipeline_stages where tenant_id = p_tenant and kind = 'open';
  select id into won from public.pipeline_stages where tenant_id = p_tenant and kind = 'won' order by position limit 1;
  select id into prop from public.pipeline_stages where tenant_id = p_tenant and position = 3;
  select id into neg from public.pipeline_stages where tenant_id = p_tenant and position = 4;
  with l as (select * from public.leads where tenant_id = p_tenant and deleted_at is null),
       hot as (select distinct c.lead_id from public.ai_conversations c join l on l.id = c.lead_id where c.tenant_id = p_tenant and not c.is_test and c.qualification in ('hot', 'qualified') and l.stage_id = any(open_stages)),
       ch as (select * from public.charges where tenant_id = p_tenant and deleted_at is null),
       sb as (select s.*, make_date(extract(year from today)::int, extract(month from today)::int, s.due_day) as due_this from public.subscriptions s where tenant_id = p_tenant),
       pj as (select * from public.projects where tenant_id = p_tenant),
       tk as (select * from public.tasks where tenant_id = p_tenant)
  select jsonb_build_object(
    'period', jsonb_build_object('from', p_from, 'to', p_to),
    'sales', jsonb_build_object(
      'leads_total', (select count(*) from l),
      'leads_new', (select count(*) from l where created_at >= p_from and created_at < p_to),
      'leads_no_owner', (select count(*) from l where owner_id is null and stage_id = any(open_stages)),
      'leads_no_followup', (select count(*) from l where next_follow_up is null and stage_id = any(open_stages)),
      'leads_followup_late', (select count(*) from l where next_follow_up < now() and stage_id = any(open_stages)),
      'leads_hot', (select count(*) from hot),
      'leads_qualified', (select count(distinct lead_id) from public.ai_conversations where tenant_id = p_tenant and not is_test and qualification = 'qualified' and lead_id is not null),
      'leads_negotiation', (select count(*) from l where stage_id in (prop, neg)),
      'sales_count', (select count(*) from l where paid_at >= p_from and paid_at < p_to),
      'conversion_rate', (select case when count(*) filter (where created_at >= p_from and created_at < p_to) = 0 then 0 else round(count(*) filter (where created_at >= p_from and created_at < p_to and paid_at is not null)::numeric / count(*) filter (where created_at >= p_from and created_at < p_to), 4) end from l),
      'avg_ticket_cents', (select coalesce(round(avg(amount_cents)), 0) from ch where status = 'paid' and paid_at >= p_from and paid_at < p_to),
      'revenue_contracted_cents', (select coalesce(sum(total_cents), 0) from public.proposals where tenant_id = p_tenant and deleted_at is null and status = 'accepted' and accepted_at >= p_from and accepted_at < p_to),
      'revenue_billed_cents', (select coalesce(sum(amount_cents), 0) from ch where status in ('pending', 'paid') and created_at >= p_from and created_at < p_to),
      'revenue_received_cents', (select coalesce(sum(amount_cents), 0) from public.cash_entries where tenant_id = p_tenant and deleted_at is null and direction = 'in' and occurred_on >= (p_from at time zone 'America/Sao_Paulo')::date and occurred_on < (p_to at time zone 'America/Sao_Paulo')::date + 1)),
    'operations', jsonb_build_object(
      'projects_open', (select count(*) from pj where stage <> 'entregue'),
      'projects_waiting_approval', (select count(*) from pj where stage = 'aprovacao'),
      'projects_late', (select count(*) from pj where stage <> 'entregue' and due_date < today),
      'crm_projects_open', (select count(*) from pj where stage <> 'entregue' and (kind = 'crm' or title ilike '%crm%')),
      'crm_projects_pending', (select count(*) from pj where stage = 'briefing' and (kind = 'crm' or title ilike '%crm%')),
      'deliveries_due_soon', (select count(*) from pj where stage <> 'entregue' and due_date between today and today + 3),
      'tasks_late', (select count(*) from tk where status in ('pending', 'in_progress') and due_at < now()),
      'tasks_unassigned', (select count(*) from tk where status in ('pending', 'in_progress') and assignee_id is null and origin <> 'user')),
    'finance', jsonb_build_object(
      'charges_pending', (select count(*) from ch where status = 'pending'),
      'charges_pending_cents', (select coalesce(sum(amount_cents), 0) from ch where status = 'pending'),
      'charges_late', (select count(*) from ch where status = 'pending' and due_date < today),
      'charges_late_cents', (select coalesce(sum(amount_cents), 0) from ch where status = 'pending' and due_date < today),
      'payments_received', (select count(*) from ch where status = 'paid' and paid_at >= p_from and paid_at < p_to),
      'payments_awaiting_confirmation', (select count(*) from ch where status = 'pending' and checkout_url is not null),
      'clients_overdue_7d', (select count(distinct coalesce(client_id, lead_id)) from ch where status = 'pending' and due_date < today - 7),
      'mrr_cents', (select coalesce(sum(amount_cents), 0) from sb where status = 'active'),
      'arr_cents', (select coalesce(sum(amount_cents), 0) * 12 from sb where status = 'active'),
      'subs_upcoming', (select count(*) from sb where status = 'active' and (last_paid_on is null or last_paid_on < date_trunc('month', today)) and due_this between today and today + 7),
      'subs_overdue', (select count(*) from sb where status = 'active' and (last_paid_on is null or last_paid_on < date_trunc('month', today)) and due_this < today and (started_on is null or started_on <= due_this))),
    'ai', jsonb_build_object(
      'sales_active', coalesce((select active from public.ai_settings where tenant_id = p_tenant), false),
      'sales_mode', (select mode from public.ai_settings where tenant_id = p_tenant),
      'conversations', (select count(*) from public.ai_conversations where tenant_id = p_tenant and not is_test and created_at >= p_from and created_at < p_to),
      'ai_led', (select count(*) from public.ai_conversations c where tenant_id = p_tenant and not is_test and created_at >= p_from and created_at < p_to and not exists (select 1 from public.ai_handoffs h where h.conversation_id = c.id)),
      'qualified_by_ai', (select count(*) from public.ai_conversations where tenant_id = p_tenant and not is_test and qualification = 'qualified' and created_at >= p_from and created_at < p_to),
      'followups_sent', (select count(*) from public.ai_followups where tenant_id = p_tenant and not is_test and status = 'sent' and processed_at >= p_from and processed_at < p_to),
      'handoffs', (select count(*) from public.ai_handoffs where tenant_id = p_tenant and not is_test and created_at >= p_from and created_at < p_to),
      'dispatches', (select count(*) from public.agent_dispatches where tenant_id = p_tenant and created_at >= p_from and created_at < p_to),
      'dispatches_done', (select count(*) from public.agent_dispatches where tenant_id = p_tenant and status = 'completed' and created_at >= p_from and created_at < p_to),
      'recovered', (select count(*) from public.agent_dispatches where tenant_id = p_tenant and status = 'completed' and result->>'outcome' = 'recovered' and created_at >= p_from and created_at < p_to),
      'failures', (select count(*) from public.agent_dispatches where tenant_id = p_tenant and status = 'failed' and created_at >= p_from and created_at < p_to)
                + (select count(*) from public.ai_logs where tenant_id = p_tenant and level = 'error' and created_at >= p_from and created_at < p_to),
      'cost_usd', (select coalesce(sum(cost_usd), 0) from public.ai_usage where tenant_id = p_tenant and created_at >= p_from and created_at < p_to),
      'tokens', (select coalesce(sum(input_tokens + output_tokens + cache_read_tokens), 0) from public.ai_usage where tenant_id = p_tenant and created_at >= p_from and created_at < p_to))
  ) into r;
  return r;
end $$;
revoke execute on function public.commander_snapshot(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.commander_snapshot(uuid, timestamptz, timestamptz) to authenticated, service_role;

-- Auditoria: regras fixas que encontram problemas reais. Cada achado tem uma chave estável (dedupe_key):
-- o mesmo problema vira um alerta só, que se fecha sozinho quando deixa de existir.
create or replace function public.commander_scan(p_tenant uuid) returns jsonb
language plpgsql stable security definer set search_path to '' as $$
declare m jsonb; stale int; hoth int; propd int; warn int; apprd int; today date := (now() at time zone 'America/Sao_Paulo')::date; open_stages uuid[]; won uuid; out jsonb := '[]';
begin
  select monitoring into m from public.commander_settings where tenant_id = p_tenant;
  stale := coalesce((m->>'stale_days')::int, 7); hoth := coalesce((m->>'hot_hours')::int, 24); propd := coalesce((m->>'proposal_days')::int, 5);
  warn := coalesce((m->>'project_warning_days')::int, 3); apprd := coalesce((m->>'approval_days')::int, 5);
  select array_agg(id) into open_stages from public.pipeline_stages where tenant_id = p_tenant and kind = 'open';
  select id into won from public.pipeline_stages where tenant_id = p_tenant and kind = 'won' order by position limit 1;

  with l as (select l.*, greatest(l.updated_at, coalesce((select max(a.created_at) from public.activities a where a.lead_id = l.id), l.created_at),
                                   coalesce((select max(x.created_at) from public.ai_messages x join public.ai_conversations c on c.id = x.conversation_id where c.lead_id = l.id), l.created_at)) as last_touch
             from public.leads l where l.tenant_id = p_tenant and l.deleted_at is null and l.stage_id = any(open_stages)),
  f as (
    -- comercial: lead quente sem contato
    select 'sales' cat, 'critical' pri, 'lead_hot_' || l.id key, 'Lead quente sem contato: ' || l.name title,
           'Sem contato há ' || floor(extract(epoch from now() - l.last_touch) / 3600)::int || ' horas. Qualificação da IA: ' || c.qualification || ' (' || coalesce(c.score, 0) || '/100).' descr,
           'Pedir ao AI Sales uma recuperação ou ligar hoje.' rec, 'lead' rk, l.id rid, l.owner_id who, now() + interval '4 hours' due
      from l join public.ai_conversations c on c.lead_id = l.id and not c.is_test and c.qualification in ('hot', 'qualified')
     where l.last_touch < now() - make_interval(hours => hoth)
    union all
    select 'sales', 'high', 'lead_followup_late_' || l.id, 'Follow-up vencido: ' || l.name, 'O follow-up era para ' || to_char(l.next_follow_up at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') || '.',
           'Fazer o contato ou remarcar o follow-up.', 'lead', l.id, l.owner_id, now() + interval '1 day'
      from l where l.next_follow_up < now() - interval '1 day'
    union all
    select 'sales', 'medium', 'proposal_stale_' || p.id, 'Proposta sem resposta: ' || p.title, 'Enviada em ' || to_char(p.created_at at time zone 'America/Sao_Paulo', 'DD/MM') || ', ainda sem aceite.',
           'Retomar o contato com o cliente sobre a proposta.', 'proposal', p.id, null::uuid, now() + interval '1 day'
      from public.proposals p where p.tenant_id = p_tenant and p.deleted_at is null and p.status in ('sent', 'viewed') and p.created_at < now() - make_interval(days => propd)
    union all
    -- comercial em lote (um alerta por grupo, para não virar ruído)
    select 'sales', 'low', 'leads_no_owner', (select count(*) from l where owner_id is null) || ' leads abertos sem responsável', 'Sem responsável, ninguém responde por eles.', 'Distribuir os leads entre o time.', null, null, null, null
     where (select count(*) from l where owner_id is null) > 0
    union all
    select 'sales', 'medium', 'leads_stale', (select count(*) from l where last_touch < now() - make_interval(days => stale)) || ' leads sem contato há mais de ' || stale || ' dias', 'Leads abertos esquecidos no funil.', 'Revisar a lista: retomar, encaminhar ao AI Sales ou marcar como perdido.', null, null, null, null
     where (select count(*) from l where last_touch < now() - make_interval(days => stale)) > 0
    union all
    select 'sales', 'low', 'leads_no_next', (select count(*) from l where next_follow_up is null) || ' leads sem próxima atividade', 'Lead aberto sem follow-up marcado.', 'Marcar o próximo contato de cada um.', null, null, null, null
     where (select count(*) from l where next_follow_up is null) > 0
    union all
    -- venda sem registro: lead em Fechado sem pagamento, proposta aceita sem cobrança
    select 'finance', 'high', 'won_no_payment_' || l.id, 'Venda sem pagamento registrado: ' || l.name, 'O lead está em Fechado, mas não há pagamento confirmado.', 'Conferir se a venda foi paga e registrar no financeiro.', 'lead', l.id, l.owner_id, now() + interval '2 days'
      from public.leads l where l.tenant_id = p_tenant and l.deleted_at is null and l.stage_id = won and l.paid_at is null
    union all
    select 'finance', 'high', 'accepted_no_charge_' || p.id, 'Proposta aceita sem cobrança: ' || p.title, coalesce('Aceita em ' || to_char(p.accepted_at at time zone 'America/Sao_Paulo', 'DD/MM') || ', sem', 'Aceita, sem') || ' cobrança vinculada.', 'Gerar a cobrança da proposta.', 'proposal', p.id, null, now() + interval '1 day'
      from public.proposals p where p.tenant_id = p_tenant and p.deleted_at is null and p.status = 'accepted' and not exists (select 1 from public.charges c where c.proposal_id = p.id and c.deleted_at is null and c.status in ('pending', 'paid'))
    union all
    -- financeiro
    select 'finance', case when c.due_date < today - 7 then 'critical' else 'high' end, 'charge_late_' || c.id, 'Cobrança vencida: ' || coalesce(c.description, 'sem descrição'),
           'Venceu em ' || to_char(c.due_date, 'DD/MM') || ' · R$ ' || replace(to_char(c.amount_cents / 100.0, 'FM999999990.00'), '.', ',') || '. Sem pagamento registrado no sistema.',
           'Falar com o cliente e confirmar o pagamento. Não considere pago sem a confirmação.', 'charge', c.id, null, now() + interval '1 day'
      from public.charges c where c.tenant_id = p_tenant and c.deleted_at is null and c.status = 'pending' and c.due_date < today
    union all
    -- assinaturas: alertas por marco (7, 3, 1, 0 dias e vencida), um de cada por mês
    select 'subscription', case when s.due_this < today then 'high' when s.due_this - today <= 1 then 'medium' else 'low' end,
           'sub_' || s.id || '_' || to_char(today, 'YYYYMM') || '_' || case when s.due_this < today then 'late' when s.due_this - today = 0 then 'd0' when s.due_this - today <= 1 then 'd1' when s.due_this - today <= 3 then 'd3' else 'd7' end,
           case when s.due_this < today then 'Mensalidade vencida: ' else 'Mensalidade vence ' || case when s.due_this = today then 'hoje' else 'em ' || (s.due_this - today) || ' dias' end || ': ' end || s.name,
           'R$ ' || replace(to_char(s.amount_cents / 100.0, 'FM999999990.00'), '.', ',') || ' todo dia ' || s.due_day || '. Último pagamento: ' || coalesce(to_char(s.last_paid_on, 'DD/MM/YYYY'), 'nenhum') || '.',
           case when s.due_this < today then 'Confirmar o pagamento com o cliente antes de qualquer cobrança.' else 'Mandar o link da mensalidade.' end, 'subscription', s.id, null, s.due_this::timestamptz
      from (select s.*, make_date(extract(year from today)::int, extract(month from today)::int, s.due_day) due_this from public.subscriptions s where s.tenant_id = p_tenant and s.status = 'active') s
     where (s.last_paid_on is null or s.last_paid_on < date_trunc('month', today)) and s.due_this <= today + 7 and (s.started_on is null or s.started_on <= s.due_this)
    union all
    -- entregas
    select 'delivery', 'high', 'project_late_' || p.id, 'Projeto atrasado: ' || p.title, 'Prazo era ' || to_char(p.due_date, 'DD/MM') || '. Etapa atual: ' || p.stage || '.', 'Atualizar o cliente e combinar novo prazo.', 'project', p.id, p.assigned_to, now() + interval '1 day'
      from public.projects p where p.tenant_id = p_tenant and p.stage <> 'entregue' and p.due_date < today
    union all
    select 'delivery', 'medium', 'project_due_' || p.id, 'Entrega próxima: ' || p.title, 'Prazo em ' || to_char(p.due_date, 'DD/MM') || '. Etapa atual: ' || p.stage || '.', 'Garantir que a entrega sai no prazo.', 'project', p.id, p.assigned_to, p.due_date::timestamptz
      from public.projects p where p.tenant_id = p_tenant and p.stage <> 'entregue' and p.due_date between today and today + warn
    union all
    select 'delivery', 'medium', 'project_no_due_' || p.id, 'Projeto sem prazo: ' || p.title, 'Sem data de entrega combinada.', 'Definir o prazo com o cliente.', 'project', p.id, p.assigned_to, null
      from public.projects p where p.tenant_id = p_tenant and p.stage <> 'entregue' and p.due_date is null
    union all
    select 'delivery', 'low', 'project_no_owner_' || p.id, 'Projeto sem responsável: ' || p.title, 'Ninguém está marcado como responsável.', 'Definir quem cuida do projeto.', 'project', p.id, null, null
      from public.projects p where p.tenant_id = p_tenant and p.stage <> 'entregue' and p.assigned_to is null
    union all
    select 'delivery', 'medium', 'project_approval_' || p.id, 'Aguardando aprovação há muito tempo: ' || p.title, 'Em aprovação desde ' || to_char(p.updated_at at time zone 'America/Sao_Paulo', 'DD/MM') || '.', 'Cobrar a aprovação do cliente.', 'project', p.id, p.assigned_to, now() + interval '1 day'
      from public.projects p where p.tenant_id = p_tenant and p.stage = 'aprovacao' and p.updated_at < now() - make_interval(days => apprd)
    union all
    select 'delivery', 'low', 'project_no_evidence_' || p.id, 'Entrega sem evidência: ' || p.title, 'Marcado como entregue, sem arquivo de entrega anexado.', 'Anexar o link ou o arquivo entregue em Arquivos, ligado ao projeto.', 'project', p.id, p.assigned_to, null
      from public.projects p where p.tenant_id = p_tenant and p.stage = 'entregue' and p.delivered_at > now() - interval '60 days' and not exists (select 1 from public.files f where f.project_id = p.id)
    union all
    select 'delivery', 'medium', 'sale_no_project_' || l.id, 'Venda sem projeto de entrega: ' || l.name, 'Pagamento confirmado em ' || to_char(l.paid_at at time zone 'America/Sao_Paulo', 'DD/MM') || ', sem projeto criado.', 'Abrir o projeto de entrega.', 'lead', l.id, l.owner_id, now() + interval '1 day'
      from public.leads l where l.tenant_id = p_tenant and l.deleted_at is null and l.paid_at > now() - interval '90 days' and not exists (select 1 from public.projects p where p.lead_id = l.id)
    union all
    -- processos
    select 'operations', 'medium', 'task_late_' || t.id, 'Tarefa vencida: ' || t.title, 'Prazo era ' || to_char(t.due_at at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') || '.', 'Concluir ou remarcar a tarefa.', 'task', t.id, t.assignee_id, null
      from public.tasks t where t.tenant_id = p_tenant and t.status in ('pending', 'in_progress') and t.due_at < now() - interval '1 day'
    union all
    select 'operations', 'low', 'tasks_unassigned', (select count(*) from public.tasks t where t.tenant_id = p_tenant and t.status in ('pending', 'in_progress') and t.assignee_id is null and t.origin <> 'user') || ' tarefas do Commander sem responsável', 'Tarefas criadas pelos agentes sem pessoa definida.', 'Atribuir as tarefas.', null, null, null, null
     where (select count(*) from public.tasks t where t.tenant_id = p_tenant and t.status in ('pending', 'in_progress') and t.assignee_id is null and t.origin <> 'user') > 0
    union all
    select 'operations', 'low', 'dup_phone_' || d.phone, 'Leads duplicados: telefone ' || d.phone, d.n || ' leads abertos com o mesmo telefone.', 'Juntar os registros e apagar os repetidos.', null, null, null, null
      from (select regexp_replace(phone, '\D', '', 'g') phone, count(*) n from public.leads where tenant_id = p_tenant and deleted_at is null and length(regexp_replace(coalesce(phone, ''), '\D', '', 'g')) >= 10 group by 1 having count(*) > 1) d
    union all
    -- agentes
    select 'ai', 'high', 'dispatch_failed_' || d.id, 'Tarefa do AI Sales falhou', coalesce(d.result->>'error', 'Sem detalhe'), 'Ver o motivo e reenviar ou tratar à mão.', 'dispatch', d.id, null, null
      from public.agent_dispatches d where d.tenant_id = p_tenant and d.status = 'failed' and d.updated_at > now() - interval '7 days'
    union all
    select 'ai', 'medium', 'sales_errors_' || to_char(today, 'YYYYMMDD'), (select count(*) from public.ai_logs g where g.tenant_id = p_tenant and g.level = 'error' and g.created_at > now() - interval '24 hours') || ' erros do AI Sales nas últimas 24 h', 'Veja AI Sales → Configurações → Logs.', 'Conferir as credenciais e a chave da IA.', null, null, null, null
     where (select count(*) from public.ai_logs g where g.tenant_id = p_tenant and g.level = 'error' and g.created_at > now() - interval '24 hours') > 0
    union all
    select 'ai', 'medium', 'handoff_open_' || h.id, 'Cliente aguardando vendedor há mais de 2 h', coalesce(h.reason, '') || '. ' || coalesce(h.summary, ''), 'Assumir a conversa em AI Sales → Transferências.', 'conversation', h.conversation_id, h.assigned_to, now() + interval '1 hour'
      from public.ai_handoffs h join public.ai_conversations c on c.id = h.conversation_id where h.tenant_id = p_tenant and not h.is_test and h.resolved_at is null and c.status = 'human_requested' and h.created_at < now() - interval '2 hours'
    union all
    -- segurança: aprovações paradas
    select 'security', 'low', 'approval_waiting_' || a.id, 'Aprovação esperando há mais de 2 dias: ' || a.action, a.reason, 'Aprovar ou recusar em AI Commander → Aprovações.', 'approval', a.id, null, null
      from public.commander_approvals a where a.tenant_id = p_tenant and a.status = 'pending' and a.requested_at < now() - interval '2 days'
  )
  select coalesce(jsonb_agg(jsonb_build_object('category', cat, 'priority', pri, 'key', key, 'title', title, 'description', descr, 'recommendation', rec, 'related_kind', rk, 'related_id', rid, 'assigned_to', who, 'due_at', due)), '[]')
    into out from (select distinct on (key) * from f order by key, array_position(array['critical', 'high', 'medium', 'low'], pri)) f where cat = any(array(select jsonb_array_elements_text(coalesce(m->'categories', '["sales","finance","delivery","subscription","operations","ai","security"]'))) || array['security']);
  return out;
end $$;
revoke execute on function public.commander_scan(uuid) from public, anon, authenticated;
grant execute on function public.commander_scan(uuid) to service_role;

-- Roda a auditoria: grava o registro, abre alertas novos, atualiza os que continuam e fecha os que sumiram.
create or replace function public.commander_run_audit(p_tenant uuid, p_trigger text default 'schedule') returns jsonb
language plpgsql security definer set search_path to '' as $$
declare a uuid; f jsonb; x jsonb; n_new int := 0; important text[] := '{}'; n_res int := 0; keys text[] := '{}'; sev jsonb; notify_on boolean; aid uuid;
begin
  if not exists (select 1 from app.commander_tenants where tenant_id = p_tenant) then raise exception 'Commander não liberado'; end if;
  if auth.uid() is not null and not app.cmd_ok(p_tenant) then raise exception 'Sem permissão'; end if;
  -- evita duas auditorias da mesma empresa ao mesmo tempo
  if not pg_try_advisory_xact_lock(hashtext('commander_audit_' || p_tenant)) then return jsonb_build_object('skipped', 'auditoria em andamento'); end if;
  insert into public.commander_audits (tenant_id, trigger, analyzed) values (p_tenant, p_trigger, jsonb_build_object(
    'leads', (select count(*) from public.leads where tenant_id = p_tenant and deleted_at is null),
    'proposals', (select count(*) from public.proposals where tenant_id = p_tenant and deleted_at is null),
    'charges', (select count(*) from public.charges where tenant_id = p_tenant and deleted_at is null),
    'subscriptions', (select count(*) from public.subscriptions where tenant_id = p_tenant),
    'projects', (select count(*) from public.projects where tenant_id = p_tenant),
    'tasks', (select count(*) from public.tasks where tenant_id = p_tenant))) returning id into a;
  f := public.commander_scan(p_tenant);
  select coalesce((monitoring->>'notify')::boolean, true) into notify_on from public.commander_settings where tenant_id = p_tenant;
  for x in select * from jsonb_array_elements(f) loop
    keys := keys || (x->>'key');
    update public.commander_alerts set last_seen = now(), title = x->>'title', description = x->>'description', priority = x->>'priority', audit_id = a
     where tenant_id = p_tenant and dedupe_key = x->>'key' and status = 'open' returning id into aid;
    if aid is null then
      -- alerta dispensado continua dispensado enquanto o problema for o mesmo
      if exists (select 1 from public.commander_alerts where tenant_id = p_tenant and dedupe_key = x->>'key' and status = 'dismissed' and resolved_at > now() - interval '30 days') then continue; end if;
      insert into public.commander_alerts (tenant_id, category, title, description, priority, related_kind, related_id, dedupe_key, assigned_to, recommendation, due_at, audit_id)
      values (p_tenant, x->>'category', x->>'title', x->>'description', x->>'priority', x->>'related_kind', nullif(x->>'related_id', '')::uuid, x->>'key', nullif(x->>'assigned_to', '')::uuid, x->>'recommendation', nullif(x->>'due_at', '')::timestamptz, a);
      n_new := n_new + 1;
      if x->>'priority' in ('critical', 'high') then important := important || (x->>'title'); end if;
    end if;
    aid := null;
  end loop;
  if notify_on and cardinality(important) > 0 then
    insert into public.notifications (tenant_id, kind, title, body) values (p_tenant, 'system',
      case when cardinality(important) = 1 then 'Commander: ' || important[1] else 'Commander: ' || cardinality(important) || ' alertas importantes' end,
      array_to_string(important[1:3], ' · ') || case when cardinality(important) > 3 then ' e mais ' || (cardinality(important) - 3) else '' end);
  end if;
  with r as (update public.commander_alerts set status = 'resolved', resolved_at = now(), history = history || jsonb_build_object('at', now(), 'to', 'resolved', 'by', 'auditoria')
              where tenant_id = p_tenant and status = 'open' and not (dedupe_key = any(keys)) returning 1) select count(*) into n_res from r;
  select coalesce(jsonb_object_agg(p, n), '{}') into sev from (select x->>'priority' p, count(*) n from jsonb_array_elements(f) x group by 1) s;
  update public.commander_audits set finished_at = now(), findings = jsonb_array_length(f), severity = sev, new_alerts = n_new, resolved_alerts = n_res, status = 'done',
    summary = jsonb_array_length(f) || ' problemas encontrados, ' || n_new || ' novos e ' || n_res || ' resolvidos desde a última auditoria.' where id = a;
  update public.agent_identities set animation_state = case when coalesce((sev->>'critical')::int, 0) > 0 then 'alert' else 'idle' end, updated_at = now() where tenant_id = p_tenant and agent_id = 'commander';
  insert into public.agent_activity (tenant_id, agent, action, result, ref_kind, ref_id, detail, actor) values (p_tenant, 'commander', 'audit', 'ok', 'audit', a, jsonb_array_length(f) || ' achados, ' || n_new || ' novos', auth.uid());
  return jsonb_build_object('audit_id', a, 'findings', jsonb_array_length(f), 'new', n_new, 'resolved', n_res, 'severity', sev);
end $$;
revoke execute on function public.commander_run_audit(uuid, text) from public, anon;
grant execute on function public.commander_run_audit(uuid, text) to authenticated, service_role;

-- Monitoramento periódico: respeita o intervalo configurado de cada empresa.
create or replace function app.commander_monitor() returns void language plpgsql security definer set search_path to '' as $$
declare t record;
begin
  for t in select s.tenant_id, s.monitoring from public.commander_settings s join app.commander_tenants c using (tenant_id) where coalesce((s.monitoring->>'enabled')::boolean, true) loop
    if not exists (select 1 from public.commander_audits a where a.tenant_id = t.tenant_id and a.trigger = 'schedule' and a.started_at > now() - make_interval(mins => greatest(15, coalesce((t.monitoring->>'interval_minutes')::int, 60)) - 1)) then
      begin perform public.commander_run_audit(t.tenant_id, 'schedule');
      exception when others then insert into public.agent_activity (tenant_id, agent, action, result, detail) values (t.tenant_id, 'commander', 'audit', 'failed', sqlerrm); end;
    end if;
  end loop;
end $$;
revoke execute on function app.commander_monitor() from public, anon, authenticated;
select cron.schedule('commander-monitor', '*/15 * * * *', 'select app.commander_monitor()');
