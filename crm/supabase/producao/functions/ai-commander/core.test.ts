// Rodar: node --test crm/supabase/producao/functions/ai-commander/core.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "./core.ts";

const S = (o: Record<string, unknown> = {}) => C.normalizeSettings(o);
const ID = "3f1c2b8e-1d2a-4c3b-9e8f-0a1b2c3d4e5f";

test("configurações: padrão seguro e permissões desligáveis", () => {
  const s = S();
  assert.equal(s.autonomy, "assisted");
  assert.equal(s.permissions.dispatch_sales, true);
  assert.equal(S({ autonomy: "tudo" }).autonomy, "assisted");
  assert.equal(S({ permissions: { dispatch_sales: false } }).permissions.dispatch_sales, false);
  assert.equal(S({ limits: { monthly_usd: -5 } }).limits.monthly_usd, 20);
});

test("validação: campos obrigatórios, enums, ids e datas", () => {
  assert.equal(C.validate("nao_existe", {}).ok, false);
  assert.equal(C.validate("get_leads", {}).ok, false);
  assert.equal(C.validate("get_leads", { filter: "qualquer" }).ok, false);
  const ok = C.validate("get_leads", { filter: "hot", limit: 999 });
  assert.ok(ok.ok && ok.input.limit === 50);
  assert.equal(C.validate("get_lead_details", { lead_id: "1; drop table leads" }).ok, false);
  assert.equal(C.validate("create_commander_task", { title: "x", category: "sales", priority: "high", due_at: "amanhã" }).ok, false);
  const t = C.validate("create_commander_task", { title: "Ligar", category: "sales", priority: "high", extra: "ignorado" });
  assert.ok(t.ok && !("extra" in t.input));
  assert.equal(C.validate("update_authorized_record", { kind: "lead", id: ID, changes: [], reason: "x" }).ok, false);
});

test("autonomia: somente análise não executa nada", () => {
  const s = S({ autonomy: "analysis" });
  assert.equal(C.policy("get_crm_overview", s).decision, "execute");
  assert.equal(C.policy("run_audit", s).decision, "execute");
  assert.equal(C.policy("request_approval", s).decision, "execute");
  for (const n of ["create_commander_task", "update_task", "update_alert", "update_authorized_record", "dispatch_agent_task"]) assert.equal(C.policy(n, s).decision, "deny", n);
});

test("autonomia: assistido pede aprovação para registros e AI Sales", () => {
  const s = S({ autonomy: "assisted" });
  assert.equal(C.policy("create_commander_task", s).decision, "execute");
  assert.equal(C.policy("dispatch_agent_task", s).decision, "approval");
  assert.equal(C.policy("update_authorized_record", s, { kind: "project", changes: { due_date: "2026-12-01" } }).decision, "approval");
});

test("autonomia: controlada executa, mas fechar ou perder venda sempre pede aprovação", () => {
  const s = S({ autonomy: "controlled" });
  assert.equal(C.policy("dispatch_agent_task", s).decision, "execute");
  assert.equal(C.policy("update_authorized_record", s, { kind: "lead", changes: { owner_id: ID } }).decision, "execute");
  assert.equal(C.policy("update_authorized_record", s, { kind: "lead", changes: { stage: 5 } }).decision, "approval");
  assert.equal(C.policy("update_authorized_record", s, { kind: "lead", changes: { stage: "6" } }).decision, "approval");
});

test("permissão desligada vence qualquer modo", () => {
  const s = S({ autonomy: "controlled", permissions: { dispatch_sales: false, read_charges: false } });
  assert.equal(C.policy("dispatch_agent_task", s).decision, "deny");
  assert.equal(C.policy("get_payments", s).decision, "deny");
  assert.match(String(C.policy("get_payments", s).reason), /Consultar cobranças/);
});

test("deduplicação: mesma tarefa e mesmo despacho geram a mesma chave", () => {
  assert.equal(C.taskKey({ title: "Recuperar Lead Quente!", related_kind: "lead", related_id: ID }), C.taskKey({ title: "recuperar lead quente", related_kind: "lead", related_id: ID }));
  assert.notEqual(C.taskKey({ title: "a" }), C.taskKey({ title: "b" }));
  assert.equal(C.dispatchKey({ task_type: "recover_lead", lead_id: ID, objective: "x" }), C.dispatchKey({ task_type: "recover_lead", lead_id: ID, objective: "y" }));
});

