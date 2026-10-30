-- =====================================================================
-- Amplitude CRM · orçamento do site vira lead e proposta; proposta gera link
-- =====================================================================

-- Proposta guarda o link de pagamento gerado e o valor cobrado nele.
alter table public.proposals add column if not exists checkout_url text;
alter table public.proposals add column if not exists pay_cents bigint;

-- Tabela de preços do orçamento do site. O preço vem daqui, nunca do navegador.
update public.tenants set brand = brand || '{"catalog":{
  "pkgs":{"vitrine":{"name":"Página vitrine","lo":600,"hi":1200,"prazo":"2 a 4 dias"},
          "completo":{"name":"Site completo","lo":1200,"hi":2500,"prazo":"5 a 10 dias"},
          "loja":{"name":"Loja virtual","lo":2500,"hi":5000,"prazo":"15 a 30 dias"}},
  "mnts":{"basico":{"name":"Básico","price":79},"completo-mensal":{"name":"Completo","price":199}}}}'::jsonb
where slug = 'amplitudelab';

-- Pagamento confirmado também marca a proposta como aceita.
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

  if c.proposal_id is not null then
    update public.proposals set status = 'accepted', accepted_at = now() where id = c.proposal_id;
  end if;

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
