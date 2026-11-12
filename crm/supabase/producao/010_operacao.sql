-- Operação da empresa: arquivos, projetos, mensalidades, avisos no celular, cópia semanal e lembretes diários.
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Segredo interno (gerado aqui, nunca sai do banco): o banco usa para chamar as funções de cópia e de avisos.
do $$ begin
  if not exists (select 1 from vault.secrets where name = 'interno') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'interno', 'Chamadas do banco para as funções');
  end if;
end $$;
create or replace function app.secret(p_name text) returns text language sql stable security definer set search_path to '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = p_name limit 1;
$$;
revoke execute on function app.secret(text) from public, anon, authenticated;
grant usage on schema app to service_role;
grant execute on function app.secret(text) to service_role;
-- As funções do servidor guardam aqui o par de chaves dos avisos (a chave privada nunca sai do servidor).
create or replace function public.vault_put(p_name text, p_value text) returns void language plpgsql security definer set search_path to '' as $$
begin
  if exists (select 1 from vault.secrets where name = p_name) then return; end if;
  perform vault.create_secret(p_value, p_name);
end $$;
create or replace function public.vault_get(p_name text) returns text language sql stable security definer set search_path to '' as $$
  select app.secret(p_name);
$$;
revoke execute on function public.vault_put(text, text), public.vault_get(text) from public, anon, authenticated;
grant execute on function public.vault_put(text, text), public.vault_get(text) to service_role;

