// Cópia de segurança: grava em Storage (bucket privado "copias") um JSON com todos os dados de cada empresa.
// O banco chama aos domingos (cabeçalho x-interno). O dono também pode pedir uma cópia na hora e baixar as últimas.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const TABLES = ["pipeline_stages", "clients", "contacts", "leads", "activities", "proposals", "tasks", "charges", "cash_entries", "plans", "subscriptions", "projects", "files", "deletions", "notifications", "memberships", "forms"];
const KEEP = 12;

async function rows(table: string, tenant: string) {
  const out: unknown[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin.from(table).select("*").eq("tenant_id", tenant).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}
async function backupTenant(id: string) {
  const { data: tenant } = await admin.from("tenants").select("*").eq("id", id).single();
  const dump: Record<string, unknown> = { version: 1, created_at: new Date().toISOString(), tenant };
  for (const t of TABLES) dump[t] = await rows(t, id);
  const path = `${id}/${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const { error } = await admin.storage.from("copias").upload(path, new Blob([JSON.stringify(dump)], { type: "application/json" }), { contentType: "application/json" });
  if (error) throw new Error(error.message);
  const { data: list } = await admin.storage.from("copias").list(id, { limit: 100, sortBy: { column: "name", order: "desc" } });
  const old = (list ?? []).slice(KEEP).map((f) => `${id}/${f.name}`);
  if (old.length) await admin.storage.from("copias").remove(old);
  return { path, counts: Object.fromEntries(TABLES.map((t) => [t, (dump[t] as unknown[]).length])) };
}
async function listTenant(id: string) {
  const { data: list } = await admin.storage.from("copias").list(id, { limit: KEEP, sortBy: { column: "name", order: "desc" } });
  const out = [];
  for (const f of list ?? []) {
    const { data } = await admin.storage.from("copias").createSignedUrl(`${id}/${f.name}`, 3600, { download: `copia-${f.name}` });
    out.push({ name: f.name, size: f.metadata?.size ?? 0, url: data?.signedUrl ?? "" });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { /* corpo vazio */ }

  const interno = req.headers.get("x-interno");
  if (interno) {
    const { data: secret } = await admin.rpc("vault_get", { p_name: "interno" });
    if (!secret || interno !== secret) return json({ error: "Não autorizado." }, 401);
    const { data: ts } = await admin.from("tenants").select("id, slug");
    const done = [], failed = [];
    for (const t of ts ?? []) { try { done.push({ slug: t.slug, ...(await backupTenant(t.id)) }); } catch (e) { console.error(t.slug, e); failed.push(t.slug); } }
    return json({ ok: true, done: done.length, failed });
  }

  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { data: u } = await admin.auth.getUser(jwt);
  if (!u?.user) return json({ error: "Entre no CRM." }, 401);
  const tenant = String(b.tenant_id ?? "");
  const { data: m } = await admin.from("memberships").select("role").eq("tenant_id", tenant).eq("user_id", u.user.id).eq("role", "owner").maybeSingle();
  if (!m) return json({ error: "Só o dono acessa as cópias de segurança." }, 403);
  try {
    if (b.action === "now") await backupTenant(tenant);
    return json({ ok: true, copies: await listTenant(tenant) });
  } catch (e) { console.error(e); return json({ error: "Não deu para fazer a cópia agora. Tente de novo." }, 500); }
});
