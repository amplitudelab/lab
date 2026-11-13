// AI Sales: regras puras do agente (sem banco e sem rede), para testar com `node --test`.
// A função ai-sales (index.ts) injeta o provedor de IA e a execução das ferramentas.

export type Json = Record<string, unknown>;
export type Qual = "cold" | "warm" | "hot" | "qualified" | "unqualified";
export const QUALS: Qual[] = ["cold", "warm", "hot", "qualified", "unqualified"];

export const DEFAULTS = {
  persona: {
    name: "Ana", personality: "consultiva, atenciosa e direta", tone: "próximo e profissional", formality: "equilibrado",
    objectivity: "objetiva", emojis: "pouco", approach: "pergunta antes de oferecer", language: "português do Brasil",
    greeting: "", pitch: "",
  },
  sales: { products: "", audience: "", pains: "", differentials: "", prices: "", objections: "", arguments: "", goals: "Entender a necessidade, qualificar e levar para uma proposta ou para um vendedor." },
  qualification: { criteria: "", hot_score: 70, qualified_score: 85 },
  followup: { enabled: true, intervals_hours: [24, 72, 168], max_attempts: 3, messages: [] as string[], template_name: "", template_lang: "pt_BR", daily_limit: 50 },
  handoff: { rules: "Cliente quer fechar, pede um vendedor, está insatisfeito, pede condição especial ou faz pergunta que a base não responde.", message: "Vou chamar uma pessoa do time para continuar com você. Já passei o resumo da nossa conversa, então não precisa repetir nada." },
  hours: { start: "09:00", end: "19:00", days: [1, 2, 3, 4, 5, 6], tz: "America/Sao_Paulo", reply_off_hours: true },
  limits: { monthly_usd: 30, max_ai_replies_per_day: 40 },
  whatsapp: { phone_number_id: "", waba_id: "", api_version: "v26.0", test_numbers: [] as string[] },
};
export type Settings = {
  active: boolean; mode: "simulation" | "development" | "production"; provider: string; model: string; effort: "low" | "medium" | "high";
  persona: typeof DEFAULTS.persona; sales: typeof DEFAULTS.sales; qualification: typeof DEFAULTS.qualification;
  followup: typeof DEFAULTS.followup; handoff: typeof DEFAULTS.handoff; hours: typeof DEFAULTS.hours;
  limits: typeof DEFAULTS.limits; whatsapp: typeof DEFAULTS.whatsapp; prompt: string;
};
export function normalizeSettings(row: Json | null | undefined): Settings {
  const r = row ?? {};
  const pick = <K extends keyof typeof DEFAULTS>(k: K) => ({ ...DEFAULTS[k], ...((r[k] as Json) ?? {}) }) as (typeof DEFAULTS)[K];
  return {
    active: !!r.active, mode: (["simulation", "development", "production"].includes(String(r.mode)) ? r.mode : "simulation") as Settings["mode"],
    provider: String(r.provider ?? "anthropic"), model: String(r.model ?? "claude-opus-5-5"), effort: (["low", "medium", "high"].includes(String(r.effort)) ? r.effort : "low") as Settings["effort"],
    persona: pick("persona"), sales: pick("sales"), qualification: pick("qualification"), followup: pick("followup"),
    handoff: pick("handoff"), hours: pick("hours"), limits: pick("limits"), whatsapp: pick("whatsapp"), prompt: String(r.prompt ?? ""),
  };
}

