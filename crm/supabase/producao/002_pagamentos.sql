-- =====================================================================
-- Amplitude CRM · pagamentos automáticos (InfinitePay) e notificações
-- Lead escolhe plano → link gerado no servidor → gateway avisa →
-- servidor confere no gateway → lead vira "Pagante" + notificação no CRM.
-- =====================================================================

-- Gateway de cada empresa. A InfiniteTag não é segredo (vai no corpo do pedido).
alter table public.tenants add column if not exists payment_gateway text not null default 'infinitepay'
  check (payment_gateway in ('infinitepay', 'asaas', 'mercadopago', 'manual'));
alter table public.tenants add column if not exists payment_handle text;

alter table public.leads add column if not exists paid_at timestamptz;

-- Planos/produtos que cada empresa vende (a Amplitude vende Essencial, Pro, White-label).
create table if not exists public.plans (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  description text,
  price_cents bigint not null check (price_cents >= 100),
  interval    text not null default 'once' check (interval in ('once', 'month', 'year')),
  active      boolean not null default true,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists plans_tenant_idx on public.plans (tenant_id);

-- Planos ativos aparecem na página pública, sem login.
create or replace function public.plans_public(p_slug text)
returns table (id uuid, name text, description text, price_cents bigint, "interval" text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.name, p.description, p.price_cents, p.interval
  from public.plans p join public.tenants t on t.id = p.tenant_id
  where t.slug = p_slug and p.active order by p.position, p.price_cents;
$$;
grant execute on function public.plans_public(text) to anon, authenticated;

alter table public.charges add column if not exists lead_id uuid references public.leads(id) on delete set null;
alter table public.charges add column if not exists plan_id uuid references public.plans(id) on delete set null;
alter table public.charges add column if not exists checkout_url text;
alter table public.charges add column if not exists order_nsu text unique;
create index if not exists charges_lead_idx on public.charges (lead_id);
create index if not exists charges_plan_idx on public.charges (plan_id);

-- Todo aviso do gateway fica registrado, confirmado ou não.
create table if not exists public.payment_events (
  id         bigint generated always as identity primary key,
  tenant_id  uuid references public.tenants(id) on delete cascade,
  charge_id  uuid references public.charges(id) on delete set null,
  gateway    text not null,
  payload    jsonb not null,
  verified   boolean not null default false,
  note       text,
  at         timestamptz not null default now()
);
create index if not exists payment_events_tenant_idx on public.payment_events (tenant_id, at desc);
create index if not exists payment_events_charge_idx on public.payment_events (charge_id);

-- Sino do CRM.
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  lead_id    uuid references public.leads(id) on delete cascade,
  kind       text not null check (kind in ('paid', 'lead', 'proposal', 'task', 'system')),
  title      text not null,
  body       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_tenant_idx on public.notifications (tenant_id, created_at desc);
create index if not exists notifications_lead_idx on public.notifications (lead_id);

alter table public.plans          enable row level security;
alter table public.payment_events enable row level security;
alter table public.notifications  enable row level security;

create policy plans_read on public.plans for select to authenticated using (app.is_member(tenant_id));
create policy plans_insert on public.plans for insert to authenticated with check (app.has_role(tenant_id, '{owner,admin}'));
create policy plans_update on public.plans for update to authenticated using (app.has_role(tenant_id, '{owner,admin}')) with check (app.has_role(tenant_id, '{owner,admin}'));
create policy plans_delete on public.plans for delete to authenticated using (app.has_role(tenant_id, '{owner,admin}'));

create policy payment_events_read on public.payment_events for select to authenticated
  using (app.has_role(tenant_id, '{owner,admin,finance}'));

create policy notifications_read on public.notifications for select to authenticated using (app.is_member(tenant_id));
create policy notifications_mark on public.notifications for update to authenticated
  using (app.is_member(tenant_id)) with check (app.is_member(tenant_id));

-- Confirma o pagamento numa transação só. Idempotente: chamar duas vezes não duplica nada.
-- Só o servidor (service_role) executa, depois de conferir no gateway.
create or replace function public.confirm_payment(p_charge uuid, p_paid_cents bigint, p_method text, p_tx text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  c public.charges; l public.leads; won uuid; pl text;
begin
  select * into c from public.charges where id = p_charge for update;
  if not found then raise exception 'cobrança não encontrada'; end if;
  if c.status = 'paid' then return false; end if;
  if p_paid_cents < c.amount_cents then raise exception 'valor pago menor que o cobrado'; end if;

  update public.charges set status = 'paid', paid_at = now(),
         method = case when p_method in ('pix', 'card', 'boleto') then p_method when p_method = 'credit_card' then 'card' else method end,
         gateway_id = coalesce(p_tx, gateway_id)
   where id = c.id;

  insert into public.cash_entries (tenant_id, charge_id, direction, category, description, amount_cents, occurred_on)
  values (c.tenant_id, c.id, 'in', 'Cobranças', c.description, c.amount_cents, current_date);

  if c.lead_id is not null then
    select id into won from public.pipeline_stages where tenant_id = c.tenant_id and kind = 'won' order by position limit 1;
    update public.leads set stage_id = coalesce(won, stage_id), paid_at = now(), next_follow_up = null
     where id = c.lead_id returning * into l;
    insert into public.activities (tenant_id, lead_id, kind, body, meta)
    values (c.tenant_id, c.lead_id, 'payment', 'Pagamento confirmado: ' || c.description,
            jsonb_build_object('charge_id', c.id, 'amount_cents', c.amount_cents, 'method', p_method, 'transaction', p_tx));
  end if;

  select name into pl from public.plans where id = c.plan_id;
  insert into public.notifications (tenant_id, lead_id, kind, title, body)
  values (c.tenant_id, c.lead_id, 'paid',
          coalesce(l.name, 'Cliente') || ' agora é pagante',
          coalesce(pl, c.description) || ' · R$ ' || replace(to_char(c.amount_cents / 100.0, 'FM999999990.00'), '.', ','));
  return true;
end $$;
revoke execute on function public.confirm_payment(uuid, bigint, text, text) from public, anon, authenticated;
grant execute on function public.confirm_payment(uuid, bigint, text, text) to service_role;

-- Atualizações em tempo real do sino.
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when others then null; end $$;

grant select, insert, update, delete on public.plans to authenticated;
grant select on public.payment_events to authenticated;
grant select, update on public.notifications to authenticated;
revoke all on public.plans, public.payment_events, public.notifications from anon;
