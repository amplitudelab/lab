// Recebe o aviso da InfinitePay. O aviso não tem assinatura, então NUNCA confiamos nele:
// conferimos o pagamento na API oficial (/payment_check) antes de dar baixa.
// Responde 200 quando terminou (ou quando não há nada a fazer) e 400 para a InfinitePay tentar de novo.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const done = (status = 200, msg = "ok") => new Response(msg, { status });

Deno.serve(async (req) => {
  if (req.method !== "POST") return done(405, "Use POST.");
  let p: Record<string, unknown>;
  try { p = await req.json(); } catch { return done(400, "corpo inválido"); }

  const orderNsu = String(p.order_nsu ?? "");
  const { data: charge } = orderNsu
    ? await admin.from("charges").select("id, tenant_id, amount_cents, status").eq("order_nsu", orderNsu).maybeSingle()
    : { data: null };

  const { data: ev } = await admin.from("payment_events").insert({
    tenant_id: charge?.tenant_id ?? null, charge_id: charge?.id ?? null, gateway: "infinitepay", payload: p, verified: false,
  }).select("id").single();
  const note = (n: string, verified = false) => admin.from("payment_events").update({ note: n, verified }).eq("id", ev!.id);

  if (!charge) { await note("pedido desconhecido"); return done(); }
  if (charge.status === "paid") { await note("já estava pago"); return done(); }

  const { data: t } = await admin.from("tenants").select("payment_handle").eq("id", charge.tenant_id).single();
  const check = await fetch("https://api.checkout.infinitepay.io/payment_check", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: String(t?.payment_handle ?? "").replace(/^\$/, ""),
      order_nsu: orderNsu,
      transaction_nsu: p.transaction_nsu,
      slug: p.invoice_slug ?? p.slug,
    }),
  }).then((r) => r.json()).catch(() => null);

  if (!check) { await note("payment_check indisponível"); return done(400, "tente de novo"); }
  if (!check.success || !check.paid) { await note("não pago na conferência: " + JSON.stringify(check)); return done(); }
  if (Number(check.amount) !== Number(charge.amount_cents)) {
    await note(`valor diferente: cobrado ${charge.amount_cents}, gateway ${check.amount}`);
    return done();
  }

  const { error } = await admin.rpc("confirm_payment", {
    p_charge: charge.id, p_paid_cents: Number(check.amount),
    p_method: String(check.capture_method ?? p.capture_method ?? ""), p_tx: String(p.transaction_nsu ?? ""),
  });
  if (error) { await note("erro ao confirmar: " + error.message); return done(400, "tente de novo"); }
  await note("pagamento confirmado", true);
  return done();
});
