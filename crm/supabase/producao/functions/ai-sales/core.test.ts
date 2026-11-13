// Testes das regras do AI Sales. Rodar com: node --test crm/supabase/producao/functions/ai-sales/core.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  verifySignature, parseWebhook, within24h, isOptOut, wantsHuman, inHours, nextAllowed, planFollowup, costUsd,
  validateToolInput, mergeMemory, qualFromScore, normalizeSettings, toModelMessages, runLoop, systemStable,
} from "./core.ts";
import type { Provider, ChatResult } from "./core.ts";

const S = normalizeSettings({ active: true });

test("assinatura do webhook: aceita a certa e recusa a errada", async () => {
  const body = JSON.stringify({ entry: [] }), secret = "segredo-de-teste";
  const sig = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(await verifySignature(body, sig, secret), true);
  assert.equal(await verifySignature(body + " ", sig, secret), false);
  assert.equal(await verifySignature(body, "sha256=00", secret), false);
  assert.equal(await verifySignature(body, null, secret), false);
  assert.equal(await verifySignature(body, sig, ""), false);
});

test("webhook: separa mensagem, nome do contato e status", () => {
  const r = parseWebhook({ entry: [{ changes: [{ value: {
    metadata: { phone_number_id: "123" }, contacts: [{ wa_id: "5511999990000", profile: { name: "Rafa" } }],
    messages: [{ id: "wamid.A", from: "5511999990000", timestamp: "1700000000", type: "text", text: { body: "oi" } }],
    statuses: [{ id: "wamid.B", status: "read", timestamp: "1700000001" }],
  } }] }] });
  assert.equal(r.messages[0].text, "oi"); assert.equal(r.messages[0].name, "Rafa"); assert.equal(r.messages[0].phoneNumberId, "123");
  assert.equal(r.statuses[0].status, "read");
});

test("janela de 24 horas do WhatsApp", () => {
  const now = Date.parse("2026-11-12T12:00:00Z");
  assert.equal(within24h("2026-11-12T00:00:00Z", now), true);
  assert.equal(within24h("2026-11-11T11:59:00Z", now), false);
  assert.equal(within24h(null, now), false);
});

test("pedido para parar e pedido de humano", () => {
  for (const t of ["PARAR", "não quero mais receber mensagens", "Por favor, não me mande mais nada", "me tire dessa lista"]) assert.equal(isOptOut(t), true, t);
  for (const t of ["quero parar de perder clientes", "vou sair agora, falo depois", "oi"]) assert.equal(isOptOut(t), false, t);
  assert.equal(wantsHuman("posso falar com um atendente?"), true);
  assert.equal(wantsHuman("quero falar com o vendedor"), true);
  assert.equal(wantsHuman("qual o preço?"), false);
});

test("horário de atendimento e próximo horário permitido", () => {
  const h = { start: "09:00", end: "19:00", days: [1, 2, 3, 4, 5], tz: "America/Sao_Paulo", reply_off_hours: true };
  assert.equal(inHours(new Date("2026-11-12T13:00:00Z"), h), true);   // quinta, 10h em SP
  assert.equal(inHours(new Date("2026-11-12T23:30:00Z"), h), false);  // quinta, 20h30
  assert.equal(inHours(new Date("2026-11-14T13:00:00Z"), h), false);  // sábado
  const n = nextAllowed(new Date("2026-11-14T13:00:00Z"), h);         // sábado -> segunda 9h
  assert.equal(inHours(n, h), true);
  assert.equal(new Date(n).getUTCDay(), 1);
});

test("follow-up: respeita a quantidade máxima e a regra desligada", () => {
  const now = new Date("2026-11-12T13:00:00Z");
  assert.ok(planFollowup(1, S, now));
  assert.equal(planFollowup(4, S, now), null);
  assert.equal(planFollowup(1, normalizeSettings({ followup: { enabled: false } }), now), null);
});

test("custo por modelo", () => {
  assert.equal(costUsd("claude-opus-5-5", { input: 1_000_000, output: 0 }), 4);
  assert.equal(costUsd("claude-opus-5-5", { input: 0, output: 1_000_000 }), 20);
  assert.ok(Math.abs(costUsd("claude-opus-5-5", { input: 0, output: 0, cacheRead: 1_000_000 }) - 0.2) < 1e-9);
});

test("ferramentas: entrada inválida é recusada", () => {
  assert.equal(validateToolInput("update_lead", { qualification: "morno" }), null);
  assert.deepEqual(validateToolInput("update_lead", { score: 150, need: " site " }), { need: "site", score: 100 });
  assert.equal(validateToolInput("request_human", { reason: "quer fechar" }), null);
  assert.equal(validateToolInput("nada", {}), null);
});

