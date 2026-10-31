// Área da Amplitude Lab: lista as empresas, cria uma nova e muda o plano. Só o dono da conta amplitudelab usa.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const PLANS = ["essencial", "pro", "white_label"];
const SEGS = ["barbearia", "tattoo", "clinica", "restaurante", "academia", "salao", "loja", "fotografia", "evento", "estudio"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { data: u } = await admin.auth.getUser(token);
  if (!u?.user) return json({ error: "Entre no CRM." }, 401);
  const { data: home } = await admin.from("tenants").select("id").eq("slug", "amplitudelab").single();
  const { data: m } = await admin.from("memberships").select("role").eq("tenant_id", home!.id).eq("user_id", u.user.id).eq("role", "owner").maybeSingle();
  if (!m) return json({ error: "Só o dono da Amplitude Lab gerencia empresas." }, 403);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: "Corpo inválido." }, 400); }

  if (b.action === "list") {
    const { data: ts } = await admin.from("tenants").select("id, slug, name, niche, plan, payment_handle, created_at").neq("slug", "amplitudelab").order("created_at", { ascending: false });
    const out = [];
    for (const t of ts ?? []) {
      const [{ count: leads }, { count: membros }] = await Promise.all([
        admin.from("leads").select("id", { count: "exact", head: true }).eq("tenant_id", t.id).is("deleted_at", null),
        admin.from("memberships").select("user_id", { count: "exact", head: true }).eq("tenant_id", t.id),
      ]);
      out.push({ ...t, leads: leads ?? 0, membros: membros ?? 0 });
    }
    return json({ tenants: out });
  }
  if (b.action === "plan") {
    if (!PLANS.includes(String(b.plan))) return json({ error: "Plano inválido." }, 400);
    const { error } = await admin.from("tenants").update({ plan: b.plan }).eq("id", String(b.tenant_id)).neq("slug", "amplitudelab");
    return error ? json({ error: "Não deu para mudar o plano." }, 500) : json({ ok: true });
  }
  if (b.action === "invite") {
    const { data: inv, error } = await admin.from("invites").insert({ tenant_id: String(b.tenant_id), role: "owner", name: "Dono", created_by: u.user.id }).select("token").single();
    return error ? json({ error: error.message }, 400) : json({ token: inv.token });
  }

  // Empresa nova: nome, segmento e plano bastam.
  const name = String(b.name ?? "").trim().slice(0, 80), seg = SEGS.includes(String(b.segment)) ? String(b.segment) : "estudio", plan = PLANS.includes(String(b.plan)) ? String(b.plan) : "essencial";
  if (name.length < 2) return json({ error: "Escreva o nome da empresa." }, 400);
  const base = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 26) || "empresa";
  let slug = base.length < 3 ? base + "crm" : base;
  for (let i = 2; i < 50; i++) { const { data: e } = await admin.from("tenants").select("id").eq("slug", slug).maybeSingle(); if (!e) break; slug = base + i; }
  const { data: t, error } = await admin.from("tenants").insert({
    slug, name, niche: seg, plan, payment_handle: String(b.handle ?? "").trim().replace(/^\$/, "") || null, brand: { segment: seg },
  }).select("id, slug").single();
  if (error) { console.error(error); return json({ error: "Não deu para criar a empresa." }, 500); }
  const { data: inv, error: iErr } = await admin.from("invites").insert({ tenant_id: t.id, role: "owner", name: "Dono", created_by: u.user.id }).select("token").single();
  if (iErr) { console.error(iErr); return json({ error: "Empresa criada, mas o convite falhou." }, 500); }
  return json({ slug: t.slug, token: inv.token });
});
