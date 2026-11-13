-- AI Commander, parte 2: despacho para o AI Sales com retorno, inadimplência só por confirmação humana,
-- inteligência comercial e dados do relatório. Tudo determinístico (SQL), sem IA.

-- ---------- despacho Commander → AI Sales ----------
-- Cada mensagem enviada por um despacho fica ligada a ele: o índice único impede mandar duas vezes no reprocessamento.
alter table public.ai_messages add column if not exists dispatch_id uuid references public.agent_dispatches(id) on delete set null;
create unique index if not exists ai_messages_dispatch on public.ai_messages (dispatch_id) where dispatch_id is not null;

-- O AI Sales pega os despachos aprovados (ou travados há mais de 10 min) um de cada vez, no máximo 3 tentativas.
create or replace function public.ai_claim_dispatches(p_limit int default 10, p_id uuid default null) returns setof public.agent_dispatches
language sql security definer set search_path to '' as $$
  update public.agent_dispatches d set status = 'dispatched', attempts = d.attempts + 1, locked_at = now(), updated_at = now()
   where d.id in (select x.id from public.agent_dispatches x
                   where x.dest_agent = 'sales' and x.attempts < 3 and (p_id is null or x.id = p_id)
                     and (x.status = 'approved' or (x.status = 'dispatched' and x.locked_at < now() - interval '10 minutes'))
                   order by x.created_at limit p_limit for update skip locked)
  returning d.*;
$$;
revoke execute on function public.ai_claim_dispatches(int, uuid) from public, anon, authenticated;
grant execute on function public.ai_claim_dispatches(int, uuid) to service_role;

-- Retorno automático: o cliente respondeu → o despacho em andamento termina como "respondeu".
create or replace function app.dispatch_on_reply() returns trigger language plpgsql security definer set search_path to '' as $$
begin
  if new.direction = 'in' and not new.is_test then
    with d as (update public.agent_dispatches set status = 'completed', updated_at = now(),
                 result = coalesce(result, '{}') || jsonb_build_object('outcome', 'replied', 'replied_at', now(), 'reply', left(new.body, 300), 'next_action', 'Seguir a conversa (o AI Sales já responde) ou assumir em AI Sales → Inbox')
                where conversation_id = new.conversation_id and status = 'in_progress' returning id, tenant_id)
    insert into public.agent_activity (tenant_id, agent, action, result, ref_kind, ref_id, detail)
    select tenant_id, 'sales', 'dispatch_result', 'ok', 'dispatch', id, 'O cliente respondeu à abordagem.' from d;
  end if;
  return null;
end $$;
drop trigger if exists ai_messages_dispatch on public.ai_messages;
create trigger ai_messages_dispatch after insert on public.ai_messages for each row execute function app.dispatch_on_reply();

-- O lead pagou depois da abordagem → "convertido". Só vale com pagamento real registrado (paid_at).
create or replace function app.dispatch_on_paid() returns trigger language plpgsql security definer set search_path to '' as $$
begin
  if new.paid_at is not null and old.paid_at is null then
    update public.agent_dispatches set status = 'completed', updated_at = now(),
           result = coalesce(result, '{}') || jsonb_build_object('outcome', 'converted', 'converted_at', now())
     where lead_id = new.id and status in ('in_progress', 'completed') and created_at > now() - interval '60 days' and coalesce(result->>'outcome', '') <> 'converted';
  end if;
  return null;
end $$;
drop trigger if exists leads_dispatch_paid on public.leads;
create trigger leads_dispatch_paid after update of paid_at on public.leads for each row execute function app.dispatch_on_paid();

-- ---------- inadimplência confirmada ----------
-- Cobrança vencida não é inadimplência. Só vira "confirmada" quando uma pessoa confirma no CRM (ou aprova o pedido do Commander).
alter table public.charges
  add column if not exists delinquent_confirmed_at timestamptz,
  add column if not exists delinquent_confirmed_by uuid;

