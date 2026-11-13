-- AI Commander, ajustes após a primeira execução real:
-- 1. commander_run_audit falhava com "column reference x is ambiguous" (variável e apelido com o mesmo nome).
-- 2. Follow-up vencido vira um alerta por lead só quando o lead está sendo trabalhado (tem responsável, valor ou passou de Novo).
--    Os demais (por exemplo, leads importados pelo Radar) entram num alerta único, para não virar centenas de avisos.

create or replace function public.commander_scan(p_tenant uuid) returns jsonb
language plpgsql stable security definer set search_path to '' as $$
declare m jsonb; stale int; hoth int; propd int; warn int; apprd int; today date := (now() at time zone 'America/Sao_Paulo')::date; open_stages uuid[]; won uuid; out jsonb := '[]';
begin
  select monitoring into m from public.commander_settings where tenant_id = p_tenant;
  stale := coalesce((m->>'stale_days')::int, 7); hoth := coalesce((m->>'hot_hours')::int, 24); propd := coalesce((m->>'proposal_days')::int, 5);
  warn := coalesce((m->>'project_warning_days')::int, 3); apprd := coalesce((m->>'approval_days')::int, 5);
  select array_agg(id) into open_stages from public.pipeline_stages where tenant_id = p_tenant and kind = 'open';
  select id into won from public.pipeline_stages where tenant_id = p_tenant and kind = 'won' order by position limit 1;

  with l as (select l.*, s.position pos,
                    (l.owner_id is not null or coalesce(l.value_cents, 0) > 0 or s.position >= 2) worked,
                    greatest(l.updated_at, coalesce((select max(a.created_at) from public.activities a where a.lead_id = l.id), l.created_at),
                             coalesce((select max(x.created_at) from public.ai_messages x join public.ai_conversations c on c.id = x.conversation_id where c.lead_id = l.id), l.created_at)) as last_touch
             from public.leads l join public.pipeline_stages s on s.id = l.stage_id
            where l.tenant_id = p_tenant and l.deleted_at is null and l.stage_id = any(open_stages)),
  f as (
    -- comercial: lead quente sem contato
    select 'sales' cat, 'critical' pri, 'lead_hot_' || l.id key, 'Lead quente sem contato: ' || l.name title,
           'Sem contato há ' || floor(extract(epoch from now() - l.last_touch) / 3600)::int || ' horas. Qualificação da IA: ' || c.qualification || ' (' || coalesce(c.score, 0) || '/100).' descr,
           'Pedir ao AI Sales uma recuperação ou ligar hoje.' rec, 'lead' rk, l.id rid, l.owner_id who, now() + interval '4 hours' due
      from l join public.ai_conversations c on c.lead_id = l.id and not c.is_test and c.qualification in ('hot', 'qualified')
     where l.last_touch < now() - make_interval(hours => hoth)
    union all
    -- follow-up vencido: um alerta por lead em trabalho
    select 'sales', 'high', 'lead_followup_late_' || l.id, 'Follow-up vencido: ' || l.name, 'O follow-up era para ' || to_char(l.next_follow_up at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') || '.',
           'Fazer o contato ou remarcar o follow-up.', 'lead', l.id, l.owner_id, now() + interval '1 day'
      from l where l.worked and l.next_follow_up < now() - interval '1 day'
    union all
    -- follow-up vencido em leads ainda não trabalhados: um alerta só
    select 'sales', 'medium', 'leads_followup_late', (select count(*) from l where not worked and next_follow_up < now() - interval '1 day') || ' leads novos com follow-up vencido',
           'Leads em Novo, sem responsável e sem valor, com o primeiro contato atrasado.', 'Distribuir entre o time ou pedir ao AI Sales o primeiro contato.', null, null, null, null
     where (select count(*) from l where not worked and next_follow_up < now() - interval '1 day') > 0
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
    select 'finance', 'high', 'won_no_payment_' || ld.id, 'Venda sem pagamento registrado: ' || ld.name, 'O lead está em Fechado, mas não há pagamento confirmado.', 'Conferir se a venda foi paga e registrar no financeiro.', 'lead', ld.id, ld.owner_id, now() + interval '2 days'
      from public.leads ld where ld.tenant_id = p_tenant and ld.deleted_at is null and ld.stage_id = won and ld.paid_at is null
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
      from public.projects p where p.tenant_id = p_tenant and p.stage = 'entregue' and p.delivered_at > now() - interval '60 days' and not exists (select 1 from public.files fl where fl.project_id = p.id)
    union all
    select 'delivery', 'medium', 'sale_no_project_' || ld.id, 'Venda sem projeto de entrega: ' || ld.name, 'Pagamento confirmado em ' || to_char(ld.paid_at at time zone 'America/Sao_Paulo', 'DD/MM') || ', sem projeto criado.', 'Abrir o projeto de entrega.', 'lead', ld.id, ld.owner_id, now() + interval '1 day'
      from public.leads ld where ld.tenant_id = p_tenant and ld.deleted_at is null and ld.paid_at > now() - interval '90 days' and not exists (select 1 from public.projects p where p.lead_id = ld.id)
    union all
    -- processos
    select 'operations', 'medium', 'task_late_' || t.id, 'Tarefa vencida: ' || t.title, 'Prazo era ' || to_char(t.due_at at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') || '.', 'Concluir ou remarcar a tarefa.', 'task', t.id, t.assignee_id, null
      from public.tasks t where t.tenant_id = p_tenant and t.status in ('pending', 'in_progress') and t.due_at < now() - interval '1 day'
    union all
    select 'operations', 'low', 'tasks_unassigned', (select count(*) from public.tasks t where t.tenant_id = p_tenant and t.status in ('pending', 'in_progress') and t.assignee_id is null and t.origin <> 'user') || ' tarefas do Commander sem responsável', 'Tarefas criadas pelos agentes sem pessoa definida.', 'Atribuir as tarefas.', null, null, null, null
     where (select count(*) from public.tasks t where t.tenant_id = p_tenant and t.status in ('pending', 'in_progress') and t.assignee_id is null and t.origin <> 'user') > 0
    union all
    select 'operations', 'low', 'dup_phone_' || d.phone, 'Leads duplicados: telefone ' || d.phone, d.n || ' leads com o mesmo telefone.', 'Juntar os registros e apagar os repetidos.', null, null, null, null
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
    into out from (select distinct on (key) * from f order by key, array_position(array['critical', 'high', 'medium', 'low'], pri)) g
   where cat = any(array(select jsonb_array_elements_text(coalesce(m->'categories', '["sales","finance","delivery","subscription","operations","ai","security"]'))) || array['security']);
  return out;
end $$;
revoke execute on function public.commander_scan(uuid) from public, anon, authenticated;
grant execute on function public.commander_scan(uuid) to service_role;

create or replace function public.commander_run_audit(p_tenant uuid, p_trigger text default 'schedule') returns jsonb
language plpgsql security definer set search_path to '' as $$
declare a uuid; f jsonb; item jsonb; n_new int := 0; important text[] := '{}'; n_res int := 0; keys text[] := '{}'; sev jsonb; notify_on boolean; aid uuid;
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
  for item in select value from jsonb_array_elements(f) loop
    keys := keys || (item->>'key');
    update public.commander_alerts set last_seen = now(), title = item->>'title', description = item->>'description', priority = item->>'priority', audit_id = a
     where tenant_id = p_tenant and dedupe_key = item->>'key' and status = 'open' returning id into aid;
    if aid is null then
      -- alerta dispensado continua dispensado enquanto o problema for o mesmo
      if exists (select 1 from public.commander_alerts where tenant_id = p_tenant and dedupe_key = item->>'key' and status = 'dismissed' and resolved_at > now() - interval '30 days') then continue; end if;
      insert into public.commander_alerts (tenant_id, category, title, description, priority, related_kind, related_id, dedupe_key, assigned_to, recommendation, due_at, audit_id)
      values (p_tenant, item->>'category', item->>'title', item->>'description', item->>'priority', item->>'related_kind', nullif(item->>'related_id', '')::uuid, item->>'key', nullif(item->>'assigned_to', '')::uuid, item->>'recommendation', nullif(item->>'due_at', '')::timestamptz, a);
      n_new := n_new + 1;
      if item->>'priority' in ('critical', 'high') then important := important || (item->>'title'); end if;
    end if;
    aid := null;
  end loop;
  -- um aviso só por auditoria, com os principais títulos
  if notify_on and cardinality(important) > 0 then
    insert into public.notifications (tenant_id, kind, title, body) values (p_tenant, 'system',
      case when cardinality(important) = 1 then 'Commander: ' || important[1] else 'Commander: ' || cardinality(important) || ' alertas importantes' end,
      array_to_string(important[1:3], ' · ') || case when cardinality(important) > 3 then ' e mais ' || (cardinality(important) - 3) else '' end);
  end if;
  with r as (update public.commander_alerts set status = 'resolved', resolved_at = now(), history = history || jsonb_build_object('at', now(), 'to', 'resolved', 'by', 'auditoria')
              where tenant_id = p_tenant and status = 'open' and not (dedupe_key = any(keys)) returning 1) select count(*) into n_res from r;
  select coalesce(jsonb_object_agg(e.p, e.n), '{}') into sev from (select el->>'priority' p, count(*) n from jsonb_array_elements(f) el group by 1) e;
  update public.commander_audits set finished_at = now(), findings = jsonb_array_length(f), severity = sev, new_alerts = n_new, resolved_alerts = n_res, status = 'done',
    summary = jsonb_array_length(f) || ' problemas encontrados, ' || n_new || ' novos e ' || n_res || ' resolvidos desde a última auditoria.' where id = a;
  update public.agent_identities set animation_state = case when coalesce((sev->>'critical')::int, 0) > 0 then 'alert' else 'idle' end, updated_at = now() where tenant_id = p_tenant and agent_id = 'commander';
  insert into public.agent_activity (tenant_id, agent, action, result, ref_kind, ref_id, detail, actor) values (p_tenant, 'commander', 'audit', 'ok', 'audit', a, jsonb_array_length(f) || ' achados, ' || n_new || ' novos', auth.uid());
  return jsonb_build_object('audit_id', a, 'findings', jsonb_array_length(f), 'new', n_new, 'resolved', n_res, 'severity', sev);
end $$;
revoke execute on function public.commander_run_audit(uuid, text) from public, anon;
grant execute on function public.commander_run_audit(uuid, text) to authenticated, service_role;
