// Orçamento do site: no clique do WhatsApp, cria o lead e a proposta completos no CRM.
// O preço vem da tabela da empresa (tenants.brand.catalog), nunca do navegador.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const txt = (v: unknown, n = 160) => String(v ?? "").trim().slice(0, n);
const brl = (v: number) => "R$ " + v.toLocaleString("pt-BR");
const fmtPhone = (d: string) => { const p = d.replace(/^55(?=\d{10,11}$)/, ""); return `(${p.slice(0, 2)}) ${p.slice(2, -4)}-${p.slice(-4)}`; };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  let b: Record<string, unknown>;
  try { b = JSON.parse(await req.text()); } catch { return json({ error: "Corpo inválido." }, 400); }
  if (b.website) return json({ ok: true }); // campo-isca: robô

  const nome = txt(b.nome, 120), digits = String(b.whatsapp ?? "").replace(/\D/g, "");
  if (nome.length < 2) return json({ error: "Escreva o nome." }, 400);
  if (digits.length < 10 || digits.length > 13) return json({ error: "Digite o WhatsApp com DDD." }, 400);

  const { data: t } = await admin.from("tenants").select("id, brand").eq("slug", txt(b.slug, 40)).maybeSingle();
  if (!t) return json({ error: "Empresa não encontrada." }, 404);
  const cat = t.brand?.catalog ?? {}, pkg = cat.pkgs?.[txt(b.pacote, 40)], mnt = cat.mnts?.[txt(b.plano, 40)];
  if (!pkg) return json({ error: "Pacote inválido." }, 400);

  // Limite contra abuso: no máximo 10 orçamentos por minuto em cada empresa.
  const { count } = await admin.from("leads").select("id", { count: "exact", head: true }).eq("tenant_id", t.id).gte("created_at", new Date(Date.now() - 60_000).toISOString());
  if ((count ?? 0) >= 10) return json({ error: "Muitos pedidos agora. Tente em 1 minuto." }, 429);

  const negocio = txt(b.negocio, 120), instagram = txt(b.instagram, 60), segmento = txt(b.segmento, 60), prazo = txt(b.prazo, 40), mensagem = txt(b.mensagem, 800);
  const recursos = (Array.isArray(b.recursos) ? b.recursos : []).slice(0, 20).map((x) => txt(x, 80)).filter(Boolean);
  const items = [{ d: `${pkg.name} · ${brl(pkg.lo)} a ${brl(pkg.hi)} · ${pkg.prazo}`, q: 1, u: pkg.lo * 100 }];
  recursos.forEach((r) => items.push({ d: `Inclui: ${r}`, q: 1, u: 0 }));
  if (mnt) items.push({ d: `Plano mensal ${mnt.name} (1ª mensalidade)`, q: 1, u: mnt.price * 100 });
  const total = items.reduce((a, i) => a + i.u, 0);
  const title = `${pkg.name} · ${negocio || nome}`;
  const detalhes = [`Orçamento pelo site: ${pkg.name} (${brl(pkg.lo)} a ${brl(pkg.hi)})`, negocio && `Negócio: ${negocio}`, instagram && `Instagram: ${instagram}`, segmento && `Segmento: ${segmento}`,
    recursos.length ? `Precisa de: ${recursos.join(", ")}` : "", mnt && `Plano mensal: ${mnt.name} (${brl(mnt.price)}/mês)`, prazo && `Para quando: ${prazo}`, mensagem && `Mensagem: ${mensagem}`].filter(Boolean).join("\n");
  const utm = { via: "orcamento-site", phone: digits, negocio, instagram, segmento, prazo };

  // Mesmo telefone em 24 horas: atualiza em vez de duplicar.
  const { data: prev } = await admin.from("leads").select("id").eq("tenant_id", t.id).is("paid_at", null).filter("utm->>phone", "eq", digits)
    .gte("created_at", new Date(Date.now() - 86_400_000).toISOString()).order("created_at", { ascending: false }).limit(1).maybeSingle();
  let leadId = prev?.id as string | undefined;
  const isNew = !leadId;
  if (leadId) {
    await admin.from("leads").update({ name: nome, interest: pkg.name, value_cents: total, utm }).eq("id", leadId);
  } else {
    const { data: st } = await admin.from("pipeline_stages").select("id").eq("tenant_id", t.id).eq("position", 3).single();
    const { data: l, error } = await admin.from("leads").insert({
      tenant_id: t.id, stage_id: st!.id, name: nome, phone: fmtPhone(digits), interest: pkg.name, source: "site", utm, value_cents: total,
      next_follow_up: new Date().toISOString(), consent_at: new Date().toISOString(), consent_text: "Enviou o pedido de orçamento pelo site e chamou no WhatsApp.",
    }).select("id").single();
    if (error) { console.error(error); return json({ error: "Não deu para registrar o pedido." }, 500); }
    leadId = l.id;
  }

  const { data: open } = await admin.from("proposals").select("id").eq("lead_id", leadId).in("status", ["draft", "sent", "viewed"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const validUntil = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  if (open) await admin.from("proposals").update({ title, items, total_cents: total, valid_until: validUntil, checkout_url: null, pay_cents: null }).eq("id", open.id);
  else await admin.from("proposals").insert({ tenant_id: t.id, lead_id: leadId, title, items, total_cents: total, status: "draft", valid_until: validUntil });

  await admin.from("activities").insert({ tenant_id: t.id, lead_id: leadId, kind: "whatsapp", body: detalhes, meta: { by: "Site" } });
  await admin.from("notifications").insert({ tenant_id: t.id, lead_id: leadId, kind: "lead", title: `${isNew ? "Novo orçamento" : "Orçamento atualizado"}: ${nome}`, body: `${pkg.name}${negocio ? " · " + negocio : ""} · chamou no WhatsApp` });
  return json({ ok: true });
});
