// asaas-webhook (Fase 2): o Asaas avisa quando uma cobrança é paga ou vence.
// O trigger charge_paid_cash do banco cria a entrada no caixa sozinho.
// Deploy: supabase functions deploy asaas-webhook --no-verify-jwt
// Segredos: ASAAS_WEBHOOK_TOKEN (o mesmo cadastrado no painel do Asaas, em Integrações → Webhooks).
import { createClient } from 'npm:@supabase/supabase-js@2';

const STATUS: Record<string, 'paid' | 'overdue' | 'canceled'> = {
  PAYMENT_RECEIVED: 'paid',
  PAYMENT_CONFIRMED: 'paid',
  PAYMENT_OVERDUE: 'overdue',
  PAYMENT_DELETED: 'canceled',
  PAYMENT_REFUNDED: 'canceled',
};

Deno.serve(async (req) => {
  if (req.headers.get('asaas-access-token') !== Deno.env.get('ASAAS_WEBHOOK_TOKEN')) {
    return new Response('não autorizado', { status: 401 });
  }
  const ev = await req.json().catch(() => null);
  const status = ev && STATUS[ev.event];
  if (!status || !ev.payment?.id) return new Response('ignorado');   // 200: o Asaas não reenvia

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: charge, error } = await db.from('charges')
    .update({ status, paid_at: status === 'paid' ? (ev.payment.paymentDate ?? new Date().toISOString()) : null })
    .eq('asaas_id', ev.payment.id)
    .select('id, tenant_id, lead_id, description, amount_cents')
    .maybeSingle();
  if (error) return new Response('erro', { status: 500 });           // 500: o Asaas tenta de novo
  if (charge?.lead_id && status === 'paid') {
    await db.from('activities').insert({
      tenant_id: charge.tenant_id, lead_id: charge.lead_id, kind: 'payment', by_label: 'Asaas',
      body: `Pagamento recebido: ${charge.description} (R$ ${(charge.amount_cents / 100).toFixed(2).replace('.', ',')})`,
    });
  }
  return new Response('ok');
});

// Para CRIAR a cobrança no Asaas (botão "Gerar cobrança"), chame a API pelo servidor:
//   POST https://api.asaas.com/v3/payments  (header access_token: <chave do tenant>)
//   { customer, billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD', value, dueDate, description, externalReference: <charges.id> }
// e salve o id e o invoiceUrl de volta em charges.asaas_id e charges.payment_url.
