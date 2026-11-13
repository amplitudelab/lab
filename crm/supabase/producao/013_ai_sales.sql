-- AI Sales: agente comercial privado do dono do CRM. Não acompanha as versões vendidas aos clientes.
-- Isolamento: só empresas em app.ai_sales_tenants (schema app, fora da API) enxergam ou executam o módulo.
-- Para desligar de vez: delete from app.ai_sales_tenants where tenant_id = ...; o resto do CRM não muda.

create table app.ai_sales_tenants (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  enabled_at timestamptz not null default now(),
  note text
);
revoke all on app.ai_sales_tenants from public, anon, authenticated;
grant all on app.ai_sales_tenants to service_role;
insert into app.ai_sales_tenants (tenant_id, note)
select id, 'Instalação administrativa da Amplitude Lab' from public.tenants where slug = 'amplitudelab' on conflict do nothing;

-- Quem pode usar o módulo: empresa liberada + perfil permitido. Usada por todas as regras de acesso abaixo.
create or replace function app.ai_ok(t uuid, roles app.role[] default '{owner,admin,sales}') returns boolean
language sql stable security definer set search_path to '' as $$
  select exists (select 1 from app.ai_sales_tenants a where a.tenant_id = t) and app.has_role(t, roles);
$$;
revoke execute on function app.ai_ok(uuid, app.role[]) from public, anon;
grant execute on function app.ai_ok(uuid, app.role[]) to authenticated, service_role;

-- O CRM pergunta ao servidor se mostra a aba. Empresas fora da lista recebem só "enabled": false.
create or replace function public.ai_sales_status(p_tenant uuid) returns jsonb
language sql stable security definer set search_path to '' as $$
  select jsonb_build_object('enabled', app.ai_ok(p_tenant), 'admin', app.ai_ok(p_tenant, '{owner,admin}'));
$$;
revoke execute on function public.ai_sales_status(uuid) from public, anon;
grant execute on function public.ai_sales_status(uuid) to authenticated;

-- ---------- configurações (uma linha por empresa liberada) ----------
create table public.ai_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  active boolean not null default false,             -- agente ligado
  mode text not null default 'simulation' check (mode in ('simulation', 'development', 'production')),
  provider text not null default 'anthropic',
  model text not null default 'claude-opus-5-5',
  effort text not null default 'low' check (effort in ('low', 'medium', 'high')),
  persona jsonb not null default '{}',
  sales jsonb not null default '{}',
  qualification jsonb not null default '{}',
  followup jsonb not null default '{}',
  handoff jsonb not null default '{}',
  hours jsonb not null default '{}',
  limits jsonb not null default '{}',
  whatsapp jsonb not null default '{}',               -- só dados públicos (IDs); os tokens ficam no Vault
  prompt text,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
insert into public.ai_settings (tenant_id) select tenant_id from app.ai_sales_tenants on conflict do nothing;

-- ---------- conversas e mensagens ----------
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  wa_id text not null,                                -- número do WhatsApp só com dígitos
  contact_name text,
  photo_url text,
  status text not null default 'ai_active' check (status in ('ai_active', 'human_requested', 'human_assigned', 'waiting_customer', 'closed')),
  assigned_to uuid,
  qualification text not null default 'cold' check (qualification in ('cold', 'warm', 'hot', 'qualified', 'unqualified')),
  score int not null default 0 check (score between 0 and 100),
  probability int not null default 0 check (probability between 0 and 100),
  summary text,
  next_action text,
  is_test boolean not null default false,
  opted_out boolean not null default false,
  last_message_at timestamptz,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  lock_until timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, wa_id, is_test)
);
create index ai_conversations_list on public.ai_conversations (tenant_id, last_message_at desc);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  direction text not null check (direction in ('in', 'out')),
  author text not null check (author in ('customer', 'ai', 'human', 'system')),
  kind text not null default 'text' check (kind in ('text', 'template', 'audio', 'media', 'note')),
  body text not null default '',
  wa_message_id text unique,                          -- deduplicação dos eventos da Meta
  reply_to uuid unique references public.ai_messages(id) on delete set null,  -- uma resposta da IA por mensagem
  status text not null default 'received' check (status in ('received', 'queued', 'sent', 'delivered', 'read', 'failed', 'simulated', 'blocked')),
  error text,
  is_test boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index ai_messages_conv on public.ai_messages (conversation_id, created_at);

