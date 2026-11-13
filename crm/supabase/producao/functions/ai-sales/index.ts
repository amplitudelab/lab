// AI Sales: agente comercial do dono do CRM no WhatsApp. Só roda para empresas em app.ai_sales_tenants.
// Entradas: ações do CRM (com login), webhook da Meta (?wh=<empresa>, com assinatura) e a fila de follow-ups (x-interno).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import Anthropic from "npm:@anthropic-ai/sdk@1.8.0";
import * as C from "./core.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const URL_ = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
type Conv = Record<string, any>;
type Ctx = { tenant: string; company: string; slug: string; s: C.Settings };

const log = (tenant: string | null, level: "info" | "warn" | "error", scope: string, message: string, data: C.Json = {}) =>
  admin.from("ai_logs").insert({ tenant_id: tenant, level, scope, message: message.slice(0, 500), data }).then(() => {}, () => {});
const secret = async (tenant: string, name: string) => String((await admin.rpc("ai_secret_get", { p_tenant: tenant, p_name: name })).data ?? "");
const notify = (tenant: string, title: string, body: string, lead: string | null = null) =>
  admin.from("notifications").insert({ tenant_id: tenant, lead_id: lead, kind: "system", title: title.slice(0, 120), body: body.slice(0, 600) });

async function context(tenant: string): Promise<Ctx | null> {
  const { data: ok } = await admin.rpc("ai_allowed", { p_tenant: tenant });
  if (!ok) return null;
  const [{ data: t }, { data: row }] = await Promise.all([
    admin.from("tenants").select("name, slug").eq("id", tenant).single(),
    admin.from("ai_settings").select("*").eq("tenant_id", tenant).maybeSingle(),
  ]);
  return { tenant, company: t?.name ?? "empresa", slug: t?.slug ?? "", s: C.normalizeSettings(row) };
}

// ---------- provedores de IA ----------
// Cada provedor implementa C.Provider. Hoje: Claude (Anthropic). A Meta fica registrada, mas desligada até haver acesso confirmado.
async function provider(ctx: Ctx): Promise<C.Provider> {
  if (ctx.s.provider === "anthropic") {
    const key = await secret(ctx.tenant, "anthropic_api_key");
    if (!key) throw new Error("Configure a chave da API do Claude em AI Sales → Integrações.");
    const client = new Anthropic({ apiKey: key });
    return {
      id: "anthropic",
      async chat(req) {
        const res: any = await client.beta.messages.create({
          model: req.model, max_tokens: req.maxTokens, system: req.system as any, messages: req.messages as any,
          ...(req.tools?.length ? { tools: req.tools as any } : {}),
          output_config: { effort: req.effort as any },
          // Se o modelo recusar por política, a própria API tenta o modelo reserva na mesma chamada.
          betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
        } as any);
        const u = res.usage ?? {};
        return {
          // Os blocos voltam sem alteração (pensamento e troca de modelo inclusos), como a API exige no laço de ferramentas.
          content: res.content ?? [],
          stopReason: String(res.stop_reason ?? ""), model: String(res.model ?? req.model),
          usage: { input: u.input_tokens ?? 0, output: u.output_tokens ?? 0, cacheRead: u.cache_read_input_tokens ?? 0, cacheWrite: u.cache_creation_input_tokens ?? 0 },
        };
      },
    };
  }
  if (ctx.s.provider === "meta") throw new Error("O provedor Meta ainda não está disponível nesta conta. Use o Claude por enquanto.");
  throw new Error("Provedor de IA desconhecido.");
}
const friendlyAiError = (e: unknown) => {
  if (e instanceof Anthropic.AuthenticationError) return "A chave da API do Claude foi recusada. Confira em Integrações.";
  if (e instanceof Anthropic.RateLimitError) return "O Claude está no limite de uso agora. Tente de novo em alguns minutos.";
  if (e instanceof Anthropic.BadRequestError) return "O Claude recusou o pedido: " + e.message.slice(0, 160);
  if (e instanceof Anthropic.APIError) return `Erro do Claude (${e.status}). Tente de novo.`;
  return e instanceof Error ? e.message : "Erro desconhecido na IA.";
};
async function recordUsage(ctx: Ctx, conv: Conv | null, calls: C.ChatResult[], purpose: string) {
  if (!calls.length) return;
  await admin.from("ai_usage").insert(calls.map((c) => ({
    tenant_id: ctx.tenant, conversation_id: conv?.id ?? null, provider: ctx.s.provider, model: c.model,
    input_tokens: c.usage.input + c.usage.cacheWrite, output_tokens: c.usage.output, cache_read_tokens: c.usage.cacheRead,
    cost_usd: C.costUsd(c.model, c.usage), purpose, is_test: !!conv?.is_test,
  })));
}