-- ---------- Arquivos ----------
insert into storage.buckets (id, name, public, file_size_limit) values ('arquivos', 'arquivos', false, 52428800) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('copias', 'copias', false) on conflict (id) do nothing;
create or replace function app.path_tenant(p_name text) returns uuid language sql immutable set search_path to '' as $$
  select case when split_part(p_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then split_part(p_name, '/', 1)::uuid end;
$$;
create policy arquivos_ler on storage.objects for select to authenticated using (bucket_id = 'arquivos' and app.is_member(app.path_tenant(name)));
create policy arquivos_enviar on storage.objects for insert to authenticated with check (bucket_id = 'arquivos' and app.has_role(app.path_tenant(name), '{owner,admin,sales,finance}'));
create policy arquivos_apagar on storage.objects for delete to authenticated using (bucket_id = 'arquivos' and app.has_role(app.path_tenant(name), '{owner,admin}'));

create table public.files (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  path text not null unique,
  name text not null,
  size_bytes bigint not null default 0,
  mime text,
  client_id uuid references public.clients(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  project_id uuid,
  folder text not null default 'Geral',
  uploaded_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index files_tenant on public.files (tenant_id, created_at desc);
alter table public.files enable row level security;
create policy files_ler on public.files for select to authenticated using (app.is_member(tenant_id));
create policy files_criar on public.files for insert to authenticated with check (app.has_role(tenant_id, '{owner,admin,sales,finance}'));
create policy files_editar on public.files for update to authenticated using (app.has_role(tenant_id, '{owner,admin,sales,finance}'));
create policy files_apagar on public.files for delete to authenticated using (app.has_role(tenant_id, '{owner,admin}'));
grant select, insert, update, delete on public.files to authenticated;

-- ---------- Projetos e entregas ----------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  title text not null,
  stage text not null default 'briefing' check (stage in ('briefing', 'criacao', 'aprovacao', 'ajustes', 'entregue')),
  due_date date,
  value_cents bigint not null default 0,
  notes text,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.files add constraint files_project foreign key (project_id) references public.projects(id) on delete set null;
create index projects_tenant on public.projects (tenant_id, stage);
alter table public.projects enable row level security;
create policy projects_ler on public.projects for select to authenticated using (app.is_member(tenant_id));
create policy projects_criar on public.projects for insert to authenticated with check (app.has_role(tenant_id, '{owner,admin,sales}'));
create policy projects_editar on public.projects for update to authenticated using (app.has_role(tenant_id, '{owner,admin,sales}'));
create policy projects_apagar on public.projects for delete to authenticated using (app.has_role(tenant_id, '{owner,admin}'));
grant select, insert, update, delete on public.projects to authenticated;

-- ---------- Mensalidades ----------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  amount_cents bigint not null check (amount_cents >= 100),
  due_day int not null check (due_day between 1 and 28),
  status text not null default 'active' check (status in ('active', 'paused', 'canceled')),
  started_on date not null default current_date,
  last_paid_on date,
  created_at timestamptz not null default now()
);
create index subscriptions_tenant on public.subscriptions (tenant_id, status);
alter table public.subscriptions enable row level security;
create policy subs_ler on public.subscriptions for select to authenticated using (app.is_member(tenant_id));
create policy subs_criar on public.subscriptions for insert to authenticated with check (app.has_role(tenant_id, '{owner,admin,finance}'));
create policy subs_editar on public.subscriptions for update to authenticated using (app.has_role(tenant_id, '{owner,admin,finance}'));
create policy subs_apagar on public.subscriptions for delete to authenticated using (app.has_role(tenant_id, '{owner,admin}'));
grant select, insert, update, delete on public.subscriptions to authenticated;
alter table public.charges add column if not exists subscription_id uuid references public.subscriptions(id) on delete set null;

-- Pagamento de mensalidade: marca o mês como pago e o aviso diz de quem é.
do $$
declare d text;
begin
  select pg_get_functiondef('public.confirm_payment(uuid, bigint, text, text)'::regprocedure) into d;
  if position('subscription_id' in d) = 0 then
    d := replace(d, E'  select name into pl from public.plans where id = c.plan_id;',
      E'  if c.subscription_id is not null then\n    update public.subscriptions set last_paid_on = current_date where id = c.subscription_id;\n  end if;\n  select name into pl from public.plans where id = c.plan_id;');
    if position('subscription_id' in d) = 0 then raise exception 'confirm_payment mudou: revise a migração'; end if;
    execute d;
  end if;
end $$;

-- ---------- Avisos no celular ----------
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  device text,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy push_ler on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
create policy push_criar on public.push_subscriptions for insert to authenticated with check (user_id = auth.uid() and app.is_member(tenant_id));
create policy push_apagar on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());
grant select, insert, delete on public.push_subscriptions to authenticated;

-- Cada notificação nova vira um aviso no celular de quem ativou.
create or replace function app.push_notify() returns trigger language plpgsql security definer set search_path to '' as $$
begin
  if exists (select 1 from public.push_subscriptions where tenant_id = new.tenant_id) then
    perform net.http_post(
      url := 'https://ozregdgphaxkxumsujys.supabase.co/functions/v1/push',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-interno', app.secret('interno')),
      body := jsonb_build_object('notification_id', new.id));
  end if;
  return new;
end $$;
create trigger notifications_push after insert on public.notifications for each row execute function app.push_notify();

-- ---------- Lembretes diários ----------
create or replace function app.daily_reminders() returns void language plpgsql security definer set search_path to '' as $$
declare s record; p record; due date; mes date := date_trunc('month', current_date)::date;
begin
  for s in select * from public.subscriptions where status = 'active' loop
    due := make_date(extract(year from current_date)::int, extract(month from current_date)::int, s.due_day);
    if s.last_paid_on is not null and s.last_paid_on >= mes then continue; end if;
    if current_date = due - 3 then
      insert into public.notifications (tenant_id, kind, title, body) values (s.tenant_id, 'system', 'Mensalidade vence em 3 dias: ' || s.name, 'R$ ' || replace(to_char(s.amount_cents / 100.0, 'FM999999990.00'), '.', ',') || ' no dia ' || s.due_day || '. Gere o link em Mensalidades.');
    elsif current_date = due + 1 then
      insert into public.notifications (tenant_id, kind, title, body) values (s.tenant_id, 'system', 'Mensalidade atrasada: ' || s.name, 'Venceu no dia ' || s.due_day || ' e ainda não foi paga.');
    end if;
  end loop;
  for p in select * from public.projects where stage <> 'entregue' and due_date is not null and due_date in (current_date, current_date + 1, current_date - 1) loop
    insert into public.notifications (tenant_id, kind, title, body) values (p.tenant_id, 'system',
      case when p.due_date < current_date then 'Entrega atrasada: ' when p.due_date = current_date then 'Entrega hoje: ' else 'Entrega amanhã: ' end || p.title, 'Etapa atual: ' || p.stage || '.');
  end loop;
end $$;
revoke execute on function app.daily_reminders() from public, anon, authenticated;

-- Agenda: lembretes às 9h e cópia de segurança aos domingos às 3h (horário de Brasília).
select cron.schedule('lembretes-diarios', '0 12 * * *', 'select app.daily_reminders()');
select cron.schedule('copia-semanal', '0 6 * * 0', $c$
  select net.http_post(url := 'https://ozregdgphaxkxumsujys.supabase.co/functions/v1/backup',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-interno', app.secret('interno')), body := '{"all":true}'::jsonb, timeout_milliseconds := 120000)
$c$);
