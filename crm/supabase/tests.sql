-- Amplitude CRM · teste de isolamento e permissões (RLS)
--
-- Roda dentro de uma transação e desfaz tudo no fim (rollback): pode rodar no
-- SQL Editor do Supabase quantas vezes quiser, depois do schema.sql e do seed.sql.
-- Cria 4 pessoas de teste (vendas, financeiro, leitura e alguém de outro tenant),
-- entra como cada uma e confere o que cada perfil vê e consegue fazer.
-- Saída esperada: uma linha "ok" por verificação e, no fim, "TODOS OS TESTES PASSARAM".

begin;

create temp table _ids (k text primary key, v uuid);
grant all on _ids to authenticated, anon;

do $$
declare t uuid; o uuid;
begin
  select id into t from tenants where slug = 'barbearianorte';
  if t is null then raise exception 'rode o seed.sql antes'; end if;
  insert into auth.users (email) values ('t.vendas@teste.dev'), ('t.fin@teste.dev'), ('t.leitura@teste.dev'), ('t.outro@teste.dev')
  on conflict (email) do nothing;
  insert into tenants (slug, name) values ('outro-teste', 'Outro Tenant') returning id into o;
  insert into memberships (tenant_id, user_id, role, name)
  select t, id, r::crm_role, n from (values ('t.vendas@teste.dev', 'sales', 'Vendas'), ('t.fin@teste.dev', 'finance', 'Financeiro'),
    ('t.leitura@teste.dev', 'viewer', 'Leitura')) v(e, r, n) join auth.users u on u.email = v.e;
  insert into memberships (tenant_id, user_id, role, name) select o, id, 'owner', 'Outro' from auth.users where email = 't.outro@teste.dev';
  insert into _ids select 'tenant', t;
  insert into _ids select 'owner', user_id from memberships where tenant_id = t and role = 'owner' limit 1;
  insert into _ids select replace(email, '@teste.dev', ''), id from auth.users where email like 't.%@teste.dev';
end $$;