-- Painel: mesmas contas da parte 1, com "oportunidades recuperadas" (respondeu ou pagou) e inadimplentes confirmados.
create or replace function public.commander_snapshot(p_tenant uuid, p_from timestamptz default date_trunc('month', now()), p_to timestamptz default now()) returns jsonb
language plpgsql stable security definer set search_path to '' as $$
declare r jsonb; open_stages uuid[]; prop uuid; neg uuid; today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if auth.uid() is not null and not app.cmd_ok(p_tenant) then raise exception 'Commander não liberado'; end if;
  select array_agg(id) into open_stages from public.pipeline_stages where tenant_id = p_tenant and kind = 'open';
  select id into prop from public.pipeline_stages where tenant_id = p_tenant and position = 3;
  select id into neg from public.pipeline_stages where tenant_id = p_tenant and position = 4;
  with l as (select * from public.leads where tenant_id = p_tenant and deleted_at is null),
       hot as (select distinct c.lead_id from public.ai_conversations c join l on l.id = c.lead_id where c.tenant_id = p_tenant and not c.is_test and c.qualification in ('hot', 'qualified') and l.stage_id = any(open_stages)),
       ch as (select * from public.charges where tenant_id = p_tenant and deleted_at is null),
       sb as (select s.*, make_date(extract(year from today)::int, extract(month from today)::int, s.due_day) as due_this from public.subscriptions s where tenant_id = p_tenant),
       pj as (select * from public.projects where tenant_id = p_tenant),
       tk as (select * from public.tasks where tenant_id = p_tenant),
       dp as (select * from public.agent_dispatches where tenant_id = p_tenant and created_at >= p_from and created_at < p_to)
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
      'delinquent_confirmed', (select count(distinct coalesce(client_id, lead_id)) from ch where status = 'pending' and delinquent_confirmed_at is not null),
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
      'dispatches', (select count(*) from dp),
      'dispatches_done', (select count(*) from dp where status = 'completed'),
      'dispatches_open', (select count(*) from dp where status in ('pending', 'approved', 'dispatched', 'in_progress', 'awaiting_human')),
      'recovered', (select count(*) from dp where result->>'outcome' in ('replied', 'converted')),
      'failures', (select count(*) from dp where status = 'failed')
                + (select count(*) from public.ai_logs where tenant_id = p_tenant and level = 'error' and created_at >= p_from and created_at < p_to),
      'cost_usd', (select coalesce(sum(cost_usd), 0) from public.ai_usage where tenant_id = p_tenant and created_at >= p_from and created_at < p_to),
      'tokens', (select coalesce(sum(input_tokens + output_tokens + cache_read_tokens), 0) from public.ai_usage where tenant_id = p_tenant and created_at >= p_from and created_at < p_to))
  ) into r;
  return r;
end $$;

