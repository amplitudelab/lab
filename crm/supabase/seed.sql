-- Amplitude CRM · dados de exemplo (opcional)
--
-- Cria o tenant "barbearianorte" com leads, clientes, propostas, agenda e financeiro,
-- parecidos com os do protótipo. Antes de rodar:
--   1. Entre uma vez no app com o seu e-mail (link mágico), para existir em auth.users.
--   2. Troque voce@exemplo.com.br abaixo pelo seu e-mail.
-- Rodar no SQL Editor do Supabase depois do schema.sql.

do $$
declare
  me     text := 'voce@exemplo.com.br';
  t      uuid;
  st     uuid[];
  l      uuid[] := '{}';
  c      uuid[] := '{}';
  x      uuid;
  i      int;
  people text[] := array['Rafael Lima','Diego Martins','Caio Souza','Lucas Prado','Bruno Teles','Igor Nunes','Thiago Reis','Mateus Alves'];
  int_   text[] := array['Plano mensal de corte','Corte + barba','Dia do noivo','Pacote para equipe'];
  vals   bigint[] := array[16000, 8000, 45000, 60000];
  srcs   lead_source[] := array['instagram','whatsapp','form','indicacao','site','presencial','form','whatsapp'];
  stage  int[] := array[1,1,2,2,3,4,5,6];
begin
  insert into tenants (slug, name, niche, plan, whatsapp)
  values ('barbearianorte', 'Barbearia Norte', 'Barbearia', 'Pro', '5511952182016')
  returning id into t;   -- o trigger já criou as 6 etapas e o formulário

  update forms set title = 'Agende seu horário', interests = int_ where tenant_id = t;
  select array_agg(id order by position) into st from pipeline_stages where tenant_id = t;

  -- você entra como dono
  insert into memberships (tenant_id, user_id, role, name, email)
  select t, u.id, 'owner', 'Você', u.email from auth.users u where lower(u.email) = lower(me);
  if not found then raise notice 'Usuário % não existe em auth.users: entre no app uma vez e rode de novo a parte de memberships.', me; end if;

  for i in 1..4 loop
    insert into clients (tenant_id, name, email, phone, since)
      values (t, (array['Rafael Lima','Escritório Ponto Norte','Academia Forja','Diego Martins'])[i],
              'cliente' || i || '@exemplo.com.br', '(11) 97100-41' || lpad(i::text, 2, '0'), current_date - 60 - i * 25)
    returning id into x;
    c := c || x;
  end loop;
  insert into contacts (tenant_id, client_id, name, role) values (t, c[1], 'Rafael', 'Decisor'), (t, c[2], 'Responsável financeiro', 'Financeiro');

  for i in 1..array_length(people, 1) loop
    insert into leads (tenant_id, name, phone, email, interest, source, stage_id, value_cents,
        follow_up_at, consent_at, consent_text, client_id, lost_reason, created_at)
      values (t, people[i], format('(11) 9%s-%s', 5000 + i * 173, 2000 + i * 311),
        lower(replace(people[i], ' ', '.')) || '@exemplo.com.br', int_[1 + (i - 1) % 4], srcs[i], st[stage[i]],
        vals[1 + (i - 1) % 4], case when stage[i] < 5 then now() + make_interval(days => i - 3) end,
        case when srcs[i] in ('form', 'site') then now() - make_interval(days => i * 3) end,
        case when srcs[i] in ('form', 'site') then 'Autorizo o contato por WhatsApp e e-mail sobre este pedido.' end,
        case when stage[i] = 5 then c[1] end, case when stage[i] = 6 then 'Achou caro neste momento' end,
        now() - make_interval(days => i * 3 + 2))
    returning id into x;
    l := l || x;
  end loop;
  insert into activities (tenant_id, lead_id, kind, body, by_label)
  select t, u, 'note', 'Primeira conversa no WhatsApp, pediu valores.', 'Vendas' from unnest(l) u;

  insert into proposals (tenant_id, lead_id, client_id, title, items, status, valid_until) values
    (t, l[7], c[1], 'Plano mensal · 4 cortes', '[{"d":"Plano mensal · 4 cortes","q":1,"u":16000},{"d":"Barba terapia","q":1,"u":6000}]', 'accepted', current_date + 10),
    (t, l[5], null, 'Pacote noivo + padrinhos', '[{"d":"Pacote noivo + padrinhos","q":1,"u":45000}]', 'sent', current_date + 7),
    (t, l[6], null, 'Barba terapia', '[{"d":"Barba terapia","q":2,"u":6000}]', 'draft', current_date + 14);

  insert into tasks (tenant_id, title, kind, due_at) values
    (t, 'Confirmar horários de sábado', 'task', now() + interval '2 hours'),
    (t, 'Ligar para Escritório Ponto Norte', 'meeting', now() + interval '1 day'),
    (t, 'Postar antes e depois no Instagram', 'task', now() - interval '1 day');

  insert into charges (tenant_id, client_id, description, amount_cents, due_date, status, method, paid_at) values
    (t, c[1], 'Plano mensal · parcela 1', 180000, current_date - 20, 'paid', 'pix', now() - interval '19 days'),
    (t, c[2], 'Barba terapia', 108000, current_date - 3, 'paid', 'pix', now() - interval '3 days'),
    (t, c[3], 'Pacote noivo', 144000, current_date - 4, 'pending', 'boleto', null),
    (t, c[1], 'Plano mensal · parcela 2', 180000, current_date + 6, 'pending', 'pix', null);

  for i in 0..5 loop
    insert into cash_entries (tenant_id, direction, category, amount_cents, entry_date) values
      (t, 'in',  'Atendimentos do dia', 150000 + i * 9000, (date_trunc('month', now()) - make_interval(months => i))::date + 4),
      (t, 'in',  'Venda de produtos',    40000 + i * 3000, (date_trunc('month', now()) - make_interval(months => i))::date + 12),
      (t, 'out', 'Aluguel',              90000,            (date_trunc('month', now()) - make_interval(months => i))::date + 5),
      (t, 'out', 'Produtos',             35000 + i * 2000, (date_trunc('month', now()) - make_interval(months => i))::date + 15);
  end loop;
end $$;
