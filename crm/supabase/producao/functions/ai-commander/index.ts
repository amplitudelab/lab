// AI Commander: diretor operacional virtual. Só roda para empresas em app.commander_tenants e só para dono e admin.
// O modelo nunca acessa o banco direto: tudo passa pelas ferramentas abaixo, que filtram pela empresa e respeitam autonomia e permissões.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import Anthropic from "npm:@anthropic-ai/sdk@1.8.0";
import * as C from "./core.ts";
import type { ChatResult, Provider } from "../ai-sales/core.ts";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const URL_ = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
type J = Record<string, any>;
type Ctx = { tenant: string; company: string; s: C.Settings; user: string; role: string; cache: J };
type Origin = "commander" | "user";

const SP = 3 * 3600000;
const todaySP = () => new Date(Date.now() - SP).toISOString().slice(0, 10);
const monthStartSP = () => todaySP().slice(0, 8) + "01";
const activity = (ctx: Ctx, action: string, result: string, o: { ref_kind?: string; ref_id?: string | null; detail?: string; data?: unknown; agent?: string } = {}) =>
  admin.from("agent_activity").insert({ tenant_id: ctx.tenant, agent: o.agent ?? "commander", action, result, ref_kind: o.ref_kind ?? null, ref_id: o.ref_id ?? null, detail: (o.detail ?? "").slice(0, 500), data: C.safeLog(o.data ?? {}), actor: ctx.user }).then(() => {}, () => {});
const setState = (ctx: Ctx, state: string) => admin.from("agent_identities").update({ animation_state: state, updated_at: new Date().toISOString() }).eq("tenant_id", ctx.tenant).eq("agent_id", "commander").then(() => {}, () => {});
const dbErr = (e: { code?: string } | null) => (e?.code === "23505" ? "duplicate" : e ? "error" : null);

async function context(tenant: string, user: string): Promise<Ctx | { error: string; status: number }> {
  if (!/^[0-9a-f-]{36}$/i.test(tenant)) return { error: "Empresa inválida.", status: 400 };
  const { data: ok } = await admin.rpc("commander_allowed", { p_tenant: tenant });
  if (!ok) return { error: "Módulo indisponível.", status: 404 };
  const { data: m } = await admin.from("memberships").select("role").eq("tenant_id", tenant).eq("user_id", user).maybeSingle();
  if (!m || !["owner", "admin"].includes(String(m.role))) return { error: "O AI Commander é só para o dono e administradores.", status: 403 };
  const [{ data: t }, { data: row }] = await Promise.all([
    admin.from("tenants").select("name").eq("id", tenant).single(),
    admin.from("commander_settings").select("*").eq("tenant_id", tenant).maybeSingle(),
  ]);
  return { tenant, company: t?.name ?? "empresa", s: C.normalizeSettings(row), user, role: String(m.role), cache: {} };
}

// ---------- IA: reaproveita a chave do Claude que o AI Sales guarda no cofre (Vault) da empresa ----------
async function provider(ctx: Ctx): Promise<Provider> {
  if (ctx.s.provider !== "anthropic") throw new Error("Só o Claude está disponível como provedor nesta instalação.");
  const key = String((await admin.rpc("ai_secret_get", { p_tenant: ctx.tenant, p_name: "anthropic_api_key" })).data ?? "");
  if (!key) throw new Error("Configure a chave da API do Claude em AI Sales → Integrações. O Commander usa a mesma chave.");
  const client = new Anthropic({ apiKey: key });
  return {
    id: "anthropic",
    async chat(req) {
      const res: any = await client.beta.messages.create({
        model: req.model, max_tokens: req.maxTokens, system: req.system as any, messages: req.messages as any,
        ...(req.tools?.length ? { tools: req.tools as any } : {}),
        thinking: { type: "adaptive" }, output_config: { effort: req.effort as any },
        betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
      } as any);
      const u = res.usage ?? {};
      return { content: res.content ?? [], stopReason: String(res.stop_reason ?? ""), model: String(res.model ?? req.model),
        usage: { input: u.input_tokens ?? 0, output: u.output_tokens ?? 0, cacheRead: u.cache_read_input_tokens ?? 0, cacheWrite: u.cache_creation_input_tokens ?? 0 } };
    },
  };
}
const friendlyAiError = (e: unknown) => {
  if (e instanceof Anthropic.AuthenticationError) return "A chave da API do Claude foi recusada. Confira em AI Sales → Integrações.";
  if (e instanceof Anthropic.RateLimitError) return "O Claude está no limite de uso agora. Tente de novo em alguns minutos.";
  if (e instanceof Anthropic.BadRequestError) return "O Claude recusou o pedido: " + e.message.slice(0, 160);
  if (e instanceof Anthropic.APIError) return `Erro do Claude (${e.status}). Tente de novo.`;
  return e instanceof Error ? e.message : "Erro desconhecido na IA.";
};
async function recordUsage(ctx: Ctx, calls: ChatResult[], purpose: string) {
  if (!calls.length) return;
  await admin.from("ai_usage").insert(calls.map((c) => ({ tenant_id: ctx.tenant, provider: ctx.s.provider, model: c.model, input_tokens: c.usage.input + c.usage.cacheWrite, output_tokens: c.usage.output,
    cache_read_tokens: c.usage.cacheRead, cost_usd: C.costUsd(c.model, c.usage), purpose, is_test: false })));
}
async function monthCost(ctx: Ctx) {
  const { data } = await admin.from("ai_usage").select("cost_usd").eq("tenant_id", ctx.tenant).like("purpose", "commander%").gte("created_at", new Date(Date.parse(monthStartSP() + "T03:00:00Z")).toISOString());
  return (data ?? []).reduce((a, r) => a + Number(r.cost_usd ?? 0), 0);
}

// ---------- apoio ----------
async function team(ctx: Ctx): Promise<{ user_id: string; email: string | null; role: string }[]> {
  if (ctx.cache.team) return ctx.cache.team;
  const { data } = await admin.from("memberships").select("user_id, role").eq("tenant_id", ctx.tenant);
  ctx.cache.team = await Promise.all((data ?? []).map(async (m) => ({ user_id: m.user_id, role: m.role, email: (await admin.auth.admin.getUserById(m.user_id)).data?.user?.email ?? null })));
  return ctx.cache.team;
}
const isMember = async (ctx: Ctx, id: unknown) => (await team(ctx)).some((m) => m.user_id === id);
const emailOf = async (ctx: Ctx, id: string | null) => (id ? (await team(ctx)).find((m) => m.user_id === id)?.email ?? "pessoa fora da equipe" : null);
async function stages(ctx: Ctx): Promise<{ id: string; position: number; name: string; kind: string }[]> {
  if (!ctx.cache.stages) ctx.cache.stages = (await admin.from("pipeline_stages").select("id, position, name, kind").eq("tenant_id", ctx.tenant).order("position")).data ?? [];
  return ctx.cache.stages;
}
const TABLE: J = { lead: "leads", project: "projects", charge: "charges", subscription: "subscriptions", proposal: "proposals", client: "clients", alert: "commander_alerts" };
async function exists(ctx: Ctx, kind: string, id: unknown) {
  if (!TABLE[kind] || !id) return null;
  const { data } = await admin.from(TABLE[kind]).select("*").eq("tenant_id", ctx.tenant).eq("id", String(id)).maybeSingle();
  return data && !data.deleted_at ? data : null;
}
async function names(ctx: Ctx, rows: J[]) {
  const cids = [...new Set(rows.map((r) => r.client_id).filter(Boolean))], lids = [...new Set(rows.map((r) => r.lead_id).filter(Boolean))];
  const [{ data: cl }, { data: ld }] = await Promise.all([
    cids.length ? admin.from("clients").select("id, name").in("id", cids) : Promise.resolve({ data: [] as J[] }),
    lids.length ? admin.from("leads").select("id, name, paid_at").in("id", lids) : Promise.resolve({ data: [] as J[] }),
  ]);
  return { client: Object.fromEntries((cl ?? []).map((x) => [x.id, x.name])), lead: Object.fromEntries((ld ?? []).map((x) => [x.id, x])) };
}
const dueThis = (day: number) => todaySP().slice(0, 8) + String(day).padStart(2, "0");
function subStatus(s: J) {
  if (s.status === "canceled") return "Cancelada";
  if (s.status === "paused") return "Suspensa";
  const due = dueThis(s.due_day), today = todaySP();
  if (s.last_paid_on && s.last_paid_on >= monthStartSP()) return "Ativa · paga neste mês";
  if (s.started_on && s.started_on > due) return "Ativa · primeira cobrança no próximo mês";
  if (due < today) return "Vencida · sem pagamento registrado";
  return (Date.parse(due) - Date.parse(today)) / 86400000 <= 7 ? "Renovação próxima" : "Pagamento pendente";
}
const PROJECT_STATUS: J = { briefing: "Planejamento", criacao: "Em andamento", aprovacao: "Aguardando aprovação do cliente", ajustes: "Revisão", entregue: "Concluído" };