test("memória: não apaga o que já sabia e registra a troca", () => {
  const m1 = mergeMemory({ profile: {}, objections: [], facts: [], history: [] }, { budget: "R$ 1.000", objections: ["preço"] });
  const m2 = mergeMemory(m1, { budget: "R$ 1.500", need: "" });
  assert.equal(m2.profile.budget, "R$ 1.500");
  assert.ok(m2.history.some((h) => h.field === "budget" && h.from === "R$ 1.000" && h.to === "R$ 1.500"));
  assert.deepEqual(m2.objections, ["preço"]);
});

test("qualificação pela pontuação", () => {
  assert.equal(qualFromScore(90, S, "cold"), "qualified");
  assert.equal(qualFromScore(72, S, "warm"), "hot");
  assert.equal(qualFromScore(90, S, "unqualified"), "unqualified");
});

test("histórico para o modelo começa pelo cliente e junta mensagens seguidas", () => {
  const m = toModelMessages([
    { direction: "out", author: "ai", body: "Olá!" }, { direction: "in", author: "customer", body: "oi" },
    { direction: "in", author: "customer", body: "quanto custa?" }, { direction: "out", author: "human", body: "R$ 600" },
  ]);
  assert.equal(m[0].role, "user"); assert.equal(m[0].content, "oi\nquanto custa?"); assert.match(m[1].content, /vendedor/);
});

test("prompt usa só a base e nunca fica sem regra contra invenção", () => {
  const p = systemStable(S, "Amplitude Lab", [{ kind: "preco", title: "Site", body: "R$ 600" }]);
  assert.match(p, /Nunca invente/); assert.match(p, /R\$ 600/);
});

const fake = (script: ChatResult[]): Provider => { let i = 0; return { id: "fake", chat: async () => script[Math.min(i++, script.length - 1)] } };
const usage = { input: 10, output: 5, cacheRead: 0, cacheWrite: 0 };
test("agente: executa a ferramenta e devolve a resposta", async () => {
  const seen: string[] = [];
  const r = await runLoop(fake([
    { content: [{ type: "tool_use", id: "t1", name: "update_lead", input: { qualification: "warm", score: 40 } }], stopReason: "tool_use", model: "m", usage },
    { content: [{ type: "text", text: "Legal! Pra quando você precisa?" }], stopReason: "end_turn", model: "m", usage },
  ]), { system: [], tools: [], model: "m", effort: "low", maxTokens: 100 }, [{ role: "user", content: "oi" }], async (n) => { seen.push(n); return "ok"; });
  assert.deepEqual(seen, ["update_lead"]); assert.equal(r.stop, "reply"); assert.match(r.text, /Pra quando/); assert.equal(r.calls.length, 2);
});

test("agente: transferência para humano encerra a vez da IA", async () => {
  const r = await runLoop(fake([
    { content: [{ type: "tool_use", id: "t1", name: "request_human", input: { reason: "quer fechar", summary: "quer site", next_step: "mandar proposta" } }], stopReason: "tool_use", model: "m", usage },
    { content: [{ type: "text", text: "Vou chamar uma pessoa do time." }], stopReason: "end_turn", model: "m", usage },
  ]), { system: [], tools: [], model: "m", effort: "low", maxTokens: 100 }, [{ role: "user", content: "quero fechar" }], async () => "ok");
  assert.equal(r.stop, "handoff");
});

test("agente: recusa do modelo não gera resposta", async () => {
  const r = await runLoop(fake([{ content: [], stopReason: "refusal", model: "m", usage }]), { system: [], tools: [], model: "m", effort: "low", maxTokens: 100 }, [], async () => "ok");
  assert.equal(r.stop, "refusal"); assert.equal(r.text, "");
});

test("agente: ferramenta com entrada inválida volta como erro e não executa", async () => {
  let ran = 0;
  const r = await runLoop(fake([
    { content: [{ type: "tool_use", id: "t1", name: "request_human", input: { reason: "x" } }], stopReason: "tool_use", model: "m", usage },
    { content: [{ type: "text", text: "ok" }], stopReason: "end_turn", model: "m", usage },
  ]), { system: [], tools: [], model: "m", effort: "low", maxTokens: 100 }, [], async () => { ran++; return "ok"; });
  assert.equal(ran, 0); assert.equal(r.tools[0].ok, false); assert.equal(r.stop, "reply");
});