// ---------- WhatsApp Cloud API ----------
async function waSend(ctx: Ctx, to: string, payload: C.Json): Promise<{ id?: string; error?: string }> {
  const token = await secret(ctx.tenant, "wa_access_token"), w = ctx.s.whatsapp;
  if (!token || !w.phone_number_id) return { error: "WhatsApp não configurado" };
  try {
    const r = await fetch(`https://graph.facebook.com/${w.api_version || "v26.0"}/${w.phone_number_id}/messages`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, ...payload }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return { error: String(d?.error?.message ?? `HTTP ${r.status}`).slice(0, 300) };
    return { id: d?.messages?.[0]?.id };
  } catch (e) { return { error: e instanceof Error ? e.message : "falha de rede" }; }
}
// Entrega uma mensagem: grava primeiro (a trava reply_to impede resposta dupla) e só então envia de verdade, se o modo deixar.
async function deliver(ctx: Ctx, conv: Conv, text: string, o: { author: "ai" | "human" | "system"; replyTo?: string; userId?: string; template?: boolean }) {
  const { data: msg, error } = await admin.from("ai_messages").insert({
    tenant_id: ctx.tenant, conversation_id: conv.id, direction: "out", author: o.author, kind: o.template ? "template" : "text",
    body: text, reply_to: o.replyTo ?? null, status: "queued", is_test: conv.is_test, created_by: o.userId ?? null,
  }).select("id").single();
  if (error) return { skipped: true };   // já existe resposta para essa mensagem
  let status = "simulated", err: string | null = null, waId: string | null = null;
  const real = !conv.is_test && ctx.s.mode !== "simulation";
  if (real && ctx.s.mode === "development" && !(ctx.s.whatsapp.test_numbers ?? []).map((n) => String(n).replace(/\D/g, "")).includes(conv.wa_id)) {
    status = "blocked"; err = "Modo desenvolvimento: o número não está na lista de teste.";
  } else if (real && !o.template && !C.within24h(conv.last_inbound_at)) {
    status = "blocked"; err = "Fora da janela de 24 horas: só template aprovado.";
  } else if (real) {
    const payload = o.template
      ? { type: "template", template: { name: ctx.s.followup.template_name, language: { code: ctx.s.followup.template_lang || "pt_BR" } } }
      : { type: "text", text: { preview_url: false, body: text } };
    const r = await waSend(ctx, conv.wa_id, payload);
    if (r.id) { status = "sent"; waId = r.id; } else { status = "failed"; err = r.error ?? "falha"; await log(ctx.tenant, "error", "whatsapp", "Envio falhou: " + err, { conversation: conv.id }); }
  }
  await admin.from("ai_messages").update({ status, error: err, wa_message_id: waId }).eq("id", msg!.id);
  return { id: msg!.id, status, error: err };
}

// ---------- conversa ----------
async function getConversation(ctx: Ctx, waId: string, name: string, isTest: boolean): Promise<Conv> {
  const digits = waId.replace(/\D/g, "") || waId;
  const { data: found } = await admin.from("ai_conversations").select("*").eq("tenant_id", ctx.tenant).eq("wa_id", digits).eq("is_test", isTest).maybeSingle();
  if (found) { if (name && !found.contact_name) await admin.from("ai_conversations").update({ contact_name: name }).eq("id", found.id); return found; }
  // Conversa de teste não cria lead no CRM: o funil fica só com contatos reais.
  const lead = isTest ? null : (await admin.rpc("ai_link_lead", { p_tenant: ctx.tenant, p_digits: digits, p_name: name })).data;
  const { data: conv, error } = await admin.from("ai_conversations").insert({ tenant_id: ctx.tenant, lead_id: lead, wa_id: digits, contact_name: name || null, is_test: isTest }).select("*").single();
  if (error) { const { data: again } = await admin.from("ai_conversations").select("*").eq("tenant_id", ctx.tenant).eq("wa_id", digits).eq("is_test", isTest).single(); return again!; }
  await admin.from("ai_memory").insert({ conversation_id: conv.id, tenant_id: ctx.tenant, lead_id: lead });
  if (lead) await admin.from("activities").insert({ tenant_id: ctx.tenant, lead_id: lead, kind: "whatsapp", body: "Conversa no WhatsApp iniciada pelo AI Sales.", meta: { by: "AI Sales", conversation: conv.id } });
  return conv;
}
async function handoff(ctx: Ctx, conv: Conv, h: { reason: string; summary: string; needs?: string; objections?: string; next_step?: string }, by: "ai" | "human" | "customer", userId?: string) {
  await admin.from("ai_conversations").update({ status: by === "human" && userId ? "human_assigned" : "human_requested", assigned_to: userId ?? null, summary: h.summary || conv.summary }).eq("id", conv.id);
  await admin.from("ai_handoffs").insert({ tenant_id: ctx.tenant, conversation_id: conv.id, reason: h.reason, summary: h.summary, needs: h.needs ?? null, objections: h.objections ?? null, next_step: h.next_step ?? null, requested_by: by, assigned_to: userId ?? null, is_test: conv.is_test });
  if (conv.lead_id) await admin.from("activities").insert({ tenant_id: ctx.tenant, lead_id: conv.lead_id, kind: "whatsapp", body: `AI Sales transferiu para humano. Motivo: ${h.reason}. Próximo passo: ${h.next_step ?? "-"}`, meta: { by: "AI Sales", conversation: conv.id } });
  if (!conv.is_test) await notify(ctx.tenant, `AI Sales: ${conv.contact_name || conv.wa_id} precisa de um vendedor`, `${h.reason}. ${h.summary}`, conv.lead_id);
}
async function scheduleFollowup(ctx: Ctx, conv: Conv, due: Date, attempt: number, by: "rule" | "ai" | "human", note: string) {
  await admin.from("ai_followups").insert({ tenant_id: ctx.tenant, conversation_id: conv.id, due_at: due.toISOString(), attempt, created_by: by, note, is_test: conv.is_test });
}