// ---------- WhatsApp ----------
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
function sameText(a: string, b: string) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }
// Assinatura da Meta: cabeçalho X-Hub-Signature-256 = "sha256=" + HMAC-SHA256(corpo bruto, App Secret).
export async function verifySignature(rawBody: string, header: string | null, appSecret: string): Promise<boolean> {
  if (!header || !appSecret || !header.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(appSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)));
  return sameText(mac, header.slice(7).toLowerCase());
}
export type Inbound = { id: string; from: string; name: string; type: string; text: string; ts: number; phoneNumberId: string };
export type StatusEvent = { id: string; status: string; ts: number; error: string; phoneNumberId: string };
// Lê o corpo do webhook da Meta e separa mensagens recebidas e mudanças de status.
export function parseWebhook(body: Json): { messages: Inbound[]; statuses: StatusEvent[] } {
  const messages: Inbound[] = [], statuses: StatusEvent[] = [];
  for (const entry of (body.entry as Json[]) ?? []) for (const ch of (entry.changes as Json[]) ?? []) {
    const v = (ch.value as Json) ?? {}, meta = (v.metadata as Json) ?? {}, pid = String(meta.phone_number_id ?? "");
    const names = new Map<string, string>(((v.contacts as Json[]) ?? []).map((c) => [String(c.wa_id), String(((c.profile as Json) ?? {}).name ?? "")]));
    for (const m of (v.messages as Json[]) ?? []) {
      const type = String(m.type ?? "text"), from = String(m.from ?? "");
      const text = type === "text" ? String(((m.text as Json) ?? {}).body ?? "")
        : type === "button" ? String(((m.button as Json) ?? {}).text ?? "")
        : type === "interactive" ? String((((m.interactive as Json) ?? {}).button_reply as Json)?.title ?? (((m.interactive as Json) ?? {}).list_reply as Json)?.title ?? "")
        : "";
      messages.push({ id: String(m.id), from, name: names.get(from) ?? "", type, text, ts: Number(m.timestamp ?? 0) * 1000, phoneNumberId: pid });
    }
    for (const s of (v.statuses as Json[]) ?? []) {
      const err = ((s.errors as Json[]) ?? [])[0];
      statuses.push({ id: String(s.id), status: String(s.status), ts: Number(s.timestamp ?? 0) * 1000, error: err ? String(err.title ?? err.message ?? err.code ?? "") : "", phoneNumberId: pid });
    }
  }
  return { messages, statuses };
}
// A Meta só aceita mensagem livre até 24 h depois da última mensagem do cliente; fora disso, só template aprovado.
export const within24h = (lastInbound: string | number | Date | null | undefined, now = Date.now()) =>
  !!lastInbound && now - new Date(lastInbound).getTime() < 24 * 3600 * 1000;

// ---------- sinais na mensagem do cliente ----------
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
export function isOptOut(text: string): boolean {
  const t = norm(text);
  return /^(parar|pare|sair|stop|cancelar|descadastrar)[.!]*$/.test(t)
    || /\b(nao (quero|desejo) (mais )?(receber|mensage|contato)|nao me (mande|envie|chame) mais|para de me mandar|me (tire|remova|exclua) (da|dessa) lista|nao tenho interesse,? (pode )?parar)/.test(t);
}
export function wantsHuman(text: string): boolean {
  const t = norm(text);
  return /\b(falar|conversar|atendimento) (com )?(um |uma |o |a )?(atendente|humano|pessoa|vendedor|vendedora|consultor|consultora|responsavel|gerente|alguem)\b/.test(t)
    || /\b(quero|prefiro) (um |uma )?(atendente|humano|pessoa de verdade)\b/.test(t);
}

// ---------- horários ----------
function localParts(d: Date, tz: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d).map((x) => [x.type, x.value]));
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(String(p.weekday));
  return { day, minutes: Number(p.hour) * 60 + Number(p.minute) };
}
const hm = (s: string) => { const [h, m] = String(s || "0:0").split(":").map(Number); return (h || 0) * 60 + (m || 0); };
export function inHours(d: Date, hours: Settings["hours"]): boolean {
  const { day, minutes } = localParts(d, hours.tz || "America/Sao_Paulo");
  return (hours.days ?? []).includes(day) && minutes >= hm(hours.start) && minutes < hm(hours.end);
}
// Primeiro horário permitido a partir de `from` (passos de 15 min, até 8 dias).
export function nextAllowed(from: Date, hours: Settings["hours"]): Date {
  if (!hours.days?.length) return from;
  const d = new Date(from.getTime());
  for (let i = 0; i < 8 * 96; i++) { if (inHours(d, hours)) return d; d.setTime(d.getTime() + 15 * 60000); }
  return from;
}
// Próximo follow-up automático: null quando a regra está desligada ou as tentativas acabaram.
export function planFollowup(attempt: number, s: Settings, now = new Date()): Date | null {
  const f = s.followup;
  if (!f.enabled || attempt > Math.max(0, Number(f.max_attempts) || 0)) return null;
  const list = (f.intervals_hours ?? []).map(Number).filter((n) => n > 0);
  const h = list[Math.min(attempt - 1, list.length - 1)] ?? 24;
  return nextAllowed(new Date(now.getTime() + h * 3600 * 1000), s.hours);
}

// ---------- custo ----------
// Preço por milhão de tokens (entrada, saída, leitura de cache) da Anthropic. Modelos fora da tabela usam o do Opus 5.5.
export const PRICES: Record<string, [number, number, number]> = {
  "claude-opus-5-5": [4, 20, 0.2], "claude-fable-5-2": [8, 40, 0.2], "claude-sonnet-5-5": [2, 10, 0.1], "claude-haiku-5-5": [0.1, 0.5, 0.01],
  "claude-opus-5": [5, 25, 0.5], "claude-opus-4-8": [5, 25, 0.5],
};
export function costUsd(model: string, u: { input: number; output: number; cacheRead?: number; cacheWrite?: number }) {
  const [i, o, c] = PRICES[model] ?? PRICES["claude-opus-5-5"];
  return ((u.input || 0) * i + (u.cacheWrite || 0) * i * 1.25 + (u.output || 0) * o + (u.cacheRead || 0) * c) / 1e6;
}

