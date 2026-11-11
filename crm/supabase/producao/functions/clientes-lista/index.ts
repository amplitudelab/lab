// Lista interna de sites de clientes. Só responde com os sites depois do código de acesso do dono.
// O código nunca fica aqui nem no repositório: a conferência usa o hash em `access_codes`, o mesmo do CRM.
// Para incluir um cliente novo, acrescente uma linha em SITES e faça o deploy desta função.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SITES = [
  {
    nome: "BRUXO",
    sobre: "DJ · Progressive, Hard e Hi-Tech · nov 2026",
    url: "../bruxo/",
    endereco: "amplitudelab.github.io/lab/bruxo/",
    inicial: "BX",
    cor: "#e0a44a",
    fundo: "#2a1038",
  },
  {
    nome: "Bruno Zampieri",
    sobre: "Criador · modelagem, drone e massoterapia · nov 2026",
    url: "../bruno-zampieri/",
    endereco: "amplitudelab.github.io/lab/bruno-zampieri/",
    inicial: "BZ",
    cor: "#ffb35c",
    fundo: "#2a1c13",
  },
  {
    nome: "DARKY",
    sobre: "DJ · Darky, Slowly e Obskurial · nov 2026",
    url: "../darky/",
    endereco: "amplitudelab.github.io/lab/darky/",
    inicial: "DK",
    cor: "#9a6bff",
    fundo: "#120a22",
  },
];

const SLUG = "amplitudelab";
const IP_LIMIT = 5, IP_JANELA = 15, TENANT_LIMIT = 10, TENANT_JANELA = 60;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const hex = (b: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(b as ArrayBuffer)].map((x) => x.toString(16).padStart(2, "0")).join("");
const unhex = (s: string) => Uint8Array.from(s.match(/../g)!.map((x) => parseInt(x, 16)));

async function derive(code: string, salt: string, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: unhex(salt), iterations }, key, 256));
}
// comparação de tempo fixo, para o erro não contar quanto do código estava certo
function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
const since = (min: number) => new Date(Date.now() - min * 60000).toISOString();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: "Pedido inválido." }, 400); }
  const code = String(b.code ?? "").trim().toLowerCase();

  const { data: tenant } = await admin.from("tenants").select("id").eq("slug", SLUG).maybeSingle();
  if (!tenant) return json({ error: "Código incorreto." }, 401);

  const ip = (req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "desconhecido").split(",")[0].trim();
  const [{ count: porIp }, { count: porTenant }] = await Promise.all([
    admin.from("access_code_attempts").select("id", { count: "exact", head: true }).eq("ip", ip).gte("at", since(IP_JANELA)),
    admin.from("access_code_attempts").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id).gte("at", since(TENANT_JANELA)),
  ]);
  if ((porIp ?? 0) >= IP_LIMIT || (porTenant ?? 0) >= TENANT_LIMIT) {
    return json({ error: "Muitas tentativas. Aguarde um pouco e tente de novo." }, 429);
  }

  const { data: row } = await admin.from("access_codes").select("salt, hash, iterations").eq("tenant_id", tenant.id).maybeSingle();
  const ok = !!row && !!code && same(await derive(code, row.salt, row.iterations), row.hash);
  if (!ok) {
    await admin.from("access_code_attempts").insert({ tenant_id: tenant.id, ip });
    await admin.from("access_code_attempts").delete().lt("at", since(1440));
    return json({ error: "Código incorreto." }, 401);
  }

  return json({ sites: SITES });
});
