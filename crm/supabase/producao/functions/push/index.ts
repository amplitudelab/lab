// Avisos no celular (Web Push). GET devolve a chave pública; o banco chama POST a cada notificação nova.
// O par de chaves é criado aqui na primeira vez e guardado no cofre do banco: a chave privada nunca sai do servidor.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const APP = "https://amplitudelab.github.io/lab/crm/app/";

async function keys() {
  let { data: pub } = await admin.rpc("vault_get", { p_name: "vapid_public" });
  let { data: pri } = await admin.rpc("vault_get", { p_name: "vapid_private" });
  if (!pub || !pri) {
    const k = webpush.generateVAPIDKeys();
    await admin.rpc("vault_put", { p_name: "vapid_public", p_value: k.publicKey });
    await admin.rpc("vault_put", { p_name: "vapid_private", p_value: k.privateKey });
    ({ data: pub } = await admin.rpc("vault_get", { p_name: "vapid_public" }));
    ({ data: pri } = await admin.rpc("vault_get", { p_name: "vapid_private" }));
  }
  return { pub: String(pub), pri: String(pri) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method === "GET") return json({ publicKey: (await keys()).pub });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  const { data: secret } = await admin.rpc("vault_get", { p_name: "interno" });
  if (!secret || req.headers.get("x-interno") !== secret) return json({ error: "Não autorizado." }, 401);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: "Corpo inválido." }, 400); }
  const { data: n } = await admin.from("notifications").select("id, tenant_id, lead_id, title, body").eq("id", String(b.notification_id ?? "")).maybeSingle();
  if (!n) return json({ error: "Notificação não encontrada." }, 404);
  const [{ data: subs }, { data: t }] = await Promise.all([
    admin.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("tenant_id", n.tenant_id),
    admin.from("tenants").select("slug, name").eq("id", n.tenant_id).single(),
  ]);
  if (!subs?.length) return json({ ok: true, sent: 0 });
  const k = await keys();
  webpush.setVapidDetails(APP, k.pub, k.pri);
  const payload = JSON.stringify({ title: n.title, body: n.body ?? "", url: `${APP}?empresa=${t?.slug ?? ""}${n.lead_id ? "#funil" : ""}`, tag: n.id });
  let sent = 0;
  for (const s of subs) {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400 }); sent++; }
    catch (e) { const code = (e as { statusCode?: number }).statusCode; if (code === 404 || code === 410) await admin.from("push_subscriptions").delete().eq("id", s.id); else console.error("push", code, e); }
  }
  return json({ ok: true, sent });
});