-- ---------- inteligência comercial ----------
-- A previsão é uma estimativa e vem marcada assim: valor dos leads abertos × chance fixa por etapa.
create or replace function public.commander_intel(p_tenant uuid, p_from timestamptz default now() - interval '90 days', p_to timestamptz default now()) returns jsonb
language plpgsql stable security definer set search_path to '' as $$
declare r jsonb;
begin
  if auth.uid() is not null and not app.cmd_ok(p_tenant) then raise exception 'Commander não liberado'; end if;
  with l as (select l.*, s.name stage_name, s.kind stage_kind, s.position pos from public.leads l join public.pipeline_stages s on s.id = l.stage_id
              where l.tenant_id = p_tenant and l.deleted_at is null and l.created_at >= p_from and l.created_at < p_to),
       op as (select l.*, s.position pos from public.leads l join public.pipeline_stages s on s.id = l.stage_id where l.tenant_id = p_tenant and l.deleted_at is null and s.kind = 'open'),
       cv as (select * from public.ai_conversations where tenant_id = p_tenant and not is_test)
  select jsonb_build_object(
    'period', jsonb_build_object('from', p_from, 'to', p_to),
    'leads', (select count(*) from l),
    'won', (select count(*) from l where paid_at is not null),
    'conversion_rate', (select case when count(*) = 0 then 0 else round(count(*) filter (where paid_at is not null)::numeric / count(*), 4) end from l),
    'avg_days_to_convert', (select round(avg(extract(epoch from paid_at - created_at) / 86400)::numeric, 1) from l where paid_at is not null),
    'by_source', (select coalesce(jsonb_agg(x order by x.n desc), '[]') from (select source::text k, count(*) n, count(*) filter (where paid_at is not null) won, coalesce(sum(value_cents) filter (where paid_at is not null), 0) won_cents from l group by 1) x),
    'by_niche', (select coalesce(jsonb_agg(x order by x.n desc), '[]') from (select coalesce(nullif(utm->>'segmento', ''), 'sem nicho') k, count(*) n, count(*) filter (where paid_at is not null) won from l group by 1 order by 2 desc limit 15) x),
    'by_owner', (select coalesce(jsonb_agg(x order by x.n desc), '[]') from (select coalesce(u.email, 'sem responsável') k, count(*) n, count(*) filter (where l.paid_at is not null) won from l left join auth.users u on u.id = l.owner_id group by 1) x),
    'by_stage', (select coalesce(jsonb_agg(x order by x.pos), '[]') from (select pos, stage_name k, count(*) n from l group by 1, 2) x),
    'stalled_by_stage', (select coalesce(jsonb_agg(x order by x.pos), '[]') from (select pos, count(*) n from op where updated_at < now() - interval '14 days' group by 1) x),
    'lost_reasons', (select coalesce(jsonb_agg(x order by x.n desc), '[]') from (select coalesce(nullif(lost_reason, ''), 'sem motivo') k, count(*) n from l where stage_kind = 'lost' group by 1 order by 2 desc limit 10) x),
    'top_products', (select coalesce(jsonb_agg(x order by x.n desc), '[]') from (select coalesce(nullif(interest, ''), 'não informado') k, count(*) n, coalesce(sum(value_cents), 0) cents from l where paid_at is not null group by 1 order by 2 desc limit 10) x),
    'sales_by_month', (select coalesce(jsonb_agg(x order by x.m), '[]') from (select to_char(date_trunc('month', paid_at at time zone 'America/Sao_Paulo'), 'YYYY-MM') m, count(*) n, coalesce(sum(amount_cents), 0) cents
                        from public.charges where tenant_id = p_tenant and deleted_at is null and status = 'paid' and paid_at > now() - interval '6 months' group by 1) x),
    'ai_qualification_rate', (select case when count(*) = 0 then null else round(count(*) filter (where qualification in ('hot', 'qualified'))::numeric / count(*), 4) end from cv where created_at >= p_from and created_at < p_to),
    'objections', (select coalesce(jsonb_agg(x order by x.n desc), '[]') from (select o k, count(*) n from public.ai_memory m join cv on cv.id = m.conversation_id
                    cross join lateral jsonb_array_elements_text(case when jsonb_typeof(m.objections) = 'array' then m.objections else '[]'::jsonb end) o group by 1 order by 2 desc limit 10) x),
    'top_potential', (select coalesce(jsonb_agg(x), '[]') from (select op.id, op.name, op.value_cents, op.pos stage, c.score, c.qualification from op left join cv c on c.lead_id = op.id
                       order by coalesce(c.score, 0) desc, op.value_cents desc nulls last limit 10) x),
    'needs_human', (select count(*) from cv where status = 'human_requested'),
    'forecast', jsonb_build_object('label', 'estimativa', 'method', 'valor dos leads abertos × chance por etapa: Novo 5%, Contato feito 15%, Proposta 35%, Negociação 60%',
                 'cents', (select coalesce(round(sum(coalesce(value_cents, 0) * case pos when 1 then 0.05 when 2 then 0.15 when 3 then 0.35 when 4 then 0.6 else 0 end)), 0) from op),
                 'open_with_value', (select count(*) from op where value_cents > 0), 'open_without_value', (select count(*) from op where coalesce(value_cents, 0) = 0))
  ) into r;
  return r;