// ---------- ferramentas do agente ----------
export const TOOLS = [
  {
    name: "update_lead",
    description: "Registra o que você aprendeu sobre o cliente nesta conversa: qualificação, pontuação, necessidade e próximos passos. Use sempre que surgir informação comercial nova. Mande só os campos que mudaram.",
    input_schema: {
      type: "object", additionalProperties: false,
      properties: {
        qualification: { type: "string", enum: QUALS, description: "cold, warm, hot, qualified ou unqualified" },
        score: { type: "integer", minimum: 0, maximum: 100 },
        probability: { type: "integer", minimum: 0, maximum: 100, description: "Chance estimada de fechar, em %" },
        summary: { type: "string", description: "Resumo curto da necessidade do cliente" },
        need: { type: "string" }, problem: { type: "string" }, urgency: { type: "string" }, budget: { type: "string" },
        decision_maker: { type: "string" }, timeline: { type: "string" }, product: { type: "string" }, interest: { type: "string" },
        objections: { type: "array", items: { type: "string" } },
        facts: { type: "array", items: { type: "string" }, description: "Fatos e preferências que o cliente informou" },
        next_action: { type: "string" },
      },
    },
  },
  {
    name: "request_human",
    description: "Transfere a conversa para uma pessoa do time. Use quando o cliente quer fechar, pede um vendedor, está insatisfeito, precisa de condição especial ou faz uma pergunta que a base de conhecimento não responde. Depois disso você não responde mais nesta conversa.",
    input_schema: {
      type: "object", additionalProperties: false, required: ["reason", "summary", "next_step"],
      properties: { reason: { type: "string" }, summary: { type: "string" }, needs: { type: "string" }, objections: { type: "string" }, next_step: { type: "string" } },
    },
  },
  {
    name: "schedule_followup",
    description: "Agenda uma retomada de contato quando o cliente pede para falar depois ou some no meio da conversa.",
    input_schema: { type: "object", additionalProperties: false, required: ["hours_from_now", "reason"], properties: { hours_from_now: { type: "number", minimum: 1, maximum: 720 }, reason: { type: "string" } } },
  },
  {
    name: "mark_opt_out",
    description: "Use quando o cliente pedir para não receber mais mensagens. Depois disso nada mais é enviado para ele.",
    input_schema: { type: "object", additionalProperties: false, required: ["reason"], properties: { reason: { type: "string" } } },
  },
];
const str = (v: unknown, max = 600) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);
const int = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v))) : undefined);
// Confere o que o modelo mandou antes de gravar qualquer coisa. Retorna null para entrada inválida.
export function validateToolInput(name: string, input: unknown): Json | null {
  if (!input || typeof input !== "object") return null;
  const x = input as Json;
  if (name === "update_lead") {
    const out: Json = {};
    if (x.qualification !== undefined) { if (!QUALS.includes(x.qualification as Qual)) return null; out.qualification = x.qualification; }
    for (const k of ["summary", "need", "problem", "urgency", "budget", "decision_maker", "timeline", "product", "interest", "next_action"]) { const v = str(x[k]); if (v) out[k] = v; }
    const sc = int(x.score, 0, 100), pr = int(x.probability, 0, 100);
    if (sc !== undefined) out.score = sc; if (pr !== undefined) out.probability = pr;
    for (const k of ["objections", "facts"]) if (Array.isArray(x[k])) out[k] = (x[k] as unknown[]).map((v) => str(v, 300)).filter(Boolean).slice(0, 10);
    return out;
  }
  if (name === "request_human") { const reason = str(x.reason), summary = str(x.summary, 1500), next = str(x.next_step); return reason && summary && next ? { reason, summary, next_step: next, needs: str(x.needs) ?? "", objections: str(x.objections) ?? "" } : null; }
  if (name === "schedule_followup") { const h = typeof x.hours_from_now === "number" ? Math.max(1, Math.min(720, x.hours_from_now)) : NaN, reason = str(x.reason); return Number.isFinite(h) && reason ? { hours_from_now: h, reason } : null; }
  if (name === "mark_opt_out") return { reason: str(x.reason) ?? "pedido do cliente" };
  return null;
}

