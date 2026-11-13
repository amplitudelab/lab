-- Teste de isolamento e regras do AI Commander. Roda dentro de um bloco que termina em erro de propósito,
-- então nada fica gravado. Resultado esperado na mensagem de erro:
-- outra_empresa: status false, vê 0 alertas, snapshot bloqueado, auditoria bloqueada
-- vendedor_da_amplitude: status false, vê 0 alertas e 0 aprovações, snapshot bloqueado
-- dono: status true, vê os alertas
-- tarefa: done_at marca concluída e reabrir volta para pendente, com histórico; tarefa repetida bloqueada; alerta aberto repetido bloqueado
do $$
declare t uuid; other uuid := gen_random_uuid(); u_out uuid := gen_random_uuid(); u_sales uuid := gen_random_uuid(); u_own uuid;
  r_out jsonb; r_sales jsonb; r_own jsonb; n_out int; n_sales int; n_sales_ap int; n_own int; snap_out text := 'liberado'; snap_sales text := 'liberado'; audit_out text := 'liberada';
  tk uuid; st1 text; st2 text; hist int; dup_task text := 'aceitou'; dup_alert text := 'aceitou';
begin
  select id into t from public.tenants where slug = 'amplitudelab';
  select user_id into u_own from public.memberships where tenant_id = t and role = 'owner' limit 1;
  insert into auth.users (id, email, aud, role, instance_id) values (u_out, 'dono-cliente@teste.local', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'), (u_sales, 'vendas@teste.local', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000');
  insert into public.tenants (id, slug, name, plan) values (other, 'cliente-teste-cmd', 'Cliente Teste', 'white_label');
  insert into public.memberships (tenant_id, user_id, role) values (other, u_out, 'owner'), (t, u_sales, 'sales');
  insert into public.commander_alerts (tenant_id, category, title, priority, dedupe_key) values (t, 'operations', 'teste isolamento', 'low', 'teste_isolamento');
  begin insert into public.commander_alerts (tenant_id, category, title, priority, dedupe_key) values (t, 'operations', 'teste isolamento 2', 'low', 'teste_isolamento'); exception when unique_violation then dup_alert := 'bloqueou'; end;
  insert into public.commander_approvals (tenant_id, action, reason) values (t, 'cancel_charge', 'teste');

  -- tarefa: agenda (done_at) e Commander (status) ficam de acordo
  insert into public.tasks (tenant_id, title, kind, origin, dedupe_key) values (t, 'teste tarefa', 'task', 'commander', 'teste_tarefa') returning id into tk;
  begin insert into public.tasks (tenant_id, title, kind, origin, dedupe_key) values (t, 'teste tarefa 2', 'task', 'commander', 'teste_tarefa'); exception when unique_violation then dup_task := 'bloqueou'; end;
  update public.tasks set done_at = now() where id = tk; select status into st1 from public.tasks where id = tk;
  update public.tasks set done_at = null where id = tk; select status, jsonb_array_length(history) into st2, hist from public.tasks where id = tk;

  -- dono de outra empresa
  perform set_config('request.jwt.claims', json_build_object('sub', u_out, 'role', 'authenticated')::text, true);
  set local role authenticated;
  r_out := public.commander_status(t);
  select count(*) into n_out from public.commander_alerts;
  begin perform public.commander_snapshot(t); exception when others then snap_out := 'bloqueado'; end;
  begin perform public.commander_run_audit(t, 'user'); exception when others then audit_out := 'bloqueada'; end;
  reset role;

  -- vendedor da própria Amplitude
  perform set_config('request.jwt.claims', json_build_object('sub', u_sales, 'role', 'authenticated')::text, true);
  set local role authenticated;
  r_sales := public.commander_status(t);
  select count(*) into n_sales from public.commander_alerts;
  select count(*) into n_sales_ap from public.commander_approvals;
  begin perform public.commander_snapshot(t); exception when others then snap_sales := 'bloqueado'; end;
  reset role;

  -- dono da Amplitude
  perform set_config('request.jwt.claims', json_build_object('sub', u_own, 'role', 'authenticated')::text, true);
  set local role authenticated;
  r_own := public.commander_status(t);
  select count(*) into n_own from public.commander_alerts where dedupe_key = 'teste_isolamento';
  reset role;

  raise exception 'RESULTADO outra_empresa status:% alertas:% snapshot:% auditoria:% | vendedor status:% alertas:% aprovacoes:% snapshot:% | dono status:% alertas:% | tarefa concluida:% reaberta:% historico:% repetida:% | alerta repetido:%',
    r_out->>'enabled', n_out, snap_out, audit_out, r_sales->>'enabled', n_sales, n_sales_ap, snap_sales, r_own->>'enabled', n_own, st1, st2, hist, dup_task, dup_alert;
end $$;