end $$;
revoke execute on function public.commander_intel(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.commander_intel(uuid, timestamptz, timestamptz) to authenticated, service_role;

-- ---------- dados do relatório ----------
-- Tudo o que o relatório mostra sai daqui. O texto da IA (resumo, oportunidades, recomendações) só interpreta estes números.
create or replace function public.commander_report_data(p_tenant uuid, p_from timestamptz, p_to timestamptz) returns jsonb
language plpgsql stable security definer set search_path to '' as $$
declare span interval := p_to - p_from; today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if auth.uid() is not null and not app.cmd_ok(p_tenant) then raise exception 'Commander não liberado'; end if;
  return jsonb_build_object(
    'period', jsonb_build_object('from', p_from, 'to', p_to),
    'current', public.commander_snapshot(p_tenant, p_from, p_to),
    'previous', public.commander_snapshot(p_tenant, p_from - span, p_from),
    'intel', public.commander_intel(p_tenant, p_from, p_to),
    'charges_pending', (select coalesce(jsonb_agg(x order by x.due_date), '[]') from (select c.id, c.description, c.amount_cents, c.due_date, c.due_date < today late, c.delinquent_confirmed_at is not null delinquent,
                         coalesce(cl.name, ld.name) who from public.charges c left join public.clients cl on cl.id = c.client_id left join public.leads ld on ld.id = c.lead_id
                         where c.tenant_id = p_tenant and c.deleted_at is null and c.status = 'pending' order by c.due_date limit 40) x),
    'subscriptions', (select coalesce(jsonb_agg(x order by x.due_this), '[]') from (select s.id, s.name, s.amount_cents, s.due_day, s.status, s.last_paid_on, cl.name who,
                       make_date(extract(year from today)::int, extract(month from today)::int, s.due_day) due_this,
                       s.status = 'active' and (s.last_paid_on is null or s.last_paid_on < date_trunc('month', today)) open_this_month
                       from public.subscriptions s left join public.clients cl on cl.id = s.client_id where s.tenant_id = p_tenant) x),
    'projects_open', (select coalesce(jsonb_agg(x order by x.due_date nulls last), '[]') from (select p.id, p.title, p.stage, p.kind, p.due_date, p.due_date < today late, p.started_at, cl.name who
                       from public.projects p left join public.clients cl on cl.id = p.client_id where p.tenant_id = p_tenant and p.stage <> 'entregue') x),
    'projects_delivered', (select coalesce(jsonb_agg(x order by x.delivered_at), '[]') from (select p.id, p.title, p.kind, p.delivered_at, cl.name who,
                            exists (select 1 from public.files f where f.project_id = p.id) evidence
                            from public.projects p left join public.clients cl on cl.id = p.client_id where p.tenant_id = p_tenant and p.stage = 'entregue' and p.delivered_at >= p_from and p.delivered_at < p_to) x),
    'tasks_pending', (select coalesce(jsonb_agg(x order by x.due_at nulls last), '[]') from (select t.id, t.title, t.priority, t.status, t.due_at, t.due_at < now() late, t.origin, u.email assignee
                       from public.tasks t left join auth.users u on u.id = t.assignee_id where t.tenant_id = p_tenant and t.status in ('pending', 'in_progress', 'awaiting_approval') order by t.due_at nulls last limit 40) x),
    'alerts_open', (select coalesce(jsonb_agg(x order by array_position(array['critical', 'high', 'medium', 'low'], x.priority), x.first_seen), '[]') from (select a.id, a.category, a.priority, a.title, a.recommendation, a.first_seen
                     from public.commander_alerts a where a.tenant_id = p_tenant and a.status = 'open' order by array_position(array['critical', 'high', 'medium', 'low'], a.priority), a.first_seen limit 30) x),
    'alerts_period', (select jsonb_build_object('opened', count(*) filter (where first_seen >= p_from and first_seen < p_to), 'resolved', count(*) filter (where status = 'resolved' and resolved_at >= p_from and resolved_at < p_to),
                       'dismissed', count(*) filter (where status = 'dismissed' and resolved_at >= p_from and resolved_at < p_to)) from public.commander_alerts where tenant_id = p_tenant),
    'agents', (select coalesce(jsonb_agg(x), '[]') from (select agent, action, result, count(*) n from public.agent_activity where tenant_id = p_tenant and created_at >= p_from and created_at < p_to group by 1, 2, 3 order by 4 desc limit 40) x),
    'dispatches', (select coalesce(jsonb_agg(x order by x.created_at), '[]') from (select d.id, d.task_type, d.status, d.result->>'outcome' outcome, d.created_at, l.name lead from public.agent_dispatches d left join public.leads l on l.id = d.lead_id
                    where d.tenant_id = p_tenant and d.created_at >= p_from and d.created_at < p_to) x),
    'approvals', (select jsonb_build_object('pending', count(*) filter (where status = 'pending'), 'approved', count(*) filter (where status in ('approved', 'executed') and decided_at >= p_from and decided_at < p_to),
                   'rejected', count(*) filter (where status = 'rejected' and decided_at >= p_from and decided_at < p_to)) from public.commander_approvals where tenant_id = p_tenant)
  );
end $$;
revoke execute on function public.commander_report_data(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.commander_report_data(uuid, timestamptz, timestamptz) to authenticated, service_role;