-- ---------- memória por contato (continua entre sessões) ----------
create table public.ai_memory (
  conversation_id uuid primary key references public.ai_conversations(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  profile jsonb not null default '{}',                -- necessidade, problema, urgência, orçamento, decisor, prazo, produto
  objections jsonb not null default '[]',
  facts jsonb not null default '[]',
  history jsonb not null default '[]',                -- o que mudou e quando: nada é sobrescrito sem registro
  updated_at timestamptz not null default now()
);

-- ---------- follow-ups (fila persistente) ----------
create table public.ai_followups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  due_at timestamptz not null,
  attempt int not null default 1,
  status text not null default 'pending' check (status in ('pending', 'sent', 'canceled', 'skipped', 'failed', 'needs_template')),
  reason text,
  note text,
  created_by text not null default 'rule' check (created_by in ('rule', 'ai', 'human')),
  is_test boolean not null default false,
  locked_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
create index ai_followups_due on public.ai_followups (status, due_at);

-- ---------- transferências para humano ----------
create table public.ai_handoffs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  reason text not null,
  summary text,
  needs text,
  objections text,
  next_step text,
  requested_by text not null default 'ai' check (requested_by in ('ai', 'human', 'customer')),
  assigned_to uuid,
  is_test boolean not null default false,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution text
);

-- ---------- consumo de IA ----------
create table public.ai_usage (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  provider text not null,
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cache_read_tokens int not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  purpose text not null default 'reply',
  is_test boolean not null default false,
  created_at timestamptz not null default now()
);
create index ai_usage_tenant on public.ai_usage (tenant_id, created_at);