// ---------- ferramentas de leitura ----------
async function getLeads(ctx: Ctx, i: J) {
  const st = await stages(ctx), open = st.filter((s) => s.kind === "open").map((s) => s.id), stale = Number((ctx.s.monitoring as J).stale_days ?? 7);
  let q = admin.from("leads").select("id, name, interest, source, value_cents, next_follow_up, owner_id, stage_id, created_at, updated_at, paid_at, lost_reason, utm", { count: "exact" }).eq("tenant_id", ctx.tenant).is("deleted_at", null);
  const f = String(i.filter);
  if (["hot", "stale", "no_owner", "no_followup", "followup_late"].includes(f)) q = q.in("stage_id", open);
  if (f === "hot") {
    const { data: cv } = await admin.from("ai_conversations").select("lead_id").eq("tenant_id", ctx.tenant).eq("is_test", false).in("qualification", ["hot", "qualified"]).not("lead_id", "is", null);
    const ids = [...new Set((cv ?? []).map((c) => c.lead_id))];
    if (!ids.length) return { total: 0, leads: [], nota: "Nenhum lead está marcado como quente ou qualificado pelo AI Sales." };
    q = q.in("id", ids);
  }
  if (f === "stale") q = q.lt("updated_at", new Date(Date.now() - stale * 86400000).toISOString());
  if (f === "no_owner") q = q.is("owner_id", null);
  if (f === "no_followup") q = q.is("next_follow_up", null);
  if (f === "followup_late") q = q.lt("next_follow_up", new Date().toISOString());
  if (f === "negotiation") q = q.in("stage_id", st.filter((s) => s.position === 3 || s.position === 4).map((s) => s.id));
  if (f === "won") q = q.in("stage_id", st.filter((s) => s.kind === "won").map((s) => s.id));
  if (f === "lost") q = q.in("stage_id", st.filter((s) => s.kind === "lost").map((s) => s.id));
  if (i.search) q = q.ilike("name", `%${String(i.search).replace(/[%_]/g, " ")}%`);
  const { data, count, error } = await q.order("updated_at", { ascending: false }).limit(Number(i.limit ?? 20));
  if (error) return { error: "A consulta de leads falhou." };
  const ids = (data ?? []).map((l) => l.id);
  const { data: cv } = ids.length ? await admin.from("ai_conversations").select("lead_id, qualification, score, summary").in("lead_id", ids).eq("is_test", false) : { data: [] as J[] };
  const conv = Object.fromEntries((cv ?? []).map((c) => [c.lead_id, c]));
  return {
    total: count ?? 0, mostrando: (data ?? []).length, filtro: f, ...(f === "stale" ? { regra: `sem atualização há mais de ${stale} dias` } : {}),
    leads: await Promise.all((data ?? []).map(async (l) => ({
      id: l.id, nome: l.name, etapa: st.find((s) => s.id === l.stage_id)?.name ?? "?", valor: l.value_cents ? C.money(l.value_cents) : "sem valor", responsavel: await emailOf(ctx, l.owner_id),
      origem: l.source, nicho: l.utm?.segmento ?? null, interesse: l.interest, proximo_followup: l.next_follow_up, atualizado_em: l.updated_at, criado_em: l.created_at, pago_em: l.paid_at,
      motivo_perda: l.lost_reason, ia: conv[l.id] ? { qualificacao: conv[l.id].qualification, nota: conv[l.id].score, resumo: conv[l.id].summary } : null,
    }))),
  };
}
async function getLeadDetails(ctx: Ctx, i: J) {
  const l = await exists(ctx, "lead", i.lead_id);
  if (!l) return { error: "Lead não encontrado." };
  const [st, acts, props, chs, cv, disp] = await Promise.all([
    stages(ctx),
    admin.from("activities").select("kind, body, created_at").eq("lead_id", l.id).order("created_at", { ascending: false }).limit(12),
    admin.from("proposals").select("title, total_cents, status, created_at, accepted_at").eq("lead_id", l.id).is("deleted_at", null),
    admin.from("charges").select("description, amount_cents, status, due_date, paid_at").eq("lead_id", l.id).is("deleted_at", null),
    admin.from("ai_conversations").select("id, status, qualification, score, probability, summary, next_action, opted_out, last_inbound_at, last_outbound_at").eq("lead_id", l.id).eq("is_test", false).maybeSingle(),
    admin.from("agent_dispatches").select("id, task_type, status, result, created_at").eq("lead_id", l.id).order("created_at", { ascending: false }).limit(5),
  ]);
  const mem = cv.data ? (await admin.from("ai_memory").select("profile, objections, facts").eq("conversation_id", cv.data.id).maybeSingle()).data : null;
  return {
    lead: { id: l.id, nome: l.name, etapa: st.find((s) => s.id === l.stage_id)?.name, valor: l.value_cents ? C.money(l.value_cents) : "sem valor", responsavel: await emailOf(ctx, l.owner_id), origem: l.source,
      nicho: l.utm?.segmento ?? null, interesse: l.interest, proximo_followup: l.next_follow_up, criado_em: l.created_at, atualizado_em: l.updated_at, pago_em: l.paid_at, tem_telefone: !!l.phone, tem_email: !!l.email },
    historico: acts.data ?? [], propostas: (props.data ?? []).map((p) => ({ ...p, total: C.money(p.total_cents) })),
    cobrancas: (chs.data ?? []).map((c) => ({ ...c, valor: C.money(c.amount_cents) })),
    conversa_ai_sales: cv.data ? { ...cv.data, memoria: mem } : "sem conversa no AI Sales", despachos: disp.data ?? [],
  };
}
async function getPayments(ctx: Ctx, i: J) {
  let q = admin.from("charges").select("id, description, amount_cents, due_date, status, paid_at, method, checkout_url, delinquent_confirmed_at, client_id, lead_id", { count: "exact" }).eq("tenant_id", ctx.tenant).is("deleted_at", null);
  if (i.status === "paid") q = q.eq("status", "paid").order("paid_at", { ascending: false });
  else { q = q.eq("status", "pending").order("due_date"); if (i.status === "overdue") q = q.lt("due_date", todaySP()); }
  const { data, count } = await q.limit(Number(i.limit ?? 20));
  const n = await names(ctx, data ?? []), today = todaySP();
  return {
    total: count ?? 0, soma_listada: C.money((data ?? []).reduce((a, c) => a + Number(c.amount_cents), 0)),
    aviso: i.status === "paid" ? "Pagas = pagamento confirmado no sistema." : "Pendente não é pago. Vencida não é inadimplência confirmada.",
    cobrancas: (data ?? []).map((c) => ({ id: c.id, descricao: c.description, valor: C.money(c.amount_cents), vencimento: c.due_date, cliente: n.client[c.client_id] ?? n.lead[c.lead_id]?.name ?? "sem cliente",
      situacao: c.status === "paid" ? `paga em ${String(c.paid_at).slice(0, 10)}` : c.due_date < today ? "vencida, sem pagamento registrado" : "a vencer",
      link_enviado: !!c.checkout_url, inadimplencia_confirmada: !!c.delinquent_confirmed_at })),
  };
}
async function getSubscriptions(ctx: Ctx, i: J) {
  const { data } = await admin.from("subscriptions").select("id, name, amount_cents, due_day, status, started_on, last_paid_on, client_id").eq("tenant_id", ctx.tenant);
  const n = await names(ctx, data ?? []), today = todaySP();
  let rows = (data ?? []).map((s) => ({ ...s, situacao: subStatus(s), vence_em: dueThis(s.due_day) }));
  if (i.filter === "upcoming") rows = rows.filter((s) => s.situacao === "Renovação próxima");
  if (i.filter === "overdue") rows = rows.filter((s) => s.situacao.startsWith("Vencida"));
  if (["active", "paused", "canceled"].includes(i.filter)) rows = rows.filter((s) => s.status === i.filter);
  const ids = rows.map((s) => s.id);
  const { data: hist } = ids.length ? await admin.from("charges").select("subscription_id, amount_cents, status, paid_at, due_date").in("subscription_id", ids).is("deleted_at", null).order("due_date", { ascending: false }).limit(60) : { data: [] as J[] };
  return {
    total: rows.length, hoje: today, frequencia: "mensal",
    assinaturas: rows.map((s) => ({ id: s.id, plano: s.name, cliente: n.client[s.client_id] ?? "sem cliente", valor: C.money(s.amount_cents), dia_vencimento: s.due_day, vence_neste_mes: s.vence_em,
      situacao: s.situacao, ultimo_pagamento: s.last_paid_on, historico: (hist ?? []).filter((h) => h.subscription_id === s.id).slice(0, 6).map((h) => ({ vencimento: h.due_date, status: h.status, pago_em: h.paid_at })) })),
  };
}
async function getProjects(ctx: Ctx, i: J) {
  const { data } = await admin.from("projects").select("id, title, stage, kind, due_date, started_at, delivered_at, assigned_to, value_cents, notes, client_id, lead_id, created_at, updated_at").eq("tenant_id", ctx.tenant).order("due_date", { nullsFirst: false });
  const n = await names(ctx, data ?? []), today = todaySP(), soon = new Date(Date.now() - SP + 3 * 86400000).toISOString().slice(0, 10);
  const ids = (data ?? []).map((p) => p.id);
  const { data: files } = ids.length ? await admin.from("files").select("project_id").in("project_id", ids) : { data: [] as J[] };
  let rows = data ?? [];
  const f = String(i.filter);
  if (f !== "all" && f !== "delivered") rows = rows.filter((p) => p.stage !== "entregue");
  if (f === "late") rows = rows.filter((p) => p.due_date && p.due_date < today);
  if (f === "due_soon") rows = rows.filter((p) => p.due_date && p.due_date >= today && p.due_date <= soon);
  if (f === "waiting_approval") rows = rows.filter((p) => p.stage === "aprovacao");
  if (f === "no_owner") rows = rows.filter((p) => !p.assigned_to);
  if (f === "no_due") rows = rows.filter((p) => !p.due_date);
  if (f === "crm") rows = rows.filter((p) => p.kind === "crm" || /crm/i.test(p.title));
  if (f === "delivered") rows = rows.filter((p) => p.stage === "entregue");
  const order = ["briefing", "criacao", "aprovacao", "ajustes", "entregue"];
  return {
    total: rows.length,
    projetos: await Promise.all(rows.slice(0, 40).map(async (p) => ({
      id: p.id, titulo: p.title, servico: p.kind ?? "não informado", cliente: n.client[p.client_id] ?? n.lead[p.lead_id]?.name ?? "sem cliente", venda_em: n.lead[p.lead_id]?.paid_at ?? null,
      inicio: p.started_at, prazo: p.due_date ?? "sem prazo", responsavel: await emailOf(ctx, p.assigned_to), status: p.stage !== "entregue" && p.due_date && p.due_date < today ? "Atrasado" : PROJECT_STATUS[p.stage],
      progresso: `${order.indexOf(p.stage) + 1}/5 etapas`, arquivos_de_entrega: (files ?? []).filter((x) => x.project_id === p.id).length, entregue_em: p.delivered_at, atualizado_em: p.updated_at,
    }))),
  };
}
async function getTasks(ctx: Ctx, i: J) {
  let q = admin.from("tasks").select("id, title, description, category, priority, status, origin, due_at, assignee_id, related_kind, related_id, result, created_at", { count: "exact" }).eq("tenant_id", ctx.tenant);
  const s = String(i.status ?? "open");
  if (s === "open" || s === "overdue") q = q.in("status", ["pending", "in_progress", "awaiting_approval"]);
  if (s === "overdue") q = q.lt("due_at", new Date().toISOString());
  if (s === "awaiting_approval") q = q.eq("status", "awaiting_approval");
  if (s === "completed") q = q.eq("status", "completed");
  if (i.assignee_id) q = q.eq("assignee_id", i.assignee_id);
  const { data, count } = await q.order("due_at", { nullsFirst: false }).limit(Number(i.limit ?? 20));
  const now = Date.now();
  return { total: count ?? 0, tarefas: await Promise.all((data ?? []).map(async (t) => ({ ...t, responsavel: await emailOf(ctx, t.assignee_id), atrasada: ["pending", "in_progress"].includes(t.status) && t.due_at && Date.parse(t.due_at) < now })) ) };
}
async function getAlerts(ctx: Ctx, i: J) {
  let q = admin.from("commander_alerts").select("id, category, priority, title, description, recommendation, related_kind, related_id, assigned_to, due_at, status, first_seen, last_seen").eq("tenant_id", ctx.tenant).eq("status", String(i.status ?? "open"));
  if (i.category) q = q.eq("category", i.category);
  if (i.priority) q = q.eq("priority", i.priority);
  const { data } = await q.order("first_seen", { ascending: false }).limit(60);
  const rank: J = { critical: 0, high: 1, medium: 2, low: 3 };
  return { total: (data ?? []).length, alertas: (data ?? []).sort((a, b) => rank[a.priority] - rank[b.priority]).slice(0, 40) };
}
async function agentStatus(ctx: Ctx) {
  const [{ data: ids }, { data: sales }, { data: disp }, { data: audit }] = await Promise.all([
    admin.from("agent_identities").select("agent_id, name, department, status, animation_state").eq("tenant_id", ctx.tenant),
    admin.from("ai_settings").select("active, mode, model").eq("tenant_id", ctx.tenant).maybeSingle(),
    admin.from("agent_dispatches").select("status").eq("tenant_id", ctx.tenant).gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
    admin.from("commander_audits").select("started_at, findings, new_alerts, status").eq("tenant_id", ctx.tenant).order("started_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const by = (s: string) => (disp ?? []).filter((d) => d.status === s).length;
  return { agentes: ids ?? [], ai_sales: sales ? { ligado: sales.active, modo: sales.mode, modelo: sales.model } : "não configurado", despachos_30_dias: { total: (disp ?? []).length, concluidos: by("completed"), falharam: by("failed"), em_andamento: by("in_progress") + by("dispatched") + by("approved") + by("pending"), aguardando_humano: by("awaiting_human") }, ultima_auditoria: audit };
}
async function getDispatches(ctx: Ctx, i: J) {
  let q = admin.from("agent_dispatches").select("id, task_type, lead_id, subscription_id, objective, priority, status, result, attempts, created_at, updated_at").eq("tenant_id", ctx.tenant);
  if (i.status === "open") q = q.in("status", ["pending", "approved", "dispatched", "in_progress", "awaiting_human"]);
  if (i.status === "completed" || i.status === "failed") q = q.eq("status", i.status);
  const { data } = await q.order("created_at", { ascending: false }).limit(Number(i.limit ?? 20));
  const n = await names(ctx, data ?? []);
  return { total: (data ?? []).length, despachos: (data ?? []).map((d) => ({ ...d, lead: n.lead[d.lead_id]?.name ?? null })) };
}
async function runAudit(ctx: Ctx, trigger: "user" | "chat") {
  const { data, error } = await admin.rpc("commander_run_audit", { p_tenant: ctx.tenant, p_trigger: trigger });
  if (error) return { error: "A auditoria falhou: " + error.message.slice(0, 120) };
  await activity(ctx, "audit_request", "ok", { ref_kind: "audit", ref_id: data?.audit_id, detail: trigger === "chat" ? "Pedida no chat" : "Pedida no painel" });
  return { auditoria: data, principais: (await getAlerts(ctx, {})).alertas.slice(0, 15) };
}

// ---------- relatórios ----------
async function makeReport(ctx: Ctx, kind: string, month: string | undefined, useAi: boolean) {
  const r = C.reportRange(kind, month);
  const { data, error } = await admin.rpc("commander_report_data", { p_tenant: ctx.tenant, p_from: r.from.toISOString(), p_to: r.to.toISOString() });
  if (error || !data) return { error: "Não consegui juntar os dados do relatório." };
  let nar: C.Narrative = C.ruleNarrative(data), aiNote: string | null = null;
  if (useAi) {
    const calls: ChatResult[] = [];
    try {
      const p = await provider(ctx);
      const res = await p.chat({ system: [{ type: "text", text: C.systemStable(ctx.s, ctx.company) }], tools: [] as any, model: ctx.s.model, effort: ctx.s.effort, maxTokens: 8000,
        messages: [{ role: "user", content: `Relatório ${r.label}. Com base SOMENTE nos dados abaixo, escreva em ${ctx.s.language}: um resumo executivo (3 a 5 frases), até 5 oportunidades, até 5 recomendações estratégicas e até 5 prioridades para o próximo período. ` +
          `Não invente números: se faltar dado, diga que falta. Previsões são estimativas. Responda só com JSON no formato {"resumo":"...","oportunidades":["..."],"recomendacoes":["..."],"prioridades":["..."]}.\n\nDados:\n${C.asData(C.narrativeInput(data), 40000)}` }] });
      calls.push(res);
      const parsed = C.parseNarrative(res.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n"));
      if (parsed) nar = parsed; else aiNote = "A IA não devolveu o texto no formato esperado; usei o texto por regras.";
    } catch (e) { aiNote = friendlyAiError(e) + " Usei o texto por regras."; }
    await recordUsage(ctx, calls, "commander_report");
  }
  const sections = C.sectionsFor(kind, C.reportSections(data, nar));
  const { data: row, error: e2 } = await admin.from("commander_reports").insert({ tenant_id: ctx.tenant, kind, period_start: r.from.toISOString(), period_end: r.to.toISOString(),
    data: { ...data, sections, label: r.label, ai_note: aiNote }, narrative: JSON.stringify(nar), created_by: ctx.user }).select("id").single();
  if (e2) return { error: "Não consegui salvar o relatório." };
  await activity(ctx, "report", "ok", { ref_kind: "report", ref_id: row.id, detail: `${kind} · ${r.label}` });
  return { id: row.id, periodo: r.label, texto: nar.fonte, aviso: aiNote, secoes: sections };
}

// ---------- ações (as mesmas para o chat, para os botões do CRM e para aprovações) ----------
const DEFAULT_DUE = () => { const d = new Date(Date.now() - SP + 86400000); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12)).toISOString(); };
async function createTask(ctx: Ctx, i: J, origin: Origin) {
  if (i.assignee_id && !(await isMember(ctx, i.assignee_id))) return { error: "Essa pessoa não está na equipe. Confira com get_team." };
  if (i.related_id && !(await exists(ctx, String(i.related_kind ?? ""), i.related_id))) return { error: "O registro relacionado não existe nesta empresa." };
  const key = String(i.dedupe_key ?? C.taskKey(i));
  const row = { tenant_id: ctx.tenant, title: String(i.title).slice(0, 160), description: i.description ? String(i.description).slice(0, 1200) : null, category: i.category ?? "operations", priority: i.priority ?? "medium",
    status: "pending", origin, kind: "task", due_at: i.due_at ?? DEFAULT_DUE(), assignee_id: i.assignee_id ?? null, related_kind: i.related_kind ?? null, related_id: i.related_id ?? null,
    lead_id: i.related_kind === "lead" ? i.related_id : null, client_id: i.related_kind === "client" ? i.related_id : null, dedupe_key: key, remind_at: null };
  const { data, error } = await admin.from("tasks").insert(row).select("id").single();
  if (dbErr(error) === "duplicate") {
    const { data: old } = await admin.from("tasks").select("id, title, status").eq("tenant_id", ctx.tenant).eq("dedupe_key", key).in("status", ["pending", "in_progress", "awaiting_approval"]).maybeSingle();
    return { duplicada: true, tarefa_existente: old, nota: "Já existe uma tarefa aberta igual. Nada foi criado." };
  }
  if (error) return { error: "Não consegui criar a tarefa." };
  await activity(ctx, "task_created", "ok", { ref_kind: "task", ref_id: data.id, detail: row.title, data: { origin, priority: row.priority } });
  return { ok: true, tarefa_id: data.id };
}
async function updateTask(ctx: Ctx, i: J) {
  const t = await admin.from("tasks").select("id, title, status").eq("tenant_id", ctx.tenant).eq("id", String(i.task_id)).maybeSingle();
  if (!t.data) return { error: "Tarefa não encontrada." };
  if (i.assignee_id && !(await isMember(ctx, i.assignee_id))) return { error: "Essa pessoa não está na equipe." };
  const patch: J = {};
  for (const k of ["status", "result", "assignee_id", "due_at"]) if (i[k] !== undefined) patch[k] = i[k];
  if (!Object.keys(patch).length) return { error: "Nada para mudar." };
  const { error } = await admin.from("tasks").update(patch).eq("id", t.data.id);
  if (error) return { error: "Não consegui atualizar a tarefa." };
  await activity(ctx, "task_updated", "ok", { ref_kind: "task", ref_id: t.data.id, detail: t.data.title, data: patch });
  return { ok: true };
}
async function updateAlert(ctx: Ctx, i: J) {
  const { data: a } = await admin.from("commander_alerts").select("id, title, history, status").eq("tenant_id", ctx.tenant).eq("id", String(i.alert_id)).maybeSingle();
  if (!a) return { error: "Alerta não encontrado." };
  if (i.status === "assign") {
    if (i.assigned_to && !(await isMember(ctx, i.assigned_to))) return { error: "Essa pessoa não está na equipe." };
    await admin.from("commander_alerts").update({ assigned_to: i.assigned_to || null, history: [...(a.history ?? []), { at: new Date().toISOString(), to: "assigned", by: ctx.user }] }).eq("id", a.id);
    return { ok: true };
  }
  if (a.status !== "open") return { error: "Esse alerta já foi fechado." };
  await admin.from("commander_alerts").update({ status: i.status, resolved_at: new Date().toISOString(), resolved_by: ctx.user,
    history: [...(a.history ?? []), { at: new Date().toISOString(), to: i.status, by: ctx.user, note: String(i.note ?? "").slice(0, 300) }] }).eq("id", a.id);
  await activity(ctx, i.status === "resolved" ? "alert_resolved" : "alert_dismissed", "ok", { ref_kind: "alert", ref_id: a.id, detail: a.title });
  return { ok: true, nota: i.status === "resolved" ? "Se o problema continuar, a próxima auditoria abre o alerta de novo." : "Dispensado: não volta enquanto for o mesmo problema (30 dias)." };
}
async function updateRecord(ctx: Ctx, i: J) {
  const ch = (i.changes ?? {}) as J, reason = String(i.reason ?? "").slice(0, 300);
  if (i.kind === "lead") {
    const l = await exists(ctx, "lead", i.id);
    if (!l) return { error: "Lead não encontrado." };
    const patch: J = {}, said: string[] = [];
    if (ch.owner_id !== undefined) { if (ch.owner_id && !(await isMember(ctx, ch.owner_id))) return { error: "Responsável não está na equipe." }; patch.owner_id = ch.owner_id || null; said.push(`responsável: ${await emailOf(ctx, ch.owner_id || null) ?? "ninguém"}`); }
    if (ch.next_follow_up !== undefined) { if (ch.next_follow_up && Number.isNaN(Date.parse(String(ch.next_follow_up)))) return { error: "Data de follow-up inválida." }; patch.next_follow_up = ch.next_follow_up || null; said.push(`próximo follow-up: ${ch.next_follow_up || "nenhum"}`); }
    if (ch.stage !== undefined) {
      const st = (await stages(ctx)).find((s) => s.position === Number(ch.stage));
      if (!st) return { error: "Etapa inválida (1 a 6)." };
      if (st.kind === "won" && !l.paid_at) said.push("atenção: Fechado não registra pagamento");
      patch.stage_id = st.id; said.push(`etapa: ${st.name}`);
      if (st.kind === "lost") patch.lost_reason = String(ch.lost_reason ?? reason ?? "").slice(0, 200) || null;
    }
    if (!Object.keys(patch).length) return { error: "Nenhum campo permitido para mudar. Use owner_id, next_follow_up, stage ou lost_reason." };
    const { error } = await admin.from("leads").update(patch).eq("id", l.id);
    if (error) return { error: "Não consegui atualizar o lead." };
    await admin.from("activities").insert({ tenant_id: ctx.tenant, lead_id: l.id, actor_id: ctx.user, kind: patch.stage_id ? "stage" : "note", body: `AI Commander: ${said.join("; ")}. Motivo: ${reason || "-"}`, meta: { by: "AI Commander" } });
    await activity(ctx, "record_updated", "ok", { ref_kind: "lead", ref_id: l.id, detail: `${l.name}: ${said.join("; ")}` });
    return { ok: true, alterado: said };
  }
  if (i.kind === "project") {
    const p = await exists(ctx, "project", i.id);
    if (!p) return { error: "Projeto não encontrado." };
    const patch: J = {};
    if (ch.assigned_to !== undefined) { if (ch.assigned_to && !(await isMember(ctx, ch.assigned_to))) return { error: "Responsável não está na equipe." }; patch.assigned_to = ch.assigned_to || null; }
    if (ch.due_date !== undefined) { if (ch.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(String(ch.due_date))) return { error: "Prazo deve ser AAAA-MM-DD." }; patch.due_date = ch.due_date || null; }
    if (ch.kind !== undefined) { if (!["site", "crm", "automacao", "outro"].includes(String(ch.kind))) return { error: "Tipo inválido." }; patch.kind = ch.kind; }
    if (ch.stage !== undefined) {
      if (!["briefing", "criacao", "aprovacao", "ajustes", "entregue"].includes(String(ch.stage))) return { error: "Etapa inválida." };
      if (ch.stage === "entregue") {
        // Regra fixa: sem evidência no sistema, não há entrega.
        const { count } = await admin.from("files").select("id", { count: "exact", head: true }).eq("project_id", p.id);
        if (!count) return { error: "Sem evidência de entrega: anexe o arquivo ou o link entregue em Arquivos, ligado a este projeto, antes de marcar como entregue." };
        patch.delivered_at = new Date().toISOString();
      }
      patch.stage = ch.stage;
    }
    if (!Object.keys(patch).length) return { error: "Nenhum campo permitido para mudar. Use assigned_to, due_date, kind ou stage." };
    const { error } = await admin.from("projects").update(patch).eq("id", p.id);
    if (error) return { error: "Não consegui atualizar o projeto." };
    await activity(ctx, "record_updated", "ok", { ref_kind: "project", ref_id: p.id, detail: `${p.title}: ${Object.keys(patch).join(", ")}. Motivo: ${reason || "-"}`, data: patch });
    return { ok: true, alterado: Object.keys(patch) };
  }
  return { error: "Tipo de registro não permitido." };
}

// ---------- despacho para o AI Sales ----------
async function runDispatch(id: string) {
  const { data: s } = await admin.rpc("vault_get", { p_name: "interno" });
  try {
    await fetch(`${URL_}/functions/v1/ai-sales`, { method: "POST", headers: { "Content-Type": "application/json", "x-interno": String(s ?? "") }, body: JSON.stringify({ dispatch_id: id }) });
  } catch { /* a fila das 10 em 10 minutos tenta de novo */ }
  return (await admin.from("agent_dispatches").select("id, status, result").eq("id", id).single()).data;
}
async function dispatch(ctx: Ctx, i: J, approved: boolean) {
  if (!i.lead_id && !i.subscription_id) return { error: "Informe o lead ou a assinatura." };
  const lead = i.lead_id ? await exists(ctx, "lead", i.lead_id) : null, sub = i.subscription_id ? await exists(ctx, "subscription", i.subscription_id) : null;
  if (i.lead_id && !lead) return { error: "Lead não encontrado." };
  if (i.subscription_id && !sub) return { error: "Assinatura não encontrada." };
  const { data: ok } = await admin.rpc("ai_allowed", { p_tenant: ctx.tenant });
  const { data: sales } = await admin.from("ai_settings").select("active, mode").eq("tenant_id", ctx.tenant).maybeSingle();
  if (!ok || !sales) return { error: "O AI Sales não está configurado nesta empresa." };
  if (!sales.active) return { error: "O AI Sales está desligado. Ligue em AI Sales → Agente, ou faça o contato manualmente." };
  const { count } = await admin.from("agent_dispatches").select("id", { count: "exact", head: true }).eq("tenant_id", ctx.tenant).gte("created_at", new Date(Date.now() - 86400000).toISOString());
  if ((count ?? 0) >= ctx.s.limits.dispatch_per_day) return { error: `Limite de ${ctx.s.limits.dispatch_per_day} tarefas por dia para o AI Sales atingido.` };
  const key = C.dispatchKey(i);
  const row = { tenant_id: ctx.tenant, task_type: i.task_type, lead_id: lead?.id ?? null, subscription_id: sub?.id ?? null, client_id: sub?.client_id ?? lead?.client_id ?? null,
    context: i.context ?? null, objective: String(i.objective).slice(0, 600), priority: i.priority ?? "medium", deadline: i.deadline ?? null, restrictions: i.restrictions ?? null,
    approval_required: !approved, status: approved ? "approved" : "pending", dedupe_key: key, created_by: ctx.user };
  const { data: d, error } = await admin.from("agent_dispatches").insert(row).select("id").single();
  if (dbErr(error) === "duplicate") {
    const { data: old } = await admin.from("agent_dispatches").select("id, status, created_at").eq("tenant_id", ctx.tenant).eq("dedupe_key", key).in("status", ["pending", "approved", "dispatched", "in_progress", "awaiting_human"]).maybeSingle();
    return { duplicada: true, despacho_existente: old, nota: "Já existe uma tarefa igual em andamento para o AI Sales. Nada foi enviado." };
  }
  if (error) return { error: "Não consegui registrar a tarefa do AI Sales." };
  const target = lead?.name ?? sub?.name ?? "";
  if (!approved) {
    const { data: ap } = await admin.from("commander_approvals").insert({ tenant_id: ctx.tenant, action: "dispatch_sales", payload: { dispatch_id: d.id }, reason: row.objective, target_kind: lead ? "lead" : "subscription",
      target_id: lead?.id ?? sub?.id, changes: { tarefa: i.task_type, alvo: target, restricoes: row.restrictions }, consequences: "O AI Sales manda uma mensagem ao cliente pelo WhatsApp, respeitando o modo dele (simulação, desenvolvimento ou produção), a janela de 24 horas, o horário e o pedido de não contato.",
      agent: "commander", dedupe_key: `dispatch:${d.id}` }).select("id").single();
    await admin.from("agent_dispatches").update({ approval_id: ap?.id ?? null }).eq("id", d.id);
    await activity(ctx, "approval_requested", "ok", { ref_kind: "approval", ref_id: ap?.id, detail: `Acionar AI Sales: ${target}` });
    return { aguardando_aprovacao: true, despacho_id: d.id, aprovacao_id: ap?.id, nota: "Pedido de aprovação criado em AI Commander → Aprovações. Nada foi enviado ainda." };
  }
  await activity(ctx, "dispatch", "ok", { ref_kind: "dispatch", ref_id: d.id, detail: `${i.task_type}: ${target}` });
  const res = await runDispatch(d.id);
  return { despacho_id: d.id, status: res?.status, resultado: res?.result ?? null };
}
async function cancelDispatch(ctx: Ctx, id: string) {
  const { data } = await admin.from("agent_dispatches").update({ status: "cancelled", updated_at: new Date().toISOString(), result: { cancelled_by: ctx.user } }).eq("tenant_id", ctx.tenant).eq("id", id).in("status", ["pending", "approved"]).select("id, approval_id");
  if (!data?.length) return { error: "Só dá para cancelar tarefa que ainda não foi executada." };
  if (data[0].approval_id) await admin.from("commander_approvals").update({ status: "rejected", decided_by: ctx.user, decided_at: new Date().toISOString(), result: { motivo: "despacho cancelado" } }).eq("id", data[0].approval_id).eq("status", "pending");
  await activity(ctx, "dispatch_cancelled", "ok", { ref_kind: "dispatch", ref_id: id });
  return { ok: true };
}
async function retryDispatch(ctx: Ctx, id: string) {
  const { data } = await admin.from("agent_dispatches").update({ status: "approved", attempts: 0, locked_at: null, updated_at: new Date().toISOString() }).eq("tenant_id", ctx.tenant).eq("id", id).eq("status", "failed").select("id");
  if (!data?.length) return { error: "Só dá para reenviar tarefa que falhou." };
  await activity(ctx, "dispatch_retry", "ok", { ref_kind: "dispatch", ref_id: id });
  // A mensagem fica ligada ao despacho: se ela já tinha saído, o reenvio não manda de novo.
  return { ok: true, ...(await runDispatch(id)) };
}

// ---------- aprovações ----------
const CONSEQ: J = {
  register_payment: "A cobrança vira paga, entra no caixa e o lead passa a pagante. Use só com comprovante.", cancel_charge: "A cobrança deixa de valer e sai das pendências.",
  confirm_delinquency: "O cliente passa a contar como inadimplente confirmado nos indicadores.", issue_charge: "Uma nova cobrança será emitida pelo Financeiro.",
  change_amount: "O valor cobrado muda.", grant_discount: "O cliente paga menos.", change_terms: "As condições combinadas mudam.", refund: "Dinheiro volta ao cliente.",
};
async function requestApproval(ctx: Ctx, i: J) {
  const target = await exists(ctx, String(i.target_kind), i.target_id);
  if (!target) return { error: "O registro não existe nesta empresa." };
  if (["register_payment", "cancel_charge", "confirm_delinquency"].includes(i.action) && (i.target_kind !== "charge" || target.status !== "pending")) return { error: "Essa ação vale só para cobrança pendente." };
  if (i.action === "confirm_delinquency" && !(target.due_date < todaySP())) return { error: "A cobrança ainda não venceu." };
  const { data, error } = await admin.from("commander_approvals").insert({ tenant_id: ctx.tenant, action: i.action, payload: { ...i }, reason: String(i.reason).slice(0, 600), target_kind: i.target_kind, target_id: target.id,
    changes: i.changes ?? {}, consequences: String(i.consequences ?? CONSEQ[i.action] ?? "").slice(0, 600), agent: "commander", dedupe_key: C.approvalKey(i.action, target.id) }).select("id").single();
  if (dbErr(error) === "duplicate") return { duplicada: true, nota: "Já existe um pedido igual esperando aprovação." };
  if (error) return { error: "Não consegui registrar o pedido." };
  await activity(ctx, "approval_requested", "ok", { ref_kind: "approval", ref_id: data.id, detail: `${C.FIN_LABEL[i.action] ?? i.action}: ${target.description ?? target.name ?? target.title ?? ""}` });
  return { aguardando_aprovacao: true, aprovacao_id: data.id, nota: "Pedido criado em AI Commander → Aprovações. Nada foi executado." };
}
async function requestRecordApproval(ctx: Ctx, i: J, why: string) {
  const target = await exists(ctx, String(i.kind), i.id);
  if (!target) return { error: "O registro não existe nesta empresa." };
  const { data, error } = await admin.from("commander_approvals").insert({ tenant_id: ctx.tenant, action: "update_record", payload: i, reason: String(i.reason ?? why).slice(0, 600), target_kind: i.kind, target_id: target.id,
    changes: i.changes, consequences: why, agent: "commander", dedupe_key: C.approvalKey("update_record", target.id, JSON.stringify(i.changes)) }).select("id").single();
  if (dbErr(error) === "duplicate") return { duplicada: true, nota: "Já existe um pedido igual esperando aprovação." };
  if (error) return { error: "Não consegui registrar o pedido." };
  await activity(ctx, "approval_requested", "ok", { ref_kind: "approval", ref_id: data.id, detail: `Alterar ${i.kind}: ${target.name ?? target.title}` });
  return { aguardando_aprovacao: true, aprovacao_id: data.id, nota: `${why} Pedido criado em AI Commander → Aprovações.` };
}
async function decide(ctx: Ctx, id: string, approve: boolean, note: string) {
  // A troca de status é atômica: duas pessoas aprovando ao mesmo tempo não executam duas vezes.
  const now = new Date().toISOString();
  const { data: rows } = await admin.from("commander_approvals").update({ status: approve ? "approved" : "rejected", decided_by: ctx.user, decided_at: now }).eq("tenant_id", ctx.tenant).eq("id", id).eq("status", "pending").select("*");
  const a = rows?.[0];
  if (!a) return { error: "Esse pedido já foi decidido ou não existe." };
  const hist = (to: string, extra: J = {}) => [...(a.history ?? []), { at: new Date().toISOString(), to, by: ctx.user, ...extra }];
  if (!approve) {
    if (a.action === "dispatch_sales") await admin.from("agent_dispatches").update({ status: "cancelled", updated_at: now, result: { motivo: "aprovação recusada" } }).eq("id", a.payload?.dispatch_id).eq("status", "pending");
    await admin.from("commander_approvals").update({ history: hist("rejected", { note: note.slice(0, 300) }) }).eq("id", a.id);
    await activity(ctx, "approval_rejected", "ok", { ref_kind: "approval", ref_id: a.id, detail: C.FIN_LABEL[a.action] ?? a.action });
    return { ok: true };
  }
  if (Date.parse(a.requested_at) < Date.now() - 14 * 86400000) {
    await admin.from("commander_approvals").update({ status: "expired", history: hist("expired") }).eq("id", a.id);
    return { error: "Pedido com mais de 14 dias: expirou. Peça de novo se ainda fizer sentido." };
  }
  await activity(ctx, "approval_granted", "ok", { ref_kind: "approval", ref_id: a.id, detail: C.FIN_LABEL[a.action] ?? a.action });
  let result: J;
  try {
    if (a.action === "dispatch_sales") {
      const { data: d } = await admin.from("agent_dispatches").update({ status: "approved", updated_at: now }).eq("id", a.payload?.dispatch_id).eq("status", "pending").select("id");
      result = d?.length ? { despacho: await runDispatch(d[0].id) } : { error: "A tarefa do AI Sales não está mais pendente." };
    } else if (a.action === "update_record") result = await updateRecord(ctx, a.payload ?? {});
    else if (a.action === "register_payment") {
      const c = await exists(ctx, "charge", a.target_id);
      if (!c || c.status !== "pending") result = { error: "A cobrança não está mais pendente." };
      else {
        const { error } = await admin.rpc("confirm_payment", { p_charge: c.id, p_paid_cents: Number(c.amount_cents), p_method: String(a.changes?.method ?? "manual"), p_tx: `manual:commander:${a.id}` });
        result = error ? { error: "O registro do pagamento falhou: " + error.message.slice(0, 120) } : { ok: true, nota: "Pagamento registrado pelo fluxo normal do Financeiro." };
      }
    } else if (a.action === "cancel_charge") {
      const { data } = await admin.from("charges").update({ status: "canceled" }).eq("tenant_id", ctx.tenant).eq("id", a.target_id).eq("status", "pending").select("id");
      result = data?.length ? { ok: true } : { error: "A cobrança não está mais pendente." };
    } else if (a.action === "confirm_delinquency") {
      const { data } = await admin.from("charges").update({ delinquent_confirmed_at: now, delinquent_confirmed_by: ctx.user }).eq("tenant_id", ctx.tenant).eq("id", a.target_id).eq("status", "pending").select("id");
      result = data?.length ? { ok: true } : { error: "A cobrança não está mais pendente." };
    } else {
      // Sem caminho automático seguro no CRM: vira tarefa para uma pessoa fazer no Financeiro, já aprovada.
      result = await createTask(ctx, { title: `${C.FIN_LABEL[a.action] ?? a.action} (aprovado)`, description: `${a.reason}\nAlterações: ${JSON.stringify(a.changes ?? {})}`, category: "finance", priority: "high",
        related_kind: a.target_kind, related_id: a.target_id, dedupe_key: `approval:${a.id}` }, "commander");
      result.nota = "Aprovado. Esta operação é feita por uma pessoa no Financeiro: criei a tarefa.";
    }
  } catch (e) { result = { error: e instanceof Error ? e.message : "falhou" }; }
  const failed = !!result.error;
  await admin.from("commander_approvals").update({ status: failed ? "failed" : "executed", result: C.safeLog(result), history: hist(failed ? "failed" : "executed") }).eq("id", a.id);
  await activity(ctx, "approval_executed", failed ? "failed" : "ok", { ref_kind: "approval", ref_id: a.id, detail: failed ? String(result.error) : C.FIN_LABEL[a.action] ?? a.action });
  return failed ? { error: result.error } : { ok: true, result };
}

// ---------- chat ----------
const READ: Record<string, (ctx: Ctx, i: J) => Promise<J>> = {
  get_crm_overview: async (ctx, i) => { const r = C.periodRange(i.period); const { data } = await admin.rpc("commander_snapshot", { p_tenant: ctx.tenant, p_from: r.from.toISOString(), p_to: r.to.toISOString() }); return { periodo: r.label, indicadores: data, valores_em: "centavos" }; },
  get_leads: getLeads, get_lead_details: getLeadDetails,
  get_sales_metrics: async (ctx, i) => { const r = C.periodRange(i.period ?? "last_90_days"); const { data } = await admin.rpc("commander_intel", { p_tenant: ctx.tenant, p_from: r.from.toISOString(), p_to: r.to.toISOString() }); return { periodo: r.label, dados: data, valores_em: "centavos" }; },
  get_payments: getPayments, get_subscriptions: getSubscriptions, get_delivery_projects: getProjects,
  get_clients: async (ctx, i) => { let q = admin.from("clients").select("id, name, email, created_at", { count: "exact" }).eq("tenant_id", ctx.tenant); if (i.search) q = q.ilike("name", `%${String(i.search).replace(/[%_]/g, " ")}%`); const { data, count } = await q.order("name").limit(Number(i.limit ?? 20)); return { total: count ?? 0, clientes: data ?? [] }; },
  get_tasks: getTasks, get_alerts: getAlerts, get_team: async (ctx) => ({ equipe: await team(ctx) }), get_agent_status: (ctx) => agentStatus(ctx), get_dispatches: getDispatches,
  run_audit: (ctx) => runAudit(ctx, "chat"), generate_report: (ctx, i) => makeReport(ctx, String(i.kind), i.month, false),
};
const WRITE: Record<string, (ctx: Ctx, i: J) => Promise<J>> = {
  create_commander_task: (ctx, i) => createTask(ctx, i, "commander"), update_task: updateTask, update_alert: updateAlert, update_authorized_record: updateRecord,
  dispatch_agent_task: (ctx, i) => dispatch(ctx, i, true), cancel_dispatch: (ctx, i) => cancelDispatch(ctx, String(i.dispatch_id)), request_approval: requestApproval,
};
async function chat(ctx: Ctx, text: string) {
  const since = new Date(Date.now() - 86400000).toISOString();
  const { data: last } = await admin.from("commander_chat").select("content, created_at").eq("tenant_id", ctx.tenant).eq("user_id", ctx.user).eq("role", "user").order("id", { ascending: false }).limit(1).maybeSingle();
  if (last && last.content === text && Date.now() - Date.parse(last.created_at) < 15000) return { error: "Mensagem repetida: aguarde a resposta anterior." };
  const { count } = await admin.from("commander_chat").select("id", { count: "exact", head: true }).eq("tenant_id", ctx.tenant).eq("user_id", ctx.user).eq("role", "user").gte("created_at", since);
  if ((count ?? 0) >= ctx.s.limits.chat_per_day) return { error: `Limite de ${ctx.s.limits.chat_per_day} mensagens por dia atingido. Ajuste em Configurações.` };
  const cost = await monthCost(ctx);
  if (cost >= ctx.s.limits.monthly_usd) return { error: `Teto de custo de IA do Commander neste mês atingido (US$ ${cost.toFixed(2)}). Ajuste em Configurações.` };
  let p: Provider;
  try { p = await provider(ctx); } catch (e) { return { error: friendlyAiError(e) }; }
  await admin.from("commander_chat").insert({ tenant_id: ctx.tenant, user_id: ctx.user, role: "user", content: text });
  const { data: hist } = await admin.from("commander_chat").select("role, content").eq("tenant_id", ctx.tenant).eq("user_id", ctx.user).order("id", { ascending: false }).limit(20);
  const messages: { role: string; content: string }[] = [];
  for (const m of (hist ?? []).reverse()) { const prev = messages[messages.length - 1]; if (prev && prev.role === m.role) prev.content += "\n\n" + m.content; else messages.push({ role: m.role, content: m.content }); }
  while (messages.length && messages[0].role !== "user") messages.shift();
  const base = {
    system: [{ type: "text", text: C.systemStable(ctx.s, ctx.company), cache_control: { type: "ephemeral" } }, { type: "text", text: C.systemDynamic(ctx.s) }],
    tools: C.apiTools(), model: ctx.s.model, effort: ctx.s.effort, maxTokens: 16000,
  };
  const exec = async (name: string, raw: unknown): Promise<C.ExecResult> => {
    const v = C.validate(name, raw);
    if (!v.ok) return { content: v.error, isError: true };
    const pol = C.policy(name, ctx.s, v.input);
    if (pol.decision === "deny") { await activity(ctx, "tool_denied", "denied", { detail: `${name}: ${pol.reason}` }); return { content: "Não permitido: " + pol.reason, isError: true, mode: "deny" }; }
    let r: J;
    if (pol.decision === "approval") r = name === "dispatch_agent_task" ? await dispatch(ctx, v.input, false) : await requestRecordApproval(ctx, v.input, String(pol.reason));
    else r = await (READ[name] ?? WRITE[name])(ctx, v.input);
    if (READ[name]) await activity(ctx, "query", r.error ? "failed" : "ok", { detail: name, data: v.input });
    return { content: C.asData(r), isError: !!r.error, mode: pol.decision };
  };
  await setState(ctx, "thinking");
  let out: C.LoopOut;
  try { out = await C.toolLoop(p, base, messages, exec, 8); }
  catch (e) { const msg = friendlyAiError(e); await activity(ctx, "chat", "failed", { detail: msg }); await setState(ctx, "error"); return { error: msg }; }
  await recordUsage(ctx, out.calls, "commander_chat");
  const reply = out.text || (out.stop === "refusal" ? "Não posso ajudar com esse pedido." : out.stop === "max_iter" ? "A análise ficou longa demais para uma resposta só. Peça uma parte de cada vez." : "Não consegui montar uma resposta. Tente reformular.");
  await admin.from("commander_chat").insert({ tenant_id: ctx.tenant, user_id: ctx.user, role: "assistant", content: reply, tools: out.tools });
  await activity(ctx, "chat", "ok", { detail: out.tools.length ? "Ferramentas: " + out.tools.map((t) => t.name + (t.mode && t.mode !== "execute" ? ` (${t.mode})` : "")).join(", ") : "Resposta direta" });
  await setState(ctx, out.tools.some((t) => t.mode === "approval") ? "waiting" : "idle");
  return { reply, tools: out.tools };
}

// ---------- configurações ----------
const MODELS = ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"];
const clampInt = (v: unknown, lo: number, hi: number, d: number) => (Number.isFinite(Number(v)) ? Math.max(lo, Math.min(hi, Math.round(Number(v)))) : d);
async function save(ctx: Ctx, sec: string, d: J) {
  const patch: J = { updated_at: new Date().toISOString(), updated_by: ctx.user };
  if (["autonomy", "permissions", "limits"].includes(sec) && ctx.role !== "owner") return { error: "Só o dono muda autonomia, permissões e limites." };
  if (sec === "identity") {
    for (const k of ["name", "description", "personality", "tone", "language", "instructions"]) if (d[k] !== undefined) patch[k] = String(d[k]).slice(0, k === "instructions" ? 4000 : 300);
  } else if (sec === "autonomy") { if (!["analysis", "assisted", "controlled"].includes(d.autonomy)) return { error: "Modo inválido." }; patch.autonomy = d.autonomy; }
  else if (sec === "permissions") patch.permissions = Object.fromEntries(C.PERMS.map((k) => [k, d[k] !== false]));
  else if (sec === "monitoring") {
    const m = ctx.s.monitoring as J, cats = ["sales", "finance", "delivery", "subscription", "operations", "ai"];
    patch.monitoring = { ...m, enabled: d.enabled !== false, notify: d.notify !== false, interval_minutes: clampInt(d.interval_minutes, 15, 1440, 60),
      categories: Array.isArray(d.categories) ? d.categories.filter((c: string) => cats.includes(c)) : m.categories, stale_days: clampInt(d.stale_days, 1, 90, 7), hot_hours: clampInt(d.hot_hours, 1, 168, 24),
      proposal_days: clampInt(d.proposal_days, 1, 60, 5), project_warning_days: clampInt(d.project_warning_days, 1, 30, 3), approval_days: clampInt(d.approval_days, 1, 60, 5), auto_dispatch: false };
  } else if (sec === "ai") {
    if (d.provider && d.provider !== "anthropic") return { error: "Só o Claude está disponível como provedor." };
    if (d.model && !MODELS.includes(d.model)) return { error: "Modelo não disponível." };
    patch.provider = "anthropic"; patch.model = d.model ?? ctx.s.model; patch.effort = ["low", "medium", "high"].includes(d.effort) ? d.effort : ctx.s.effort;
  } else if (sec === "limits") patch.limits = { monthly_usd: clampInt(d.monthly_usd, 0, 1000, 20), chat_per_day: clampInt(d.chat_per_day, 1, 2000, 200), dispatch_per_day: clampInt(d.dispatch_per_day, 0, 500, 20) };
  else return { error: "Seção inválida." };
  const { error } = await admin.from("commander_settings").update(patch).eq("tenant_id", ctx.tenant);
  if (error) return { error: "Não deu para salvar." };
  await activity(ctx, "settings", "ok", { detail: `Configuração "${sec}" alterada`, data: patch });
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  let b: J; try { b = await req.json(); } catch { return json({ error: "Corpo inválido." }, 400); }
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { data: u } = await admin.auth.getUser(jwt);
  if (!u?.user) return json({ error: "Entre no CRM." }, 401);
  const c = await context(String(b.tenant_id ?? ""), u.user.id);
  if ("error" in c) return json({ error: c.error }, c.status);
  const ctx = c, id = String(b.id ?? "");
  try {
    switch (b.action) {
      case "status": {
        const [cost, keys] = await Promise.all([monthCost(ctx), admin.rpc("ai_secret_list", { p_tenant: ctx.tenant })]);
        return json({ enabled: true, role: ctx.role, settings: ctx.s, month_cost: cost, has_ai_key: !!(keys.data as J)?.anthropic_api_key, team: await team(ctx), models: MODELS });
      }
      case "chat": { const t = String(b.text ?? "").trim().slice(0, 4000); if (!t) return json({ error: "Escreva a pergunta." }, 400); const r = await chat(ctx, t); return json(r, r.error ? 400 : 200); }
      case "chatClear": await admin.from("commander_chat").delete().eq("tenant_id", ctx.tenant).eq("user_id", ctx.user); return json({ ok: true });
      case "audit": return json(await runAudit(ctx, "user"));
      case "report": { const r = await makeReport(ctx, String(b.kind ?? "monthly"), b.month ? String(b.month) : undefined, b.ai !== false); return json(r, r.error ? 400 : 200); }
      case "alert": { const v = ["resolved", "dismissed", "assign"].includes(b.status) ? b.status : null; if (!v) return json({ error: "Status inválido." }, 400); return json(await updateAlert(ctx, { alert_id: id, status: v, note: b.note, assigned_to: b.assigned_to })); }
      case "taskCreate": { const v = C.validate("create_commander_task", b.task); if (!v.ok) return json({ error: v.error }, 400); return json(await createTask(ctx, v.input, "user")); }
      case "taskUpdate": { const v = C.validate("update_task", { ...(b.task ?? {}), task_id: id }); if (!v.ok) return json({ error: v.error }, 400); return json(await updateTask(ctx, v.input)); }
      case "record": { const v = C.validate("update_authorized_record", b.record); if (!v.ok) return json({ error: v.error }, 400); return json(await updateRecord(ctx, v.input)); }
      case "dispatch": { const v = C.validate("dispatch_agent_task", b.dispatch); if (!v.ok) return json({ error: v.error }, 400); return json(await dispatch(ctx, v.input, true)); }
      case "dispatchCancel": return json(await cancelDispatch(ctx, id));
      case "dispatchRetry": return json(await retryDispatch(ctx, id));
      case "approve": return json(await decide(ctx, id, true, ""));
      case "reject": return json(await decide(ctx, id, false, String(b.note ?? "")));
      case "delinquency": {
        const ch = await exists(ctx, "charge", id);
        if (!ch || ch.status !== "pending") return json({ error: "Vale só para cobrança pendente." }, 400);
        if (b.confirm && !(ch.due_date < todaySP())) return json({ error: "A cobrança ainda não venceu." }, 400);
        await admin.from("charges").update(b.confirm ? { delinquent_confirmed_at: new Date().toISOString(), delinquent_confirmed_by: ctx.user } : { delinquent_confirmed_at: null, delinquent_confirmed_by: null }).eq("id", ch.id);
        await activity(ctx, b.confirm ? "delinquency_confirmed" : "delinquency_cleared", "ok", { ref_kind: "charge", ref_id: ch.id, detail: ch.description });
        return json({ ok: true });
      }
      case "save": return json(await save(ctx, String(b.section ?? ""), (b.data ?? {}) as J));
      case "identity": {
        const d = (b.data ?? {}) as J, patch: J = { updated_at: new Date().toISOString() };
        for (const k of ["name", "department", "description", "personality", "role", "pet_id", "avatar"]) if (d[k] !== undefined) patch[k] = String(d[k]).slice(0, k === "description" ? 400 : 120) || null;
        if (d.status !== undefined) { if (!["active", "paused", "disabled"].includes(d.status)) return json({ error: "Status inválido." }, 400); patch.status = d.status; }
        const { data } = await admin.from("agent_identities").update(patch).eq("tenant_id", ctx.tenant).eq("agent_id", id).select("agent_id");
        if (!data?.length) return json({ error: "Agente não encontrado." }, 404);
        await activity(ctx, "identity", "ok", { detail: `Identidade de ${id} alterada`, data: patch });
        return json({ ok: true });
      }
      case "testProvider": {
        try {
          const res = await (await provider(ctx)).chat({ system: [{ type: "text", text: "Responda só com a palavra ok." }], messages: [{ role: "user", content: "teste" }], tools: [] as any, model: ctx.s.model, effort: "low", maxTokens: 2000 });
          await recordUsage(ctx, [res], "commander_test");
          return json({ ok: true, model: res.model });
        } catch (e) { return json({ error: friendlyAiError(e) }, 400); }
      }
      default: return json({ error: "Ação desconhecida." }, 400);
    }
  } catch (e) {
    await activity(ctx, String(b.action ?? "acao"), "failed", { detail: e instanceof Error ? e.message : "erro" });
    return json({ error: "Não deu certo. Tente de novo." }, 500);
  }
});
