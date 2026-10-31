// Link de uso único para entrar no painel em outro aparelho. Só gera para a própria conta de quem já está logado.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { data: u } = await admin.auth.getUser(jwt);
  if (!u?.user?.email) return json({ error: "Entre no CRM para gerar o link." }, 401);
  const { count } = await admin.from("memberships").select("user_id", { count: "exact", head: true }).eq("user_id", u.user.id);
  if (!count) return json({ error: "Esta conta não tem acesso a nenhum painel." }, 403);
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: u.user.email });
  if (error || !data?.properties?.hashed_token) { console.error(error); return json({ error: "Não deu para gerar o link. Tente de novo." }, 500); }
  console.log("device-link", u.user.id);
  return json({ token: data.properties.hashed_token });
});