-- ---------- eventos do WhatsApp (idempotência) e logs ----------
create table public.ai_wa_events (
  id text primary key,                                -- id da mensagem ou status: o mesmo evento nunca é processado duas vezes
  tenant_id uuid references public.tenants(id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}',
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);
create table public.ai_logs (
  id bigint generated always as identity primary key,
  tenant_id uuid references public.tenants(id) on delete cascade,
  level text not null default 'info' check (level in ('info', 'warn', 'error')),
  scope text not null,
  message text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index ai_logs_tenant on public.ai_logs (tenant_id, created_at desc);

-- ---------- base de conhecimento ----------
create table public.ai_knowledge (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  kind text not null default 'faq',
  title text not null,
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- regras de acesso ----------
-- Leitura: equipe comercial da empresa liberada. Escrita: só pelo servidor (função ai-sales), exceto a base de
-- conhecimento, que dono e admin editam direto. Configurações e credenciais passam sempre pelo servidor.
do $$
declare t text;
begin
  foreach t in array array['ai_settings', 'ai_conversations', 'ai_messages', 'ai_memory', 'ai_followups', 'ai_handoffs', 'ai_usage', 'ai_wa_events', 'ai_logs', 'ai_knowledge'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;
grant select on public.ai_conversations, public.ai_messages, public.ai_memory, public.ai_followups, public.ai_handoffs, public.ai_knowledge to authenticated;
grant select on public.ai_settings, public.ai_usage, public.ai_logs, public.ai_wa_events to authenticated;
grant insert, update, delete on public.ai_knowledge to authenticated;
create policy ai_conv_ler on public.ai_conversations for select to authenticated using (app.ai_ok(tenant_id));
create policy ai_msg_ler on public.ai_messages for select to authenticated using (app.ai_ok(tenant_id));
create policy ai_mem_ler on public.ai_memory for select to authenticated using (app.ai_ok(tenant_id));
create policy ai_fu_ler on public.ai_followups for select to authenticated using (app.ai_ok(tenant_id));
create policy ai_ho_ler on public.ai_handoffs for select to authenticated using (app.ai_ok(tenant_id));
create policy ai_kb_ler on public.ai_knowledge for select to authenticated using (app.ai_ok(tenant_id));
create policy ai_kb_criar on public.ai_knowledge for insert to authenticated with check (app.ai_ok(tenant_id, '{owner,admin}'));
create policy ai_kb_editar on public.ai_knowledge for update to authenticated using (app.ai_ok(tenant_id, '{owner,admin}'));
create policy ai_kb_apagar on public.ai_knowledge for delete to authenticated using (app.ai_ok(tenant_id, '{owner,admin}'));
create policy ai_set_ler on public.ai_settings for select to authenticated using (app.ai_ok(tenant_id, '{owner,admin}'));
create policy ai_use_ler on public.ai_usage for select to authenticated using (app.ai_ok(tenant_id, '{owner,admin}'));
create policy ai_log_ler on public.ai_logs for select to authenticated using (app.ai_ok(tenant_id, '{owner,admin}'));
create policy ai_ev_ler on public.ai_wa_events for select to authenticated using (app.ai_ok(tenant_id, '{owner,admin}'));

-- ---------- regras automáticas ----------
-- O cliente respondeu: cancela os follow-ups pendentes da conversa.
create or replace function app.ai_on_message() returns trigger language plpgsql security definer set search_path to '' as $$
begin
  if new.direction = 'in' then
    update public.ai_followups set status = 'canceled', reason = coalesce(reason, '') || ' · cliente respondeu', processed_at = now()
     where conversation_id = new.conversation_id and status = 'pending';
    update public.ai_conversations set last_inbound_at = new.created_at, last_message_at = new.created_at,
      status = case when status = 'waiting_customer' then 'ai_active' else status end
     where id = new.conversation_id;
  else
    update public.ai_conversations set last_outbound_at = new.created_at, last_message_at = new.created_at where id = new.conversation_id;
  end if;
  return new;
end $$;
create trigger ai_messages_after after insert on public.ai_messages for each row execute function app.ai_on_message();

-- Humano assumiu, conversa encerrada ou pedido para parar: nenhum follow-up automático continua na fila.
create or replace function app.ai_on_conversation() returns trigger language plpgsql security definer set search_path to '' as $$
begin
  if (new.status in ('human_requested', 'human_assigned', 'closed') and new.status is distinct from old.status)
     or (new.opted_out and not old.opted_out)
     or (new.qualification = 'unqualified' and old.qualification <> 'unqualified') then
    update public.ai_followups set status = 'canceled', processed_at = now(),
      reason = coalesce(reason, '') || ' · ' || case when new.opted_out and not old.opted_out then 'pediu para parar' when new.qualification = 'unqualified' then 'não qualificado' else 'conversa ' || new.status end
     where conversation_id = new.id and status = 'pending';
  end if;
  return new;
end $$;
create trigger ai_conversations_after after update on public.ai_conversations for each row execute function app.ai_on_conversation();

-- Trava por conversa: duas execuções do agente nunca respondem à mesma conversa ao mesmo tempo.
create or replace function public.ai_claim_conversation(p_conv uuid, p_seconds int default 90) returns boolean
language sql security definer set search_path to '' as $$
  with c as (update public.ai_conversations set lock_until = now() + make_interval(secs => p_seconds)
              where id = p_conv and (lock_until is null or lock_until < now()) returning 1)
  select exists (select 1 from c);
$$;
create or replace function public.ai_release_conversation(p_conv uuid) returns void
language sql security definer set search_path to '' as $$ update public.ai_conversations set lock_until = null where id = p_conv; $$;

-- Pega follow-ups vencidos sem que duas execuções peguem o mesmo.
create or replace function public.ai_claim_followups(p_limit int default 20) returns setof public.ai_followups
language sql security definer set search_path to '' as $$
  update public.ai_followups f set locked_at = now()
   where f.id in (select id from public.ai_followups
                   where status = 'pending' and due_at <= now() and (locked_at is null or locked_at < now() - interval '10 minutes')
                     and tenant_id in (select tenant_id from app.ai_sales_tenants)
                   order by due_at limit p_limit for update skip locked)
  returning f.*;
$$;

-- Liga o contato a um lead do CRM: procura pelo telefone; se não achar, cria em "Novo" com origem WhatsApp.
create or replace function public.ai_link_lead(p_tenant uuid, p_digits text, p_name text) returns uuid
language plpgsql security definer set search_path to '' as $$
declare l uuid; d text := regexp_replace(coalesce(p_digits, ''), '\D', '', 'g'); local text; st uuid;
begin
  if not exists (select 1 from app.ai_sales_tenants where tenant_id = p_tenant) then raise exception 'AI Sales não liberado'; end if;
  local := case when d like '55%' and length(d) >= 12 then substr(d, 3) else d end;
  select id into l from public.leads where tenant_id = p_tenant and deleted_at is null
     and regexp_replace(coalesce(phone, ''), '\D', '', 'g') in (d, local, '55' || local) order by created_at desc limit 1;
  if l is null then
    select id into st from public.pipeline_stages where tenant_id = p_tenant order by position limit 1;
    insert into public.leads (tenant_id, stage_id, name, phone, interest, source, utm)
    values (p_tenant, st, coalesce(nullif(btrim(p_name), ''), 'Contato do WhatsApp'), local, 'Conversa pelo WhatsApp', 'whatsapp', jsonb_build_object('ai_sales', true))
    returning id into l;
  end if;
  return l;
end $$;

-- Custo do mês, para o teto de consumo.
create or replace function public.ai_month_cost(p_tenant uuid) returns numeric
language sql stable security definer set search_path to '' as $$
  select coalesce(sum(cost_usd), 0) from public.ai_usage where tenant_id = p_tenant and created_at >= date_trunc('month', now());
$$;

-- Credenciais: gravadas no Vault com o nome "ai:<empresa>:<campo>". O navegador só fica sabendo se existem.
create or replace function public.ai_secret_set(p_tenant uuid, p_name text, p_value text) returns void
language plpgsql security definer set search_path to '' as $$
declare n text := 'ai:' || p_tenant || ':' || p_name; sid uuid;
begin
  if p_name not in ('wa_access_token', 'wa_app_secret', 'wa_verify_token', 'anthropic_api_key') then raise exception 'campo inválido'; end if;
  select id into sid from vault.secrets where name = n;
  if coalesce(btrim(p_value), '') = '' then
    if sid is not null then delete from vault.secrets where id = sid; end if;
  elsif sid is null then perform vault.create_secret(p_value, n);
  else perform vault.update_secret(sid, p_value, n);
  end if;
end $$;
create or replace function public.ai_secret_get(p_tenant uuid, p_name text) returns text
language sql stable security definer set search_path to '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'ai:' || p_tenant || ':' || p_name limit 1;
$$;
create or replace function public.ai_secret_list(p_tenant uuid) returns jsonb
language sql stable security definer set search_path to '' as $$
  select coalesce(jsonb_object_agg(split_part(name, ':', 3), true), '{}') from vault.secrets where name like 'ai:' || p_tenant || ':%';
$$;

revoke execute on function public.ai_claim_conversation(uuid, int), public.ai_release_conversation(uuid), public.ai_claim_followups(int),
  public.ai_link_lead(uuid, text, text), public.ai_month_cost(uuid), public.ai_secret_set(uuid, text, text),
  public.ai_secret_get(uuid, text), public.ai_secret_list(uuid) from public, anon, authenticated;
grant execute on function public.ai_claim_conversation(uuid, int), public.ai_release_conversation(uuid), public.ai_claim_followups(int),
  public.ai_link_lead(uuid, text, text), public.ai_month_cost(uuid), public.ai_secret_set(uuid, text, text),
  public.ai_secret_get(uuid, text), public.ai_secret_list(uuid) to service_role;
grant execute on function app.ai_on_message(), app.ai_on_conversation() to service_role;

-- Fila de follow-ups: a cada 10 minutos, só para empresas liberadas (a função confere de novo).
select cron.schedule('ai-sales-followups', '*/10 * * * *', $c$
  select net.http_post(url := 'https://ozregdgphaxkxumsujys.supabase.co/functions/v1/ai-sales',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-interno', app.secret('interno')),
    body := '{"action":"tick"}'::jsonb, timeout_milliseconds := 120000)
  where exists (select 1 from public.ai_settings s join app.ai_sales_tenants a using (tenant_id) where s.active)
$c$);
