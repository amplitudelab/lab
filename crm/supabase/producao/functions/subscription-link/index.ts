// Gera o link de pagamento da InfinitePay para a mensalidade do mês. Quando o cliente paga, o webhook marca o mês como pago.
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

  const { data: s } = await admin.from("subscriptions").select("id, tenant_id, client_id, name, amount_cents, due_day, status").eq("id", String(b.subscription_id ?? "")).maybeSingle();
  if (!s) return json({ error: "Mensalidade não encontrada." }, 404);
  const { data: m } = await admin.from("memberships").select("role").eq("tenant_id", s.tenant_id).eq("user_id", u.user.id).in("role", ["owner", "admin", "finance"]).maybeSingle();
  if (!m) return json({ error: "Seu perfil não pode gerar cobranças." }, 403);
  if (s.status !== "active") return json({ error: "Esta mensalidade está pausada ou cancelada." }, 409);
  const { data: t } = await admin.from("tenants").select("payment_gateway, payment_handle").eq("id", s.tenant_id).single();
  if (t?.payment_gateway !== "infinitepay" || !t.payment_handle) return json({ error: "Pagamento online ainda não configurado para esta empresa." }, 409);
  const { data: c } = s.client_id ? await admin.from("clients").select("name, phone, email").eq("id", s.client_id).maybeSingle() : { data: null };

  const now = new Date(), mes = `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  const description = `${s.name} · mensalidade ${mes}`.slice(0, 120);
  const due = new Date(now.getFullYear(), now.getMonth(), s.due_day).toISOString().slice(0, 10);
  const chargeId = crypto.randomUUID();
  // Só o link mais novo da mensalidade fica pendente no financeiro.
  await admin.from("charges").update({ status: "canceled" }).eq("subscription_id", s.id).eq("status", "pending");
  const { error: cErr } = await admin.from("charges").insert({
    id: chargeId, tenant_id: s.tenant_id, client_id: s.client_id, subscription_id: s.id, description, amount_cents: s.amount_cents,
    due_date: due, status: "pending", gateway: "infinitepay", order_nsu: chargeId,
  });
  if (cErr) { console.error(cErr); return json({ error: "Não deu para criar a cobrança." }, 500); }

  const digits = String(c?.phone ?? "").replace(/\D/g, "");
  const r = await fetch("https://api.checkout.infinitepay.io/links", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: t.payment_handle.replace(/^\$/, ""),
      items: [{ quantity: 1, price: Number(s.amount_cents), description }],
      order_nsu: chargeId,
      webhook_url: `${URL_}/functions/v1/infinitepay-webhook`,
      ...(c ? { customer: { name: c.name, ...(c.email ? { email: c.email } : {}), ...(digits.length >= 10 ? { phone_number: "+" + (digits.startsWith("55") ? digits : "55" + digits) } : {}) } } : {}),
    }),
  });
  const data = await r.json().catch(() => ({}));
  const url = data.url ?? data.link ?? data.checkout_url ?? data.payment_url ?? data?.data?.url;
  await admin.from("payment_events").insert({ tenant_id: s.tenant_id, charge_id: chargeId, gateway: "infinitepay", payload: { step: "create_link", status: r.status, response: data } });
  if (!r.ok || !url) {
    await admin.from("charges").update({ status: "canceled" }).eq("id", chargeId);
    return json({ error: "A InfinitePay não gerou o link. Confira a InfiniteTag e se o checkout integrado está ativo." }, 502);
  }
  await admin.from("charges").update({ checkout_url: url }).eq("id", chargeId);
  return json({ url, charge_id: chargeId, amount_cents: s.amount_cents, description });
});
