// Primeiro acesso: troca um convite de uso único por uma conta com e-mail e senha.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: "Corpo inválido." }, 400); }
  const token = String(b.token ?? ""), email = String(b.email ?? "").trim().toLowerCase(), password = String(b.password ?? "");
  if (!/^[0-9a-f]{64}$/.test(token)) return json({ error: "Convite inválido." }, 400);
  const { data: inv } = await admin.from("invites").select("id, tenant_id, role, expires_at, used_at").eq("token", token).maybeSingle();
  if (!inv || inv.used_at || new Date(inv.expires_at) < new Date()) return json({ error: "Este convite expirou ou já foi usado. Peça um novo." }, 410);
  if (b.check === true) { const { data: t } = await admin.from("tenants").select("name, slug").eq("id", inv.tenant_id).single(); return json({ ok: true, tenant: t }); }
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Digite um e-mail válido." }, 400);
  if (password.length < 10) return json({ error: "Use uma senha com pelo menos 10 caracteres." }, 400);

  // Marca o convite antes de criar a conta: dois envios ao mesmo tempo não geram duas contas.
  const { data: claimed } = await admin.from("invites").update({ used_at: new Date().toISOString() }).eq("id", inv.id).is("used_at", null).select("id").maybeSingle();
  if (!claimed) return json({ error: "Este convite já foi usado." }, 410);
  const { data: u, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !u?.user) {
    await admin.from("invites").update({ used_at: null }).eq("id", inv.id);
    return json({ error: /already|registered|exists/i.test(error?.message ?? "") ? "Este e-mail já tem conta. Use outro ou entre com ele." : "Não deu para criar a conta. Tente uma senha mais forte." }, 400);
  }
  const { error: mErr } = await admin.from("memberships").insert({ tenant_id: inv.tenant_id, user_id: u.user.id, role: inv.role });
  if (mErr) return json({ error: "Conta criada, mas sem acesso à empresa. Fale com a Amplitude Lab." }, 500);
  await admin.from("invites").update({ used_by: u.user.id }).eq("id", inv.id);
  return json({ ok: true });
});