create or replace function pg_temp.as_user(k text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', (select v::text from _ids where _ids.k = as_user.k), true);
  perform set_config('role', 'authenticated', true);
end $$;
create or replace function pg_temp.check(ok boolean, msg text) returns void language plpgsql as $$
begin
  if not ok then raise exception 'FALHOU: %', msg; end if;
  raise notice 'ok  %', msg;
end $$;

-- dono: vê tudo, inclusive financeiro e registro
select pg_temp.as_user('owner');
select pg_temp.check((select count(*) from leads) = 8, 'dono vê os 8 leads');
select pg_temp.check((select count(*) from charges) = 4, 'dono vê as cobranças');
select pg_temp.check((select count(*) from audit_log) > 0, 'dono lê o registro de alterações');

-- vendas: CRM sim, financeiro não
select pg_temp.as_user('t.vendas');
select pg_temp.check((select count(*) from leads) = 8, 'vendas vê os leads');
select pg_temp.check((select count(*) from charges) = 0, 'vendas NÃO vê cobranças');
select pg_temp.check((select count(*) from audit_log) = 0, 'vendas NÃO lê o registro');
insert into leads (tenant_id, name, phone, stage_id)
select tenant_id, 'Lead criado por vendas', '(11) 90000-0000', id from pipeline_stages where position = 1 and tenant_id = (select v from _ids where k = 'tenant');
select pg_temp.check((select count(*) from leads) = 9, 'vendas cria lead');
delete from leads where name = 'Lead criado por vendas';
select pg_temp.check((select count(*) from leads) = 9, 'vendas NÃO exclui lead (só o dono)');

-- financeiro: lê CRM e financeiro, não edita lead
select pg_temp.as_user('t.fin');
select pg_temp.check((select count(*) from charges) = 4, 'financeiro vê cobranças');
update leads set value_cents = 1 where true;
select pg_temp.check((select count(*) from leads where value_cents = 1) = 0, 'financeiro NÃO edita leads');
update charges set status = 'paid' where description = 'Pacote noivo';
select pg_temp.check((select count(*) from cash_entries where description = 'Pacote noivo') = 1, 'cobrança paga vira entrada no caixa');

-- leitura: só pela view, com telefone mascarado
select pg_temp.as_user('t.leitura');
select pg_temp.check((select count(*) from leads) = 0, 'leitura NÃO lê a tabela leads direto');
select pg_temp.check((select count(*) from leads_masked) = 9, 'leitura vê os leads pela view');
select pg_temp.check((select bool_and(phone !~ '\d{4}-\d{2}') from leads_masked), 'leitura vê telefone mascarado');
select pg_temp.check((select count(*) from charges) = 0, 'leitura NÃO vê financeiro');

-- outro tenant: não enxerga nada da Barbearia Norte
select pg_temp.as_user('t.outro');
select pg_temp.check((select count(*) from leads) = 0 and (select count(*) from leads_masked) = 0, 'outro tenant NÃO vê leads');
select pg_temp.check((select count(*) from clients) = 0, 'outro tenant NÃO vê clientes');
select pg_temp.check((select count(*) from tenants) = 1, 'outro tenant só vê o próprio tenant');
update leads set name = 'invadido' where true;
reset role;
select pg_temp.check((select count(*) from leads where name = 'invadido') = 0, 'outro tenant NÃO altera leads');

-- tenant_id travado
select pg_temp.as_user('owner');
do $$ begin
  update leads set tenant_id = (select id from tenants where slug = 'outro-teste') where true;
  raise exception 'FALHOU: tenant_id mudou';
exception when others then
  if sqlerrm like 'FALHOU%' then raise; end if;
  raise notice 'ok  tenant_id não pode ser alterado';
end $$;

-- proposta pública: visitante sem login vê e aceita pelo token, lead vai para Fechado
reset role;
create temp table _tok as select token, lead_id from proposals where status = 'sent' limit 1;
grant select on _tok to anon;
set local role anon;
select pg_temp.check((select proposal_public(token) ->> 'status' from _tok) = 'viewed', 'proposta abre pelo link e fica como vista');
select pg_temp.check((select proposal_accept(token) from _tok), 'cliente aceita pelo link');
reset role;
select pg_temp.check((select s.kind = 'won' from leads l join pipeline_stages s on s.id = l.stage_id where l.id = (select lead_id from _tok)), 'lead da proposta aceita foi para Fechado');

-- captação: anon não chama direto (só a Edge Function com service_role)
set local role anon;
do $$ begin
  perform capture_lead('barbearianorte', 'Spam', '11999999999', null, null, null, 'x');
  raise exception 'FALHOU: anon chamou capture_lead';
exception when insufficient_privilege then raise notice 'ok  anon NÃO chama capture_lead';
end $$;
select pg_temp.check((select tenant_public('barbearianorte') ->> 'name') = 'Barbearia Norte', 'página pública lê marca e formulário');
set local role service_role;
select pg_temp.check(capture_lead('barbearianorte', 'Cliente do site', '(11) 98888-7777', 'c@x.com', 'Corte + barba', null,
  'Autorizo o contato', 'site', 8000, now() + interval '1 day') is not null, 'Edge Function capta lead com consentimento');
reset role;
select pg_temp.check((select count(*) from tasks where title like 'Atendimento: Cliente do site%') = 1, 'agendamento pela página cria compromisso');

-- LGPD
select pg_temp.as_user('t.vendas');
do $$ begin
  perform anonymize_lead((select id from leads where name = 'Cliente do site'));
  raise exception 'FALHOU: vendas anonimizou';
exception when others then
  if sqlerrm like 'FALHOU%' then raise; end if;
  raise notice 'ok  vendas NÃO anonimiza';
end $$;
select pg_temp.as_user('owner');
select anonymize_lead((select id from leads where name = 'Cliente do site'));
reset role;
select pg_temp.check((select phone is null and email is null from leads where name = 'Titular anonimizado'), 'dono anonimiza (LGPD)');

do $$ begin raise notice 'TODOS OS TESTES PASSARAM'; end $$;
rollback;
