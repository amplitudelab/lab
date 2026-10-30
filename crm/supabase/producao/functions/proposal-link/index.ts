// Gera, a partir de uma proposta do CRM, o link de pagamento da InfinitePay com o valor certo.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const URL_ = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { data: u } = await admin.auth.getUser(token);
  if (!u?.user) return json({ error: "Entre no CRM para gerar links." }, 401);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: "Corpo inválido." }, 400); }

  const { data: p } = await admin.from("proposals").select("id, tenant_id, lead_id, client_id, title, total_cents, status").eq("id", String(b.proposal_id ?? "")).maybeSingle();
  if (!p) return json({ error: "Proposta não encontrada." }, 404);
  const { data: m } = await admin.from("memberships").select("role").eq("tenant_id", p.tenant_id).eq("user_id", u.user.id).in("role", ["owner", "admin", "sales"]).maybeSingle();
  if (!m) return json({ error: "Seu perfil não pode gerar cobranças." }, 403);
  if (p.status === "accepted") return json({ error: "Esta proposta já foi paga ou aceita." }, 409);

  const amount = b.amount_cents == null ? Number(p.total_cents) : Math.round(Number(b.amount_cents));
  if (!Number.isFinite(amount) || amount < 100) return json({ error: "O valor mínimo do link é R$ 1,00." }, 400);
  if (amount > Number(p.total_cents)) return json({ error: "O valor do link não pode passar do total da proposta." }, 400);

  const { data: t } = await admin.from("tenants").select("payment_gateway, payment_handle").eq("id", p.tenant_id).single();
  if (t?.payment_gateway !== "infinitepay" || !t.payment_handle) return json({ error: "Pagamento online ainda não configurado para esta empresa." }, 409);
  const { data: lead } = p.lead_id ? await admin.from("leads").select("name, phone, email").eq("id", p.lead_id).maybeSingle() : { data: null };
  const { data: client } = !lead && p.client_id ? await admin.from("clients").select("name, phone, email").eq("id", p.client_id).maybeSingle() : { data: null };
  const who = lead ?? client;

  const description = `${p.title}${amount < Number(p.total_cents) ? " · entrada" : ""}`.slice(0, 120);
  const chargeId = crypto.randomUUID();
  // Só o link mais novo fica pendente no financeiro.
  await admin.from("charges").update({ status: "canceled" }).eq("proposal_id", p.id).eq("status", "pending");
  const { error: cErr } = await admin.from("charges").insert({
    id: chargeId, tenant_id: p.tenant_id, proposal_id: p.id, lead_id: p.lead_id, client_id: p.client_id, description, amount_cents: amount,
    due_date: new Date().toISOString().slice(0, 10), status: "pending", gateway: "infinitepay", order_nsu: chargeId,
  });
  if (cErr) { console.error(cErr); return json({ error: "Não deu para criar a cobrança." }, 500); }

  const digits = String(who?.phone ?? "").replace(/\D/g, "");
  const r = await fetch("https://api.checkout.infinitepay.io/links", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: t.payment_handle.replace(/^\$/, ""),
      items: [{ quantity: 1, price: amount, description }],
      order_nsu: chargeId,
      webhook_url: `${URL_}/functions/v1/infinitepay-webhook`,
      ...(who ? { customer: { name: who.name, ...(who.email ? { email: who.email } : {}), ...(digits.length >= 10 ? { phone_number: "+" + (digits.startsWith("55") ? digits : "55" + digits) } : {}) } } : {}),
    }),
  });
  const data = await r.json().catch(() => ({}));
  const url = data.url ?? data.link ?? data.checkout_url ?? data.payment_url ?? data?.data?.url;
  await admin.from("payment_events").insert({ tenant_id: p.tenant_id, charge_id: chargeId, gateway: "infinitepay", payload: { step: "create_link", status: r.status, response: data } });
  if (!r.ok || !url) {
    await admin.from("charges").update({ status: "canceled" }).eq("id", chargeId);
    return json({ error: "A InfinitePay não gerou o link. Confira a InfiniteTag e se o checkout integrado está ativo." }, 502);
  }
  await admin.from("charges").update({ checkout_url: url }).eq("id", chargeId);
  await admin.from("proposals").update({ checkout_url: url, pay_cents: amount, status: "sent" }).eq("id", p.id);
  if (p.lead_id) await admin.from("activities").insert({ tenant_id: p.tenant_id, lead_id: p.lead_id, kind: "proposal", body: `Link de pagamento gerado: ${description}`, meta: { charge_id: chargeId, url, by: "CRM" } });
  return json({ url, charge_id: chargeId, amount_cents: amount });
});