// Junta o que o agente aprendeu sem apagar o que já sabia: um campo só muda quando vem valor novo,
// e toda troca de valor fica registrada no histórico.
export type Memory = { profile: Json; objections: string[]; facts: string[]; history: Json[] };
export function mergeMemory(mem: Memory, upd: Json, at = new Date().toISOString()): Memory {
  const profile = { ...mem.profile }, history = [...(mem.history ?? [])];
  for (const k of ["need", "problem", "urgency", "budget", "decision_maker", "timeline", "product", "interest"]) {
    const v = upd[k]; if (typeof v !== "string" || !v) continue;
    if (profile[k] && profile[k] !== v) history.push({ at, field: k, from: profile[k], to: v });
    else if (!profile[k]) history.push({ at, field: k, to: v });
    profile[k] = v;
  }
  const uniq = (a: string[]) => [...new Set(a.map((s) => s.trim()).filter(Boolean))].slice(-30);
  return { profile, objections: uniq([...(mem.objections ?? []), ...((upd.objections as string[]) ?? [])]), facts: uniq([...(mem.facts ?? []), ...((upd.facts as string[]) ?? [])]), history: history.slice(-100) };
}
// Qualificação pela pontuação, quando o modelo manda só o número.
export function qualFromScore(score: number, s: Settings, current: Qual): Qual {
  if (current === "unqualified") return current;
  if (score >= Number(s.qualification.qualified_score || 85)) return "qualified";
  if (score >= Number(s.qualification.hot_score || 70)) return "hot";
  if (score >= 35) return "warm";
  return current === "cold" ? "cold" : current;
}

