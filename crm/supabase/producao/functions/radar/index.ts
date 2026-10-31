// Radar de leads, parte do servidor: só entra quando há chave de uma fonte com limite próprio.
// Sem chave responde { nokey: true } na hora, e o navegador usa os mapas abertos diretamente.
// Segredos aceitos: GEOAPIFY_KEY (grátis, 3.000 créditos por dia) e GOOGLE_PLACES_KEY.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

const GEOAPIFY: Record<string, string> = {
  barbearia: "service.beauty.hairdresser", tattoo: "service.tattoo", clinica: "healthcare.dentist,healthcare.clinic_or_praxis", restaurante: "catering.restaurant,catering.fast_food,catering.cafe",
  academia: "sport.fitness", salao: "service.beauty", loja: "commercial.clothing,commercial.gift_and_souvenir,commercial.houseware_and_hardware", fotografia: "commercial.hobby.photo", evento: "entertainment.culture,adult.nightclub",
  pet: "commercial.pet,pet.veterinary", mecanica: "service.vehicle.repair", padaria: "commercial.food_and_drink.bakery", contabil: "office.accountant,office.lawyer,office.estate_agent", escola: "education.language_school,education.driving_school,education.music_school",
};
const GOOGLE_TERM: Record<string, string> = {
  barbearia: "barbearia", tattoo: "estúdio de tatuagem", clinica: "clínica odontológica", restaurante: "restaurante", academia: "academia", salao: "salão de beleza", loja: "loja de roupas",
  fotografia: "fotógrafo", evento: "casa de eventos", pet: "pet shop", mecanica: "oficina mecânica", padaria: "padaria", contabil: "escritório de contabilidade", escola: "escola de idiomas",
};
const SOCIAL = /instagram\.com|facebook\.com|fb\.com|wa\.me|whatsapp\.com|linktr\.ee|tiktok\.com/i;
const digits = (s: unknown) => String(s ?? "").split(";")[0].replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");

async function timed(url: string, init: RequestInit, ms: number) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { const r = await fetch(url, { ...init, signal: c.signal }); if (!r.ok) throw new Error(String(r.status)); return await r.json(); } finally { clearTimeout(t); }
}
async function fromGeoapify(seg: string, lat: number, lon: number, km: number, key: string) {
  const u = `https://api.geoapify.com/v2/places?categories=${GEOAPIFY[seg]}&filter=circle:${lon},${lat},${Math.round(km * 1000)}&bias=proximity:${lon},${lat}&limit=500&lang=pt&apiKey=${encodeURIComponent(key)}`;
  const data = await timed(u, {}, 18000);
  return { source: "Geoapify", items: (data.features ?? []).map((f: any) => {
    const p = f.properties ?? {}, raw = p.datasource?.raw ?? {}, site = p.website || p.contact?.website || raw.website || raw["contact:website"] || "";
    return { id: `geoapify:${p.place_id}`, name: p.name, phone: digits(p.contact?.phone || raw.phone || raw["contact:phone"] || raw["contact:whatsapp"]), email: p.contact?.email || raw.email || "",
      address: p.address_line2 || p.formatted || "", suburb: p.suburb || p.district || "", site: SOCIAL.test(site) ? "" : site, instagram: raw["contact:instagram"] || (/instagram\.com/i.test(site) ? site : ""), lat: p.lat, lon: p.lon, map: "" };
  }).filter((i: any) => i.name) };
}
async function fromGoogle(seg: string, lat: number, lon: number, km: number, key: string) {
  const data = await timed("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.googleMapsUri,places.businessStatus,places.location" },
    body: JSON.stringify({ textQuery: GOOGLE_TERM[seg], languageCode: "pt-BR", regionCode: "BR", pageSize: 20, locationBias: { circle: { center: { latitude: lat, longitude: lon }, radius: Math.min(50000, km * 1000) } } }),
  }, 15000);
  return { source: "Google Maps", items: (data.places ?? []).filter((p: any) => p.businessStatus !== "CLOSED_PERMANENTLY").map((p: any) => {
    const site = p.websiteUri ?? "";
    return { id: `google:${p.id}`, name: p.displayName?.text, phone: digits(p.nationalPhoneNumber), email: "", address: p.formattedAddress ?? "", suburb: "", site: SOCIAL.test(site) ? "" : site, instagram: /instagram\.com/i.test(site) ? site : "", lat: p.location?.latitude, lon: p.location?.longitude, map: p.googleMapsUri ?? "" };
  }).filter((i: any) => i.name) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: "Corpo inválido." }, 400); }
  const seg = String(b.segment ?? ""), lat = Number(b.lat), lon = Number(b.lon), km = Math.min(50, Math.max(1, Number(b.km) || 5));
  if (!GEOAPIFY[seg]) return json({ error: "Segmento inválido." }, 400);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return json({ error: "Local inválido." }, 400);

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { data: u } = await admin.auth.getUser(token);
  if (!u?.user) return json({ error: "Entre no CRM para usar o Radar." }, 401);
  const tenant = String(b.tenant_id ?? "");
  const { data: m } = await admin.from("memberships").select("role").eq("tenant_id", tenant).eq("user_id", u.user.id).in("role", ["owner", "admin", "sales"]).maybeSingle();
  if (!m) return json({ error: "Seu perfil não usa o Radar." }, 403);
  const { data: t } = await admin.from("tenants").select("plan").eq("id", tenant).single();
  if (t?.plan === "essencial") return json({ error: "O Radar faz parte do plano Pro.", upgrade: true }, 402);

  const geo = Deno.env.get("GEOAPIFY_KEY"), google = Deno.env.get("GOOGLE_PLACES_KEY");
  if (geo) { try { return json(await fromGeoapify(seg, lat, lon, km, geo)); } catch (e) { console.error("geoapify", e); } }
  if (google) { try { return json(await fromGoogle(seg, lat, lon, km, google)); } catch (e) { console.error("google", e); } }
  return json({ nokey: true });
});
