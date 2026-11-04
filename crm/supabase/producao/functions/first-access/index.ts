// Primeiro acesso: troca um convite de uso único por uma conta com e-mail e senha.
// Dois jeitos de convidar: o link antigo (token de 64 caracteres) e a chave de cadastro curta
// (AMP-XXXX-XXXX-XXXX), que o dono gera no menu Chaves de acesso já com o perfil do colaborador.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

// Chave: 12 letras e números sem os que confundem (0/O, 1/I/L). Cerca de 59 bits: não dá para adivinhar.
const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const ROLES = ["admin", "sales", "finance", "viewer"];
const IP_LIMIT = 8;
const since = (min: number) => new Date(Date.now() - min * 60000).toISOString();
const normalize = (s: unknown) => { const k = String(s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, ""); return k.length === 15 && k.startsWith("AMP") ? k.slice(3) : k; };
async function sha(s: string) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map((x) => x.toString(16).padStart(2, "0")).join("");
}
function newKey() {
  let k = "";
  while (k.length < 12) {   // descarta bytes acima de 247 para todas as letras terem a mesma chance
    for (const x of crypto.getRandomValues(new Uint8Array(16))) if (x < 248 && k.length < 12) k += ALPHA[x % ALPHA.length];
  }
  return { plain: `AMP-${k.slice(0, 4)}-${k.slice(4, 8)}-${k.slice(8)}`, raw: k };
}

// O dono gera a chave. Ela aparece só nesta resposta; no banco fica o hash.
async function createKey(req: Request, b: Record<string, unknown>) {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { data: u } = await admin.auth.getUser(jwt);
  if (!u?.user) return json({ error: "Entre no CRM para gerar chaves." }, 401);
  const tenantId = String(b.tenant_id ?? "");
  const { data: m } = await admin.from("memberships").select("role").eq("tenant_id", tenantId).eq("user_id", u.user.id).eq("role", "owner").maybeSingle();
  if (!m) return json({ error: "Só o dono gera chaves de acesso." }, 403);
  const role = String(b.role ?? "");
  if (!ROLES.includes(role)) return json({ error: "Escolha um perfil válido." }, 400);
  const days = [1, 3, 7].includes(Number(b.days)) ? Number(b.days) : 7;
  const name = String(b.name ?? "").trim().slice(0, 80) || null;
  const k = newKey();
  const { data, error } = await admin.from("invites").insert({
    tenant_id: tenantId, role, name, created_by: u.user.id, code_hash: await sha(k.raw), code_hint: k.raw.slice(-4),
    expires_at: new Date(Date.now() + days * 86400000).toISOString(),
  }).select("id, expires_at").single();
  if (error) { console.error(error); return json({ error: "Não deu para gerar a chave." }, 500); }
  return json({ ok: true, key: k.plain, id: data.id, expires_at: data.expires_at });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: "Corpo inválido." }, 400); }
  if (b.action === "create") return createKey(req, b);

  const token = String(b.token ?? ""), email = String(b.email ?? "").trim().toLowerCase(), password = String(b.password ?? "");
  const byKey = b.code !== undefined;
  let inv: { id: string; tenant_id: string; role: string; expires_at: string; used_at: string | null } | null = null;

  if (byKey) {
    // Limite por endereço: quem erra muito espera 15 minutos.
    const ip = (req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "desconhecido").split(",")[0].trim();
    const { count } = await admin.from("invite_attempts").select("id", { count: "exact", head: true }).eq("ip", ip).gte("at", since(15));
    if ((count ?? 0) >= IP_LIMIT) return json({ error: "Muitas tentativas. Aguarde 15 minutos e tente de novo." }, 429);
    const raw = normalize(b.code);
    if (raw.length === 12) ({ data: inv } = await admin.from("invites").select("id, tenant_id, role, expires_at, used_at").eq("code_hash", await sha(raw)).maybeSingle());
    if (!inv) {
      await admin.from("invite_attempts").insert({ ip });
      await admin.from("invite_attempts").delete().lt("at", since(1440));
      return json({ error: "Chave incorreta. Confira as letras e os números." }, 401);
    }
  } else {
    if (!/^[0-9a-f]{64}$/.test(token)) return json({ error: "Convite inválido." }, 400);
    ({ data: inv } = await admin.from("invites").select("id, tenant_id, role, expires_at, used_at").eq("token", token).maybeSingle());
  }
  if (!inv || inv.used_at || new Date(inv.expires_at) < new Date()) {
    return json({ error: byKey ? "Esta chave venceu ou já foi usada. Peça uma nova ao dono." : "Este convite expirou ou já foi usado. Peça um novo." }, 410);
  }
  if (b.check === true) {
    const { data: t } = await admin.from("tenants").select("name, slug").eq("id", inv.tenant_id).single();
    return json({ ok: true, tenant: t, role: inv.role });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Digite um e-mail válido." }, 400);
  if (password.length < 10) return json({ error: "Use uma senha com pelo menos 10 caracteres." }, 400);

  // Marca o convite antes de criar a conta: dois envios ao mesmo tempo não geram duas contas.
  const { data: claimed } = await admin.from("invites").update({ used_at: new Date().toISOString() }).eq("id", inv.id).is("used_at", null).select("id").maybeSingle();
  if (!claimed) return json({ error: byKey ? "Esta chave já foi usada." : "Este convite já foi usado." }, 410);
  const { data: u, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !u?.user) {
    await admin.from("invites").update({ used_at: null }).eq("id", inv.id);
    return json({ error: /already|registered|exists/i.test(error?.message ?? "") ? "Este e-mail já tem conta. Use outro ou entre com ele." : "Não deu para criar a conta. Tente uma senha mais forte." }, 400);
  }
  const { error: mErr } = await admin.from("memberships").insert({ tenant_id: inv.tenant_id, user_id: u.user.id, role: inv.role });
  if (mErr) return json({ error: "Conta criada, mas sem acesso à empresa. Fale com a Amplitude Lab." }, 500);
  await admin.from("invites").update({ used_by: u.user.id }).eq("id", inv.id);
  const { data: t } = await admin.from("tenants").select("slug").eq("id", inv.tenant_id).single();
  return json({ ok: true, slug: t?.slug, role: inv.role });
});
