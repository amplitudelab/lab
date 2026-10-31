// Entrada com código de acesso e troca do código pelo dono. Guarda só o hash e limita as tentativas erradas.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const ITERATIONS = 150000, IP_LIMIT = 5, TENANT_LIMIT = 10;
const hex = (b: ArrayBuffer | Uint8Array) => [...new Uint8Array(b as ArrayBuffer)].map((x) => x.toString(16).padStart(2, "0")).join("");
const unhex = (s: string) => Uint8Array.from(s.match(/../g)!.map((x) => parseInt(x, 16)));
const clean = (s: unknown) => String(s ?? "").trim().toLowerCase();

async function derive(code: string, salt: string, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: unhex(salt), iterations }, key, 256));
}
function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
const since = (min: number) => new Date(Date.now() - min * 60000).toISOString();

async function setCode(req: Request, tenantId: string, code: string) {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { data: u } = await admin.auth.getUser(jwt);
  if (!u?.user) return json({ error: "Entre no CRM para mudar o código." }, 401);
  const { data: m } = await admin.from("memberships").select("role").eq("tenant_id", tenantId).eq("user_id", u.user.id).eq("role", "owner").maybeSingle();
  if (!m) return json({ error: "Só o dono muda o código de acesso." }, 403);
  if (!code) {
    await admin.from("access_codes").delete().eq("tenant_id", tenantId);
    return json({ ok: true, off: true });
  }
  if (code.length < 10) return json({ error: "Use um código com pelo menos 10 caracteres." }, 400);
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  const { error } = await admin.from("access_codes").upsert({ tenant_id: tenantId, user_id: u.user.id, salt, hash: await derive(code, salt, ITERATIONS), iterations: ITERATIONS, updated_at: new Date().toISOString() });
  return error ? json({ error: "Não deu para salvar o código." }, 500) : json({ ok: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: "Corpo inválido." }, 400); }
  const code = clean(b.code);
  const { data: tenant } = await admin.from("tenants").select("id").eq("slug", String(b.slug ?? "")).maybeSingle();
  if (!tenant) return json({ error: "Código incorreto." }, 401);
  if (b.action === "set") return setCode(req, tenant.id, code);

  const ip = (req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "desconhecido").split(",")[0].trim();
  const [{ count: byIp }, { count: byTenant }] = await Promise.all([
    admin.from("access_code_attempts").select("id", { count: "exact", head: true }).eq("ip", ip).gte("at", since(15)),
    admin.from("access_code_attempts").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id).gte("at", since(60)),
  ]);
  if ((byIp ?? 0) >= IP_LIMIT || (byTenant ?? 0) >= TENANT_LIMIT) return json({ error: "Muitas tentativas. Aguarde e tente de novo, ou entre com e-mail e senha." }, 429);

  const { data: row } = await admin.from("access_codes").select("user_id, salt, hash, iterations").eq("tenant_id", tenant.id).maybeSingle();
  const ok = !!row && !!code && same(await derive(code, row.salt, row.iterations), row.hash);
  if (!ok) {
    await admin.from("access_code_attempts").insert({ tenant_id: tenant.id, ip });
    await admin.from("access_code_attempts").delete().lt("at", since(1440));
    if ((byTenant ?? 0) + 1 === TENANT_LIMIT) await admin.from("notifications").insert({ tenant_id: tenant.id, kind: "system", title: "Código de acesso bloqueado por 1 hora", body: `Houve ${TENANT_LIMIT} tentativas erradas. Se não foi você, troque o código em Equipe e acesso.` });
    return json({ error: "Código incorreto." }, 401);
  }
  const { data: u } = await admin.auth.admin.getUserById(row.user_id);
  if (!u?.user?.email) return json({ error: "Não deu para entrar com o código." }, 500);
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: u.user.email });
  if (error || !data?.properties?.hashed_token) { console.error(error); return json({ error: "Não deu para entrar com o código. Tente de novo." }, 500); }
  await admin.from("notifications").insert({ tenant_id: tenant.id, kind: "system", title: "Entrada com código de acesso", body: `Pelo endereço ${ip}. Se não foi você, troque o código em Equipe e acesso.` });
  return json({ token: data.properties.hashed_token });
});
