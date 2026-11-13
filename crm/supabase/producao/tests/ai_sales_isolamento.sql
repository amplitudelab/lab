-- Teste de isolamento do AI Sales. Roda tudo dentro de um bloco que termina em erro de propósito,
-- então nada fica gravado. Resultado esperado na mensagem de erro:
-- cliente_status_propria/amplitude enabled:false, cliente_ve_conversas:0, cliente_ve_base:0, cliente_grava_base:f,
-- vendedor_ve_conversa:1, vendedor_ve_config:0, vendedor_grava_base:f, followup_apos_resposta:canceled
do $$
declare t uuid; other uuid := gen_random_uuid(); u_out uuid := gen_random_uuid(); u_sales uuid := gen_random_uuid(); c uuid; r jsonb; r2 jsonb; n_out int; n_own int; n_kb_out int; fu_canc text; kb_ok boolean := false; kb_out_ok boolean := true; set_vis int;
begin
  select id into t from public.tenants where slug = 'amplitudelab';
  insert into auth.users (id, email, aud, role, instance_id) values (u_out, 'dono-cliente@teste.local', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'), (u_sales, 'vendas@teste.local', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000');
  insert into public.tenants (id, slug, name, plan) values (other, 'cliente-teste-ai', 'Cliente Teste', 'white_label');
  insert into public.memberships (tenant_id, user_id, role) values (other, u_out, 'owner'), (t, u_sales, 'sales');
  insert into public.ai_conversations (tenant_id, wa_id, is_test) values (t, 'teste-isolamento', true) returning id into c;
  insert into public.ai_followups (tenant_id, conversation_id, due_at, is_test) values (t, c, now() + interval '1 day', true);
  insert into public.ai_messages (tenant_id, conversation_id, direction, author, body, is_test) values (t, c, 'in', 'customer', 'oi', true);
  select status into fu_canc from public.ai_followups where conversation_id = c;

  perform set_config('request.jwt.claims', json_build_object('sub', u_out, 'role', 'authenticated')::text, true);
  set local role authenticated;
  r := public.ai_sales_status(other);
  r2 := public.ai_sales_status(t);
  select count(*) into n_out from public.ai_conversations;
  select count(*) into n_kb_out from public.ai_knowledge;
  begin insert into public.ai_knowledge (tenant_id, title, body) values (other, 'x', 'y'); exception when others then kb_out_ok := false; end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', u_sales, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n_own from public.ai_conversations where id = c;
  select count(*) into set_vis from public.ai_settings;
  begin insert into public.ai_knowledge (tenant_id, title, body) values (t, 'x', 'y'); kb_ok := true; exception when others then kb_ok := false; end;
  reset role;

  raise exception 'RESULTADO cliente_status_propria:% cliente_status_amplitude:% cliente_ve_conversas:% cliente_ve_base:% cliente_grava_base:% | vendedor_ve_conversa:% vendedor_ve_config:% vendedor_grava_base:% | followup_apos_resposta:%',
    r, r2, n_out, n_kb_out, kb_out_ok, n_own, set_vis, kb_ok, fu_canc;
end $$;