// ---------- prompt ----------
export type KnowledgeItem = { kind: string; title: string; body: string };
export const KIND_LABEL: Record<string, string> = {
  empresa: "Empresa", produto: "Produto", servico: "Serviço", preco: "Preço", faq: "Pergunta frequente", politica: "Política comercial",
  diferencial: "Diferencial", processo: "Processo de venda", pagamento: "Pagamento", institucional: "Institucional", objecao: "Resposta para objeção",
};
// Parte estável (vai para o cache de prompt): identidade, regras e base de conhecimento.
export function systemStable(s: Settings, company: string, kb: KnowledgeItem[]): string {
  const p = s.persona, v = s.sales, line = (label: string, val: unknown) => (val ? `- ${label}: ${val}\n` : "");
  const kbText = kb.length ? kb.map((k) => `### ${KIND_LABEL[k.kind] ?? k.kind}: ${k.title}\n${k.body}`).join("\n\n") : "(vazia)";
  return `Você é ${p.name || "a assistente comercial"}, da ${company}, e atende clientes pelo WhatsApp como uma vendedora consultiva.

## Jeito de falar
${line("Personalidade", p.personality)}${line("Tom", p.tone)}${line("Formalidade", p.formality)}${line("Objetividade", p.objectivity)}${line("Emojis", p.emojis)}${line("Abordagem", p.approach)}${line("Idioma", p.language)}${line("Saudação inicial", p.greeting)}${line("Apresentação comercial", p.pitch)}
Escreva como uma pessoa no WhatsApp: mensagens curtas, uma ideia por vez, no máximo uma pergunta por mensagem. Nada de listas longas, títulos ou textos de folheto. Não repita perguntas que o cliente já respondeu.

## O que vendemos
${line("Produtos e serviços", v.products)}${line("Público-alvo", v.audience)}${line("Dores dos clientes", v.pains)}${line("Diferenciais", v.differentials)}${line("Preços e condições", v.prices)}${line("Objeções frequentes", v.objections)}${line("Argumentos", v.arguments)}${line("Objetivo da conversa", v.goals)}
## Qualificação
Descubra, ao longo da conversa e sem interrogatório: interesse, necessidade, problema, urgência, orçamento, quem decide, prazo e produto desejado.
${line("Critérios do dono", s.qualification.criteria)}Classifique como cold, warm, hot, qualified ou unqualified e dê uma pontuação de 0 a 100. Sempre que aprender algo novo, chame update_lead.

## Transferência para humano
${s.handoff.rules}
Nesses casos chame request_human com o motivo, um resumo, as necessidades, as objeções e o próximo passo, e depois escreva só uma mensagem curta avisando que uma pessoa vai continuar.

## Regras
- Use só a base de conhecimento abaixo para preços, prazos, condições e políticas. Se a resposta não estiver lá, diga que vai confirmar e chame request_human ou pergunte ao cliente. Nunca invente.
- Se o cliente pedir para parar de receber mensagens, chame mark_opt_out e responda só confirmando.
- Se o cliente pedir para falar depois, chame schedule_followup.
- Não prometa desconto, prazo ou condição que não esteja na base.
${s.prompt ? `\n## Instruções do dono\n${s.prompt}\n` : ""}
## Base de conhecimento
${kbText}`;
}
// Parte que muda a cada mensagem: o que já sabemos deste cliente.
export function systemDynamic(conv: Json, mem: Memory, lead: Json | null, now = new Date()): string {
  const prof = Object.entries(mem.profile ?? {}).filter(([, v]) => v).map(([k, v]) => `- ${k}: ${v}`).join("\n") || "- (nada ainda)";
  return `## Este cliente
- Nome no WhatsApp: ${conv.contact_name || "não informado"}
- Qualificação atual: ${conv.qualification} (${conv.score ?? 0}/100)${conv.summary ? `\n- Resumo até aqui: ${conv.summary}` : ""}${lead ? `\n- No CRM: etapa ${lead.stage ?? "?"}${lead.interest ? `, interesse "${lead.interest}"` : ""}` : ""}
O que já sabemos:
${prof}${mem.objections?.length ? `\nObjeções já ditas: ${mem.objections.join("; ")}` : ""}${mem.facts?.length ? `\nFatos: ${mem.facts.join("; ")}` : ""}
Agora: ${now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`;
}
// Histórico para o modelo: cliente vira "user", IA e vendedor viram "assistant"; mensagens seguidas do mesmo lado se juntam.
export type Msg = { direction: "in" | "out"; author: string; body: string };
export function toModelMessages(history: Msg[]) {
  const out: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of history) {
    if (m.author === "system" || !m.body) continue;
    const role = m.direction === "in" ? "user" : "assistant", text = m.author === "human" ? `[mensagem do vendedor] ${m.body}` : m.body;
    const last = out[out.length - 1];
    if (last && last.role === role) last.content += "\n" + text; else out.push({ role, content: text });
  }
  while (out.length && out[0].role !== "user") out.shift();
  return out;
}

// ---------- laço do agente ----------
export type Block = { type: string; text?: string; id?: string; name?: string; input?: unknown };
export type ChatResult = { content: Block[]; stopReason: string; model: string; usage: { input: number; output: number; cacheRead: number; cacheWrite: number } };
export type ChatRequest = { system: { type: "text"; text: string; cache_control?: { type: "ephemeral" } }[]; messages: unknown[]; tools: typeof TOOLS; model: string; effort: string; maxTokens: number };
export interface Provider { id: string; chat(req: ChatRequest): Promise<ChatResult> }
export type LoopOutcome = { text: string; stop: "reply" | "handoff" | "opt_out" | "refusal" | "empty"; calls: ChatResult[]; tools: { name: string; input: Json; ok: boolean }[] };
// Chama o modelo, executa as ferramentas e devolve o texto final. Para depois de request_human ou mark_opt_out.
export async function runLoop(provider: Provider, base: Omit<ChatRequest, "messages">, messages: unknown[], exec: (name: string, input: Json) => Promise<string>, maxIter = 4): Promise<LoopOutcome> {
  const msgs = [...messages], calls: ChatResult[] = [], tools: LoopOutcome["tools"] = [];
  let stop: LoopOutcome["stop"] = "reply";
  for (let i = 0; i < maxIter; i++) {
    const res = await provider.chat({ ...base, messages: msgs });
    calls.push(res);
    if (res.stopReason === "refusal") return { text: "", stop: "refusal", calls, tools };
    const uses = res.content.filter((b) => b.type === "tool_use");
    const text = res.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n").trim();
    if (!uses.length || res.stopReason !== "tool_use") return { text, stop: text ? stop : stop === "reply" ? "empty" : stop, calls, tools };
    msgs.push({ role: "assistant", content: res.content });
    const results = [];
    for (const u of uses) {
      const input = validateToolInput(String(u.name), u.input);
      if (!input) { tools.push({ name: String(u.name), input: {}, ok: false }); results.push({ type: "tool_result", tool_use_id: u.id, is_error: true, content: "Entrada inválida. Revise os campos e tente de novo." }); continue; }
      const out = await exec(String(u.name), input);
      tools.push({ name: String(u.name), input, ok: true });
      if (u.name === "request_human") stop = "handoff";
      if (u.name === "mark_opt_out") stop = "opt_out";
      results.push({ type: "tool_result", tool_use_id: u.id, content: out });
    }
    msgs.push({ role: "user", content: results });
  }
  return { text: "", stop: stop === "reply" ? "empty" : stop, calls, tools };
}