// Responde a mensagem do cliente. Trava a conversa, monta o contexto, roda o laço e entrega uma resposta só.
async function agentReply(ctx: Ctx, convIn: Conv, inboundId: string, force = false): Promise<C.Json> {
  if (!force && !ctx.s.active) return { skipped: "agente desligado" };
  if (!(await admin.rpc("ai_claim_conversation", { p_conv: convIn.id, p_seconds: 120 })).data) return { skipped: "outra execução já está respondendo" };
  try {
    const { data: conv } = await admin.from("ai_conversations").select("*").eq("id", convIn.id).single();
    if (!conv || conv.status !== "ai_active" || conv.opted_out) return { skipped: "conversa com humano ou encerrada" };
    if ((await admin.from("ai_messages").select("id").eq("reply_to", inboundId).maybeSingle()).data) return { skipped: "já respondida" };
    const cost = Number((await admin.rpc("ai_month_cost", { p_tenant: ctx.tenant })).data ?? 0);
    if (cost >= Number(ctx.s.limits.monthly_usd || 0)) {
      await log(ctx.tenant, "warn", "limite", `Teto de custo do mês atingido (US$ ${cost.toFixed(2)}).`);
      await handoff(ctx, conv, { reason: "Teto de custo de IA do mês atingido", summary: conv.summary ?? "", next_step: "Responder manualmente" }, "ai");
      return { skipped: "teto de custo" };
    }
    const since = new Date(Date.now() - 86400000).toISOString();
    const { count: today } = await admin.from("ai_messages").select("id", { count: "exact", head: true }).eq("conversation_id", conv.id).eq("author", "ai").gte("created_at", since);
    if ((today ?? 0) >= Number(ctx.s.limits.max_ai_replies_per_day || 40)) {
      await handoff(ctx, conv, { reason: "Limite diário de respostas da IA nesta conversa", summary: conv.summary ?? "", next_step: "Assumir a conversa" }, "ai");
      return { skipped: "limite diário" };
    }

    const [{ data: kb }, { data: memRow }, { data: hist }, { data: lead }] = await Promise.all([
      admin.from("ai_knowledge").select("kind, title, body").eq("tenant_id", ctx.tenant).eq("active", true).order("kind").order("title"),
      admin.from("ai_memory").select("*").eq("conversation_id", conv.id).maybeSingle(),
      admin.from("ai_messages").select("direction, author, body").eq("conversation_id", conv.id).order("created_at", { ascending: false }).limit(40),
      conv.lead_id ? admin.from("leads").select("interest, pipeline_stages(name)").eq("id", conv.lead_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    let mem: C.Memory = { profile: memRow?.profile ?? {}, objections: memRow?.objections ?? [], facts: memRow?.facts ?? [], history: memRow?.history ?? [] };
    const messages = C.toModelMessages(((hist ?? []) as C.Msg[]).reverse());
    if (!messages.length) return { skipped: "sem mensagem do cliente" };
    const leadInfo = lead ? { interest: (lead as any).interest, stage: (lead as any).pipeline_stages?.name } : null;
    const base = {
      system: [
        { type: "text" as const, text: C.systemStable(ctx.s, ctx.company, (kb ?? []) as C.KnowledgeItem[]), cache_control: { type: "ephemeral" as const } },
        { type: "text" as const, text: C.systemDynamic(conv, mem, leadInfo) },
      ],
      tools: C.TOOLS, model: ctx.s.model, effort: ctx.s.effort, maxTokens: 8000,
    };
    let handoffData: C.Json | null = null, scheduled = false;
    const exec = async (name: string, input: C.Json) => {
      if (name === "update_lead") {
        mem = C.mergeMemory(mem, input);
        const patch: C.Json = {};
        if (input.score !== undefined) { patch.score = input.score; patch.qualification = input.qualification ?? C.qualFromScore(Number(input.score), ctx.s, conv.qualification); }
        if (input.qualification) patch.qualification = input.qualification;
        for (const k of ["summary", "next_action", "probability"]) if (input[k] !== undefined) patch[k] = input[k];
        await admin.from("ai_memory").update({ profile: mem.profile, objections: mem.objections, facts: mem.facts, history: mem.history, updated_at: new Date().toISOString() }).eq("conversation_id", conv.id);
        if (Object.keys(patch).length) await admin.from("ai_conversations").update(patch).eq("id", conv.id);
        if (patch.qualification && patch.qualification !== conv.qualification && conv.lead_id)
          await admin.from("activities").insert({ tenant_id: ctx.tenant, lead_id: conv.lead_id, kind: "note", body: `AI Sales: lead ${patch.qualification}${patch.score !== undefined ? ` (${patch.score}/100)` : ""}. ${input.summary ?? ""}`.trim(), meta: { by: "AI Sales" } });
        // O interesse do lead só é preenchido quando está vazio: o que o vendedor escreveu não é sobrescrito.
        if (conv.lead_id && (input.interest || input.product) && (!leadInfo?.interest || leadInfo.interest === "Conversa pelo WhatsApp"))
          await admin.from("leads").update({ interest: String(input.interest ?? input.product).slice(0, 120) }).eq("id", conv.lead_id);
        Object.assign(conv, patch);
        return "Registrado.";
      }
      if (name === "request_human") { handoffData = input; await handoff(ctx, conv, input as any, "ai"); return "Transferido. Escreva só uma mensagem curta avisando o cliente."; }
      if (name === "schedule_followup") { scheduled = true; await scheduleFollowup(ctx, conv, C.nextAllowed(new Date(Date.now() + Number(input.hours_from_now) * 3600000), ctx.s.hours), 1, "ai", String(input.reason)); return "Agendado."; }
      if (name === "mark_opt_out") { await admin.from("ai_conversations").update({ opted_out: true }).eq("id", conv.id); return "Cliente não receberá mais mensagens. Responda só confirmando, em uma frase."; }
      return "Ferramenta desconhecida.";
    };
    let out: C.LoopOutcome;
    try { out = await C.runLoop(await provider(ctx), base, messages, exec); }
    catch (e) { const msg = friendlyAiError(e); await log(ctx.tenant, "error", "agente", msg, { conversation: conv.id }); return { error: msg }; }
    await recordUsage(ctx, conv, out.calls, "reply");
    if (out.stop === "refusal") {
      await handoff(ctx, conv, { reason: "A IA não pôde responder esta mensagem", summary: conv.summary ?? "", next_step: "Responder manualmente" }, "ai");
      return { stop: "refusal" };
    }
    const text = out.text || (out.stop === "handoff" ? ctx.s.handoff.message : out.stop === "opt_out" ? "Combinado, não envio mais mensagens por aqui. Obrigada pela atenção." : "");
    const sent = text ? await deliver(ctx, conv, text, { author: "ai", replyTo: inboundId }) : null;
    // Retomada automática: só se a conversa segue com a IA e nada foi agendado agora.
    const { data: now } = await admin.from("ai_conversations").select("status, opted_out, qualification").eq("id", conv.id).single();
    if (!scheduled && !handoffData && now?.status === "ai_active" && !now.opted_out && now.qualification !== "unqualified") {
      const due = C.planFollowup(1, ctx.s);
      if (due) await scheduleFollowup(ctx, conv, due, 1, "rule", "Cliente não respondeu");
    }
    return { stop: out.stop, text, delivery: sent, tools: out.tools.map((t) => t.name) };
  } finally { await admin.rpc("ai_release_conversation", { p_conv: convIn.id }); }
}

// Mensagem que chegou (WhatsApp ou simulação): grava, aplica as regras fixas e chama o agente.
async function inbound(ctx: Ctx, conv: Conv, text: string, kind: string, waMessageId: string | null, force = false) {
  const body = kind === "audio" ? "[Áudio recebido: a transcrição ainda não está configurada]" : kind !== "text" && !text ? `[${kind} recebido]` : text;
  const { data: msg, error } = await admin.from("ai_messages").insert({
    tenant_id: ctx.tenant, conversation_id: conv.id, direction: "in", author: "customer", kind: kind === "audio" ? "audio" : kind === "text" ? "text" : "media",
    body, wa_message_id: waMessageId, status: "received", is_test: conv.is_test,
  }).select("id").single();
  if (error) return { skipped: "mensagem repetida" };
  if (conv.opted_out) return { skipped: "cliente pediu para não receber mensagens" };
  if (C.isOptOut(body)) {
    await admin.from("ai_conversations").update({ opted_out: true }).eq("id", conv.id);
    await deliver(ctx, { ...conv, last_inbound_at: new Date().toISOString() }, "Combinado, não envio mais mensagens por aqui. Obrigada pela atenção.", { author: "system", replyTo: msg!.id });
    return { stop: "opt_out" };
  }
  if (conv.status !== "ai_active") {
    if (!conv.is_test) await notify(ctx.tenant, `Nova mensagem de ${conv.contact_name || conv.wa_id}`, body, conv.lead_id);
    return { skipped: "conversa com humano" };
  }
  if (C.wantsHuman(body)) {
    await handoff(ctx, conv, { reason: "O cliente pediu para falar com uma pessoa", summary: conv.summary ?? body, next_step: "Assumir a conversa" }, "customer");
    await deliver(ctx, { ...conv, last_inbound_at: new Date().toISOString() }, ctx.s.handoff.message, { author: "system", replyTo: msg!.id });
    return { stop: "handoff" };
  }
  if (!force && !ctx.s.hours.reply_off_hours && !C.inHours(new Date(), ctx.s.hours)) {
    if (!conv.is_test) await notify(ctx.tenant, `Mensagem fora do horário: ${conv.contact_name || conv.wa_id}`, body, conv.lead_id);
    return { skipped: "fora do horário" };
  }
  return agentReply(ctx, { ...conv, last_inbound_at: new Date().toISOString() }, msg!.id, force);
}

// ---------- follow-ups ----------
async function followupText(ctx: Ctx, conv: Conv, attempt: number): Promise<string> {
  const custom = (ctx.s.followup.messages ?? [])[attempt - 1];
  if (custom) return String(custom).replace(/\{nome\}/g, String(conv.contact_name ?? "").split(" ")[0] || "");
  const { data: hist } = await admin.from("ai_messages").select("direction, author, body").eq("conversation_id", conv.id).order("created_at", { ascending: false }).limit(30);
  const { data: kb } = await admin.from("ai_knowledge").select("kind, title, body").eq("tenant_id", ctx.tenant).eq("active", true);
  const msgs: any[] = C.toModelMessages(((hist ?? []) as C.Msg[]).reverse());
  msgs.push({ role: "user", content: `[Aviso do sistema, não é o cliente: o cliente não respondeu desde a sua última mensagem. Esta é a tentativa ${attempt} de retomada. Escreva uma mensagem curta e gentil retomando o assunto, sem pressão e sem repetir o que já disse.]` });
  const res = await (await provider(ctx)).chat({ system: [{ type: "text", text: C.systemStable(ctx.s, ctx.company, (kb ?? []) as C.KnowledgeItem[]), cache_control: { type: "ephemeral" } }], messages: msgs, tools: [] as any, model: ctx.s.model, effort: ctx.s.effort, maxTokens: 4000 });
  await recordUsage(ctx, conv, [res], "followup");
  return res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}
async function processFollowups(onlyTenant?: string) {
  const { data: due } = await admin.rpc("ai_claim_followups", { p_limit: 20 });
  const done: C.Json[] = [];
  for (const f of (due ?? []) as C.Json[]) {
    if (onlyTenant && f.tenant_id !== onlyTenant) { await admin.from("ai_followups").update({ locked_at: null }).eq("id", f.id); continue; }
    const finish = (status: string, reason: string) => admin.from("ai_followups").update({ status, reason, processed_at: new Date().toISOString(), locked_at: null }).eq("id", f.id);
    try {
      const ctx = await context(String(f.tenant_id));
      if (!ctx) { await finish("skipped", "módulo não liberado"); continue; }
      const { data: conv } = await admin.from("ai_conversations").select("*").eq("id", f.conversation_id).single();
      if (!conv || conv.status !== "ai_active" || conv.opted_out || conv.qualification === "unqualified") { await finish("canceled", "conversa fora da IA"); continue; }
      if (!conv.is_test && !ctx.s.active) { await admin.from("ai_followups").update({ locked_at: null, due_at: new Date(Date.now() + 3600000).toISOString() }).eq("id", f.id); continue; }
      if (!C.inHours(new Date(), ctx.s.hours)) { await admin.from("ai_followups").update({ locked_at: null, due_at: C.nextAllowed(new Date(), ctx.s.hours).toISOString() }).eq("id", f.id); continue; }
      const today = new Date(); today.setUTCHours(3, 0, 0, 0);   // meia-noite em São Paulo
      const { count } = await admin.from("ai_followups").select("id", { count: "exact", head: true }).eq("tenant_id", ctx.tenant).eq("status", "sent").gte("processed_at", today.toISOString());
      if ((count ?? 0) >= Number(ctx.s.followup.daily_limit || 50)) { await admin.from("ai_followups").update({ locked_at: null, due_at: C.nextAllowed(new Date(Date.now() + 86400000), ctx.s.hours).toISOString() }).eq("id", f.id); continue; }
      const realOutside = !conv.is_test && ctx.s.mode !== "simulation" && !C.within24h(conv.last_inbound_at);
      let r;
      if (realOutside) {
        if (!ctx.s.followup.template_name) { await finish("needs_template", "fora da janela de 24 h e sem template aprovado"); continue; }
        r = await deliver(ctx, conv, `[template ${ctx.s.followup.template_name}]`, { author: "ai", template: true });
      } else {
        const text = await followupText(ctx, conv, Number(f.attempt));
        if (!text) { await finish("failed", "a IA não gerou a mensagem"); continue; }
        r = await deliver(ctx, conv, text, { author: "ai" });
      }
      await finish(r && "status" in r && (r.status === "failed" || r.status === "blocked") ? "failed" : "sent", r && "error" in r && r.error ? String(r.error) : "enviado");
      const next = C.planFollowup(Number(f.attempt) + 1, ctx.s);
      if (next && !(r && "status" in r && r.status === "failed")) await scheduleFollowup(ctx, conv, next, Number(f.attempt) + 1, "rule", "Sem resposta");
      else if (!next) await admin.from("ai_conversations").update({ status: "waiting_customer" }).eq("id", conv.id);
      done.push({ id: f.id, status: r && "status" in r ? r.status : "?" });
    } catch (e) {
      await finish("failed", friendlyAiError(e));
      await log(String(f.tenant_id), "error", "followup", friendlyAiError(e), { followup: f.id });
    }
  }
  return done;
}

// ---------- webhook da Meta ----------
async function webhook(req: Request, slug: string) {
  const { data: t } = await admin.from("tenants").select("id").eq("slug", slug).maybeSingle();
  const ctx = t ? await context(t.id) : null;
  if (!ctx) return new Response("not found", { status: 404 });
  const url = new URL(req.url);
  if (req.method === "GET") {
    const verify = await secret(ctx.tenant, "wa_verify_token");
    if (url.searchParams.get("hub.mode") === "subscribe" && verify && url.searchParams.get("hub.verify_token") === verify)
      return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
    return new Response("forbidden", { status: 403 });
  }
  const raw = await req.text();
  if (!(await C.verifySignature(raw, req.headers.get("x-hub-signature-256"), await secret(ctx.tenant, "wa_app_secret")))) {
    await log(ctx.tenant, "warn", "webhook", "Assinatura inválida: evento ignorado.");
    return new Response("invalid signature", { status: 401 });
  }
  let body: C.Json; try { body = JSON.parse(raw); } catch { return new Response("bad json", { status: 400 }); }
  const { messages, statuses } = C.parseWebhook(body);
  const work = (async () => {
    for (const s of statuses) {
      const { error } = await admin.from("ai_wa_events").insert({ id: `${s.id}:${s.status}`, tenant_id: ctx.tenant, kind: "status", payload: s as any });
      if (error) continue;
      const map: Record<string, string> = { sent: "sent", delivered: "delivered", read: "read", failed: "failed" };
      if (map[s.status]) await admin.from("ai_messages").update({ status: map[s.status], error: s.error || null }).eq("wa_message_id", s.id);
    }
    for (const m of messages) {
      if (ctx.s.whatsapp.phone_number_id && m.phoneNumberId !== ctx.s.whatsapp.phone_number_id) { await log(ctx.tenant, "warn", "webhook", "Mensagem para outro número ignorada."); continue; }
      const { error } = await admin.from("ai_wa_events").insert({ id: m.id, tenant_id: ctx.tenant, kind: "message", payload: m as any });
      if (error) continue;   // evento repetido pela Meta
      try {
        const conv = await getConversation(ctx, m.from, m.name, false);
        const r = await inbound(ctx, conv, m.text, m.type, m.id);
        await admin.from("ai_wa_events").update({ processed_at: new Date().toISOString(), error: (r as any)?.error ?? null }).eq("id", m.id);
      } catch (e) {
        await admin.from("ai_wa_events").update({ error: friendlyAiError(e) }).eq("id", m.id);
        await log(ctx.tenant, "error", "webhook", friendlyAiError(e));
      }
    }
  })();
  // A Meta espera resposta rápida: o processamento continua depois do 200.
  (globalThis as any).EdgeRuntime?.waitUntil?.(work) ?? (await work);
  return new Response("ok", { status: 200 });
}

// ---------- ações do CRM ----------
const SECTIONS = ["persona", "sales", "qualification", "followup", "handoff", "hours", "limits", "whatsapp"];
async function saveSettings(ctx: Ctx, b: C.Json, userId: string) {
  const patch: C.Json = { updated_at: new Date().toISOString(), updated_by: userId };
  const sec = String(b.section ?? "");
  if (SECTIONS.includes(sec)) patch[sec] = { ...(ctx.s as any)[sec], ...((b.data as C.Json) ?? {}) };
  else if (sec === "prompt") patch.prompt = String((b.data as C.Json)?.prompt ?? "").slice(0, 8000);
  else if (sec === "agent") {
    const d = (b.data as C.Json) ?? {}, keys = await admin.rpc("ai_secret_list", { p_tenant: ctx.tenant }).then((r) => (r.data ?? {}) as C.Json);
    const mode = String(d.mode ?? ctx.s.mode), provider = String(d.provider ?? ctx.s.provider), active = d.active === undefined ? ctx.s.active : !!d.active;
    if (!["simulation", "development", "production"].includes(mode)) return { error: "Modo inválido." };
    if (!["anthropic", "meta"].includes(provider)) return { error: "Provedor inválido." };
    const needAi = provider === "anthropic" && !keys.anthropic_api_key;
    if ((active || mode !== "simulation") && needAi) return { error: "Configure a chave da API do Claude antes de ligar o agente ou sair da simulação." };
    if (mode === "production") {
      const w = { ...ctx.s.whatsapp, ...((b.whatsapp as C.Json) ?? {}) };
      const falta = [!w.phone_number_id && "Phone Number ID", !keys.wa_access_token && "Access Token", !keys.wa_app_secret && "App Secret", !keys.wa_verify_token && "Verify Token"].filter(Boolean);
      if (falta.length) return { error: `Para entrar em produção falta: ${falta.join(", ")}.` };
    }
    Object.assign(patch, { mode, provider, active, model: String(d.model ?? ctx.s.model).slice(0, 60), effort: ["low", "medium", "high"].includes(String(d.effort)) ? d.effort : ctx.s.effort });
  } else return { error: "Seção inválida." };
  const { error } = await admin.from("ai_settings").update(patch).eq("tenant_id", ctx.tenant);
  if (error) return { error: "Não deu para salvar." };
  await log(ctx.tenant, "info", "config", `Configuração "${sec}" alterada.`, { by: userId });
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url), slug = url.searchParams.get("wh");
  if (slug) return webhook(req, slug);
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  let b: C.Json; try { b = await req.json(); } catch { return json({ error: "Corpo inválido." }, 400); }

  // Fila de follow-ups, chamada pelo agendador do banco.
  const interno = req.headers.get("x-interno");
  if (interno) {
    const { data: s } = await admin.rpc("vault_get", { p_name: "interno" });
    if (!s || interno !== s) return json({ error: "Não autorizado." }, 401);
    return json({ ok: true, processed: await processFollowups() });
  }

  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { data: u } = await admin.auth.getUser(jwt);
  if (!u?.user) return json({ error: "Entre no CRM." }, 401);
  const tenant = String(b.tenant_id ?? "");
  const ctx = await context(tenant);
  if (!ctx) return json({ error: "Módulo indisponível." }, 404);
  const { data: m } = await admin.from("memberships").select("role").eq("tenant_id", tenant).eq("user_id", u.user.id).maybeSingle();
  const role = String(m?.role ?? "");
  if (!["owner", "admin", "sales"].includes(role)) return json({ error: "Seu perfil não usa o AI Sales." }, 403);
  const isAdmin = role === "owner" || role === "admin", userId = u.user.id;
  const conv = async () => { const { data } = await admin.from("ai_conversations").select("*").eq("id", String(b.conversation_id ?? "")).eq("tenant_id", tenant).maybeSingle(); return data; };

  try {
    switch (b.action) {
      case "status": {
        const [keys, cost] = await Promise.all([admin.rpc("ai_secret_list", { p_tenant: tenant }), admin.rpc("ai_month_cost", { p_tenant: tenant })]);
        return json({ enabled: true, admin: isAdmin, settings: ctx.s, secrets: isAdmin ? keys.data ?? {} : {}, month_cost: Number(cost.data ?? 0), webhook_url: `${URL_}/functions/v1/ai-sales?wh=${ctx.slug}` });
      }
      case "save": if (!isAdmin) return json({ error: "Só dono e admin mudam as configurações." }, 403); return json(await saveSettings(ctx, b, userId));
      case "secret": {
        if (!isAdmin) return json({ error: "Só dono e admin mudam as credenciais." }, 403);
        const { error } = await admin.rpc("ai_secret_set", { p_tenant: tenant, p_name: String(b.name ?? ""), p_value: String(b.value ?? "") });
        if (error) return json({ error: "Campo inválido." }, 400);
        await log(tenant, "info", "credenciais", `Credencial ${b.name} ${b.value ? "gravada" : "apagada"}.`, { by: userId });
        return json({ ok: true });
      }
      case "testProvider": {
        if (!isAdmin) return json({ error: "Só dono e admin." }, 403);
        try {
          const res = await (await provider(ctx)).chat({ system: [{ type: "text", text: "Responda só com a palavra ok." }], messages: [{ role: "user", content: "teste" }], tools: [] as any, model: ctx.s.model, effort: "low", maxTokens: 2000 });
          await recordUsage(ctx, { id: null, is_test: true }, [res], "test");
          return json({ ok: true, model: res.model, reply: res.content.filter((x) => x.type === "text").map((x) => x.text).join(" ").slice(0, 80) });
        } catch (e) { return json({ error: friendlyAiError(e) }, 400); }
      }
      case "simulate": {
        const text = String(b.text ?? "").trim().slice(0, 2000);
        if (!text) return json({ error: "Escreva a mensagem do cliente." }, 400);
        const c = b.conversation_id ? await conv() : await getConversation(ctx, `sim${Date.now().toString().slice(-9)}`, String(b.contact_name ?? "Cliente de teste").slice(0, 60), true);
        if (!c || !c.is_test) return json({ error: "Simulação só em conversa de teste." }, 400);
        const r = await inbound(ctx, c, text, "text", null, true);
        return json({ ok: true, conversation_id: c.id, result: r });
      }
      case "send": {
        const c = await conv(); const text = String(b.text ?? "").trim().slice(0, 4000);
        if (!c || !text) return json({ error: "Conversa ou mensagem inválida." }, 400);
        if (!c.is_test && c.status !== "human_assigned") return json({ error: "Assuma a conversa antes de responder." }, 409);
        if (c.opted_out) return json({ error: "Este contato pediu para não receber mensagens." }, 409);
        return json(await deliver(ctx, c, text, { author: "human", userId }));
      }
      case "takeover": {
        const c = await conv(); if (!c) return json({ error: "Conversa não encontrada." }, 404);
        await admin.from("ai_conversations").update({ status: "human_assigned", assigned_to: userId }).eq("id", c.id);
        await admin.from("ai_handoffs").update({ assigned_to: userId }).eq("conversation_id", c.id).is("resolved_at", null);
        if (c.status === "ai_active") await admin.from("ai_handoffs").insert({ tenant_id: tenant, conversation_id: c.id, reason: "Vendedor assumiu a conversa", summary: c.summary, requested_by: "human", assigned_to: userId, is_test: c.is_test });
        await log(tenant, "info", "handoff", "Conversa assumida.", { conversation: c.id, by: userId });
        return json({ ok: true });
      }
      case "release": {
        const c = await conv(); if (!c) return json({ error: "Conversa não encontrada." }, 404);
        if (c.opted_out) return json({ error: "Este contato pediu para não receber mensagens." }, 409);
        await admin.from("ai_conversations").update({ status: "ai_active", assigned_to: null }).eq("id", c.id);
        await admin.from("ai_handoffs").update({ resolved_at: new Date().toISOString(), resolution: "Devolvida para a IA" }).eq("conversation_id", c.id).is("resolved_at", null);
        await log(tenant, "info", "handoff", "Conversa devolvida para a IA.", { conversation: c.id, by: userId });
        return json({ ok: true });
      }
      case "close": {
        const c = await conv(); if (!c) return json({ error: "Conversa não encontrada." }, 404);
        await admin.from("ai_conversations").update({ status: "closed" }).eq("id", c.id);
        await admin.from("ai_handoffs").update({ resolved_at: new Date().toISOString(), resolution: String(b.resolution ?? "Conversa encerrada") }).eq("conversation_id", c.id).is("resolved_at", null);
        return json({ ok: true });
      }
      case "handoff": {
        const c = await conv(); if (!c) return json({ error: "Conversa não encontrada." }, 404);
        await handoff(ctx, c, { reason: String(b.reason ?? "Transferência manual").slice(0, 300), summary: c.summary ?? "", next_step: "Assumir a conversa" }, "human");
        return json({ ok: true });
      }
      case "followup": {
        const c = await conv(); if (!c) return json({ error: "Conversa não encontrada." }, 404);
        const h = Math.max(1, Math.min(720, Number(b.hours) || 24));
        await scheduleFollowup(ctx, c, C.nextAllowed(new Date(Date.now() + h * 3600000), ctx.s.hours), 1, "human", String(b.note ?? "Agendado pelo vendedor").slice(0, 300));
        return json({ ok: true });
      }
      case "cancelFollowup": {
        await admin.from("ai_followups").update({ status: "canceled", reason: "Cancelado pelo vendedor", processed_at: new Date().toISOString() }).eq("id", String(b.id ?? "")).eq("tenant_id", tenant).eq("status", "pending");
        return json({ ok: true });
      }
      case "runFollowups": if (!isAdmin) return json({ error: "Só dono e admin." }, 403); return json({ ok: true, processed: await processFollowups(tenant) });
      default: return json({ error: "Ação desconhecida." }, 400);
    }
  } catch (e) {
    await log(tenant, "error", "acao", friendlyAiError(e), { action: b.action });
    return json({ error: "Não deu certo. Tente de novo." }, 500);
  }
});
