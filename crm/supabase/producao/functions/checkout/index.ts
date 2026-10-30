// Gera o link de pagamento da InfinitePay para um plano.
// Dois jeitos de chamar:
//  - Página pública (sem login): { slug, plan_id, name, phone, email?, consent: true } → cria o lead e o link.
//  - Dentro do CRM (com login):  { lead_id, plan_id } → só gera o link para um lead que o usuário pode ver.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const URL_ = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const UUID = /^[0-9a-f-]{36}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: "Corpo inválido." }, 400); }
  const planId = String(b.plan_id ?? "");
  if (!UUID.test(planId)) return json({ error: "Plano inválido." }, 400);

  let tenantId: string, lead: { id: string; name: string; phone: string | null; email: string | null };
  if (b.lead_id) {
    // Pedido de dentro do CRM: precisa de login e de perfil que vende (dono, admin ou vendas).
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: "Entre no CRM para gerar links." }, 401);
    const { data: l } = await admin.from("leads").select("id, tenant_id, name, phone, email").eq("id", String(b.lead_id)).maybeSingle();
    if (!l) return json({ error: "Lead não encontrado." }, 404);
    const { data: m } = await admin.from("memberships").select("role")
      .eq("tenant_id", l.tenant_id).eq("user_id", u.user.id).in("role", ["owner", "admin", "sales"]).maybeSingle();
    if (!m) return json({ error: "Seu perfil não pode gerar cobranças." }, 403);
    tenantId = l.tenant_id; lead = l;
  } else {
    const slug = String(b.slug ?? "").toLowerCase();
    const name = String(b.name ?? "").trim().slice(0, 120);
    const phone = String(b.phone ?? "").replace(/\D/g, "");
    const email = String(b.email ?? "").trim().slice(0, 160) || null;
    if (b.website) return json({ ok: true }); // campo-isca: robô
    if (name.length < 2) return json({ error: "Escreva seu nome." }, 400);
    if (phone.length < 10 || phone.length > 13) return json({ error: "Digite o WhatsApp com DDD." }, 400);
    if (b.consent !== true) return json({ error: "Aceite a autorização de contato." }, 400);

    const { data: t } = await admin.from("tenants").select("id").eq("slug", slug).maybeSingle();
    if (!t) return json({ error: "Empresa não encontrada." }, 404);
    tenantId = t.id;

    // Limite simples contra abuso: 3 pedidos por telefone por hora em cada empresa.
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await admin.from("leads").select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId).eq("phone", phone).gte("created_at", since);
    if ((count ?? 0) >= 3) return json({ error: "Muitos pedidos seguidos. Tente de novo em 1 hora." }, 429);

    const { data: st } = await admin.from("pipeline_stages").select("id").eq("tenant_id", tenantId).order("position").limit(1).single();
    const { data: l, error } = await admin.from("leads").insert({
      tenant_id: tenantId, stage_id: st!.id, name, phone, email, source: "form",
      utm: { via: "checkout" }, consent_at: new Date().toISOString(),
      consent_text: String(b.consent_text ?? "Autorizo o contato sobre este pedido.").slice(0, 400),
    }).select("id, name, phone, email").single();
    if (error) return json({ error: "Não deu para registrar o pedido." }, 500);
    lead = l;
    await admin.from("activities").insert({ tenant_id: tenantId, lead_id: l.id, kind: "form", body: "Escolheu um plano na página e foi para o pagamento." });
  }

  const [{ data: tenant }, { data: plan }] = await Promise.all([
    admin.from("tenants").select("payment_gateway, payment_handle, name").eq("id", tenantId).single(),
    admin.from("plans").select("id, name, price_cents, active").eq("id", planId).eq("tenant_id", tenantId).maybeSingle(),
  ]);
  if (!plan || !plan.active) return json({ error: "Plano indisponível." }, 404);
  if (tenant?.payment_gateway !== "infinitepay" || !tenant.payment_handle)
    return json({ error: "Pagamento online ainda não configurado para esta empresa." }, 409);

  const chargeId = crypto.randomUUID();
  const { error: cErr } = await admin.from("charges").insert({
    id: chargeId, tenant_id: tenantId, lead_id: lead.id, plan_id: plan.id, description: plan.name,
    amount_cents: plan.price_cents, due_date: new Date().toISOString().slice(0, 10),
    status: "pending", gateway: "infinitepay", order_nsu: chargeId,
  });
  if (cErr) return json({ error: "Não deu para criar a cobrança." }, 500);

  const digits = (lead.phone ?? "").replace(/\D/g, "");
  const payload = {
    handle: tenant.payment_handle.replace(/^\$/, ""),
    items: [{ quantity: 1, price: plan.price_cents, description: plan.name }],
    order_nsu: chargeId,
    webhook_url: `${URL_}/functions/v1/infinitepay-webhook`,
    ...(typeof b.redirect_url === "string" && /^https:\/\//.test(b.redirect_url) ? { redirect_url: b.redirect_url } : {}),
    customer: {
      name: lead.name,
      ...(lead.email ? { email: lead.email } : {}),
      ...(digits ? { phone_number: "+" + (digits.startsWith("55") ? digits : "55" + digits) } : {}),
    },
  };

  const r = await fetch("https://api.checkout.infinitepay.io/links", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  const url = data.url ?? data.link ?? data.checkout_url ?? data.payment_url ?? data?.data?.url;
  await admin.from("payment_events").insert({
    tenant_id: tenantId, charge_id: chargeId, gateway: "infinitepay",
    payload: { step: "create_link", status: r.status, response: data }, verified: false,
  });
  if (!r.ok || !url) {
    await admin.from("charges").update({ status: "canceled" }).eq("id", chargeId);
    return json({ error: "A InfinitePay não gerou o link. Confira a InfiniteTag e se o checkout integrado está ativo." }, 502);
  }

  await admin.from("charges").update({ checkout_url: url }).eq("id", chargeId);
  await admin.from("activities").insert({
    tenant_id: tenantId, lead_id: lead.id, kind: "proposal",
    body: `Link de pagamento gerado: ${plan.name}`, meta: { charge_id: chargeId, url },
  });
  return json({ url, charge_id: chargeId });
});