test("períodos no horário de São Paulo", () => {
  const now = new Date("2026-11-12T02:00:00Z"); // 11/11 23:00 em São Paulo
  assert.equal(C.periodRange("today", now).from.toISOString(), "2026-11-11T03:00:00.000Z");
  assert.equal(C.periodRange("this_month", now).from.toISOString(), "2026-11-01T03:00:00.000Z");
  const lm = C.periodRange("last_month", now);
  assert.equal(lm.from.toISOString(), "2026-10-01T03:00:00.000Z");
  assert.equal(lm.to.toISOString(), "2026-11-01T03:00:00.000Z");
  assert.equal(C.monthRange("2026-02", now).to.toISOString(), "2026-03-01T03:00:00.000Z");
  assert.equal(C.monthRange("lixo", now).label, "este mês");
});

test("relatório: 23 seções, números reais e texto marcado pela origem", () => {
  const d = {
    current: { sales: { leads_new: 10, sales_count: 2, revenue_received_cents: 250000, revenue_billed_cents: 300000, revenue_contracted_cents: 400000 }, finance: { charges_pending: 1, charges_late: 1 }, operations: {}, ai: {} },
    previous: { sales: { leads_new: 5, sales_count: 2, revenue_received_cents: 0 } },
    charges_pending: [{ who: "Ana", description: "Site", amount_cents: 120000, due_date: "2026-11-01", late: true, delinquent: false }],
    alerts_open: [{ priority: "critical", title: "Lead quente sem contato: Bia", recommendation: "Ligar hoje" }],
  };
  const nar = C.ruleNarrative(d);
  assert.equal(nar.fonte, "regras");
  assert.match(nar.resumo, /R\$ 2\.500,00/);
  const secs = C.reportSections(d, nar);
  assert.equal(secs.length, 23);
  assert.deepEqual(secs.map((x) => x.n), Array.from({ length: 23 }, (_, i) => i + 1));
  assert.match(secs[0].lines[1], /regras fixas/);
  assert.match(secs[8].lines[0], /\+100%/);
  assert.match(secs[10].lines[0], /sem pagamento registrado/);
  assert.match(secs[9].lines[0], /Nenhuma cobrança pendente/);
  assert.deepEqual(secs[22].lines, ["Lead quente sem contato: Bia"]);
});

test("texto da IA: só aceita JSON com resumo", () => {
  assert.equal(C.parseNarrative("sem json"), null);
  assert.equal(C.parseNarrative('{"oportunidades":[]}'), null);
  const n = C.parseNarrative('Aqui está:\n{"resumo":"Mês fraco.","oportunidades":["a"],"recomendacoes":"x","prioridades":["p1","p2"]}');
  assert.ok(n && n.fonte === "ia" && n.recomendacoes.length === 0 && n.prioridades.length === 2);
});

test("logs sem segredos", () => {
  const out = C.safeLog({ action: "save", api_key: "sk-123", nested: { access_token: "x", ok: 1 }, text: "a".repeat(400) }) as any;
  assert.equal(out.api_key, undefined);
  assert.equal(out.nested.access_token, undefined);
  assert.equal(out.nested.ok, 1);
  assert.ok(out.text.length < 310);
});

test("dados para o modelo têm tamanho limitado", () => {
  assert.match(C.asData({ a: "x".repeat(50) }, 20), /cortado/);
  assert.equal(C.asData({ a: 1 }), '{"a":1}');
});

test("laço de ferramentas: executa, devolve resultado e termina no texto", async () => {
  const seen: unknown[] = [];
  const replies = [
    { content: [{ type: "thinking", text: "" }, { type: "tool_use", id: "t1", name: "get_team", input: {} }], stopReason: "tool_use", model: "m", usage: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 } },
    { content: [{ type: "text", text: "Pronto." }], stopReason: "end_turn", model: "m", usage: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 } },
  ];
  const provider = { id: "fake", chat: async (req: any) => { seen.push(req.messages); return replies.shift()!; } };
  const out = await C.toolLoop(provider as any, {}, [{ role: "user", content: "oi" }], async (n) => ({ content: n === "get_team" ? "[]" : "?" }));
  assert.equal(out.text, "Pronto.");
  assert.equal(out.tools.length, 1);
  const second = seen[1] as any[];
  assert.equal(second[1].content[0].type, "thinking");   // bloco do assistente volta sem alteração
  assert.equal(second[2].content[0].tool_use_id, "t1");
});

test("laço de ferramentas: recusa para na hora", async () => {
  const provider = { id: "fake", chat: async () => ({ content: [], stopReason: "refusal", model: "m", usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } }) };
  const out = await C.toolLoop(provider as any, {}, [], async () => ({ content: "" }));
  assert.equal(out.stop, "refusal");
});
