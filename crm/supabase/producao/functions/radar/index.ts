// Radar de leads, parte do servidor: só entra quando há chave de uma fonte com limite próprio.
// Sem chave responde { nokey: true } na hora, e o navegador usa os mapas abertos diretamente.
// Segredos aceitos, na ordem em que são tentados: SERPER_API_KEY (Google Maps pela Serper.dev) com SERPER_MONTHLY_CALLS
// (teto do mês, padrão 2000), GOOGLE_PLACES_KEY com GOOGLE_MONTHLY_CALLS (padrão 900) e GEOAPIFY_KEY.
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
// "Sem site profissional": vazio ou apontando para rede social, WhatsApp, agregador de links ou iFood.
// A mesma lista está em crm/app/index.html (SOCIAL_HOSTS): mude nos dois lugares.
const SOCIAL_HOSTS = ["instagram.com", "facebook.com", "fb.com", "fb.me", "wa.me", "whatsapp.com", "linktr.ee", "bio.link", "ifood.com.br", "tiktok.com"];
const SOCIAL = /instagram\.com|facebook\.com|fb\.com|fb\.me|wa\.me|whatsapp\.com|linktr\.ee|bio\.link|ifood\.com\.br|tiktok\.com/i;
function isSocialUrl(url: string) {
  try {
    const h = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.toLowerCase();
    return SOCIAL_HOSTS.some((d) => h === d || h.endsWith(`.${d}`));
  } catch { return SOCIAL.test(url); }
}
// Separa o site do negócio do link de rede social, sem perder o link: ele fica em link_social para o CRM abrir.
function siteFields(raw: unknown, instagram = "") {
  const url = String(raw ?? "").trim();
  const social = !!url && isSocialUrl(url);
  return {
    site: social ? "" : url,
    tem_site_proprio: !!url && !social,
    link_social: social ? url : "",
    instagram: instagram || (social && /instagram\.com/i.test(url) ? url : ""),
  };
}
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
      address: p.address_line2 || p.formatted || "", suburb: p.suburb || p.district || "", ...siteFields(site, raw["contact:instagram"] || ""), lat: p.lat, lon: p.lon, map: "" };
  }).filter((i: any) => i.name) };
}
// Cada pedido traz no máximo 20 lugares. Por isso a área vira uma grade, com até 3 páginas por quadrado.
// Cada quadrado fica guardado por 30 dias, e o mês tem um teto de pedidos (GOOGLE_MONTHLY_CALLS, padrão 900),
// abaixo dos 1.000 grátis do Google para buscas que trazem telefone e site.
const CAP = Number(Deno.env.get("GOOGLE_MONTHLY_CALLS") ?? 900);
async function googleCell(seg: string, low: any, high: any, key: string, budget: { left: number, used: number }) {
  const ck = `g:${seg}:${low.latitude.toFixed(3)}:${low.longitude.toFixed(3)}:${high.latitude.toFixed(3)}:${high.longitude.toFixed(3)}`;
  const { data: hit } = await admin.from("radar_cache").select("items").eq("key", ck).gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()).maybeSingle();
  if (hit) return { items: hit.items as any[], cut: false };
  const items: any[] = [];
  let pageToken = "", cut = false;
  for (let page = 0; page < 3; page++) {
    if (budget.left <= 0) { cut = true; break; }
    budget.left--; budget.used++;
    const data = await timed("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.googleMapsUri,places.businessStatus,places.location,nextPageToken" },
      body: JSON.stringify({ textQuery: GOOGLE_TERM[seg], languageCode: "pt-BR", regionCode: "BR", pageSize: 20, locationRestriction: { rectangle: { low, high } }, ...(pageToken ? { pageToken } : {}) }),
    }, 15000);
    for (const p of data.places ?? []) {
      if (p.businessStatus === "CLOSED_PERMANENTLY" || !p.displayName?.text) continue;
      const site = p.websiteUri ?? "";
      items.push({ id: `google:${p.id}`, name: p.displayName.text, phone: digits(p.nationalPhoneNumber), email: "", address: p.formattedAddress ?? "", suburb: "", ...siteFields(site), lat: p.location?.latitude, lon: p.location?.longitude, map: p.googleMapsUri ?? "" });
    }
    pageToken = data.nextPageToken ?? "";
    if (!pageToken) break;
  }
  if (!cut) await admin.from("radar_cache").upsert({ key: ck, items, created_at: new Date().toISOString() });
  return { items, cut };
}
async function fromGoogle(seg: string, lat: number, lon: number, km: number, key: string) {
  const n = km <= 3 ? 1 : km <= 8 ? 2 : 3, dLat = km / 111, dLon = km / (111 * Math.cos(lat * Math.PI / 180)), out = new Map<string, any>();
  const { data: u } = await admin.from("radar_usage").select("calls").eq("month", new Date().toISOString().slice(0, 7)).maybeSingle();
  const budget = { left: Math.max(0, Math.min(18, CAP - (u?.calls ?? 0))), used: 0 };
  let cut = false;
  try {
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
      const low = { latitude: lat - dLat + 2 * dLat * a / n, longitude: lon - dLon + 2 * dLon * b / n };
      const high = { latitude: lat - dLat + 2 * dLat * (a + 1) / n, longitude: lon - dLon + 2 * dLon * (b + 1) / n };
      const r = await googleCell(seg, low, high, key, budget);
      cut = cut || r.cut;
      for (const it of r.items) if (!out.has(it.id)) out.set(it.id, it);
    }
  } finally {
    if (budget.used) await admin.rpc("radar_use", { p_calls: budget.used });
  }
  if (!out.size && cut) throw new Error("teto do mês");
  return { source: cut ? "Google Maps (o teto grátis do mês acabou: parte da área ficou de fora)" : "Google Maps", items: [...out.values()] };
}

// Serper.dev (Google Maps): cada página traz até 20 lugares em volta de um ponto (ll = @lat,lon,zoom).
// A área vira uma grade como no Google, com até 3 páginas por quadrado; cada quadrado fica guardado 30 dias
// em radar_cache, e o mês tem um teto próprio (SERPER_MONTHLY_CALLS, padrão 2000), contado em radar_usage
// com a chave "serper:AAAA-MM".
const SERPER_CAP = Number(Deno.env.get("SERPER_MONTHLY_CALLS") ?? 2000);
const SERPER_PAGES = 3;
// Zoom do Google Maps que cobre, mais ou menos, um quadrado com essa metade de lado em km.
const serperZoom = (halfKm: number) => halfKm <= 1 ? 16 : halfKm <= 2 ? 15 : halfKm <= 4 ? 14 : halfKm <= 8 ? 13 : halfKm <= 16 ? 12 : 11;
function serperItem(p: any) {
  const key = p.cid || p.placeId;
  if (!key || !p.title) return null;
  return {
    id: `serper:${key}`, name: p.title, phone: digits(p.phoneNumber), email: "", address: p.address ?? "", suburb: "",
    ...siteFields(p.website), lat: p.latitude, lon: p.longitude,
    map: p.cid ? `https://www.google.com/maps?cid=${p.cid}` : `https://www.google.com/maps/place/?q=place_id:${p.placeId}`,
    rating: p.rating ?? null, reviews: p.ratingCount ?? null, category: p.type ?? (p.types?.[0] ?? ""), cid: p.cid ?? "", place_id: p.placeId ?? "",
  };
}
async function serperCell(seg: string, lat: number, lon: number, zoom: number, key: string, budget: { left: number, used: number }) {
  const ck = `s:${seg}:${lat.toFixed(3)}:${lon.toFixed(3)}:${zoom}`;
  const { data: hit } = await admin.from("radar_cache").select("items").eq("key", ck).gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()).maybeSingle();
  if (hit) return { items: hit.items as any[], cut: false };
  const seen = new Map<string, any>();
  let cut = false;
  for (let page = 1; page <= SERPER_PAGES; page++) {
    if (budget.left <= 0) { cut = true; break; }
    budget.left--; budget.used++;
    const data = await timed("https://google.serper.dev/maps", {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({ q: GOOGLE_TERM[seg], ll: `@${lat.toFixed(6)},${lon.toFixed(6)},${zoom}z`, gl: "br", hl: "pt-br", page }),
    }, 15000);
    const places: any[] = data.places ?? [];
    let fresh = 0;
    for (const p of places) {
      const it = serperItem(p);
      if (it && !seen.has(it.id)) { seen.set(it.id, it); fresh++; }
    }
    // página curta ou repetida: acabou a lista desse ponto, não gasta mais crédito
    if (places.length < 20 || !fresh) break;
  }
  const items = [...seen.values()];
  if (!cut) await admin.from("radar_cache").upsert({ key: ck, items, created_at: new Date().toISOString() });
  return { items, cut };
}
async function fromSerper(seg: string, lat: number, lon: number, km: number, key: string) {
  const n = km <= 3 ? 1 : km <= 8 ? 2 : 3, dLat = km / 111, dLon = km / (111 * Math.cos(lat * Math.PI / 180)), zoom = serperZoom(km / n);
  const month = `serper:${new Date().toISOString().slice(0, 7)}`;
  const { data: u } = await admin.from("radar_usage").select("calls").eq("month", month).maybeSingle();
  const budget = { left: Math.max(0, Math.min(n * n * SERPER_PAGES, SERPER_CAP - (u?.calls ?? 0))), used: 0 };
  const cells: [number, number][] = [];
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) cells.push([lat - dLat + dLat * (2 * a + 1) / n, lon - dLon + dLon * (2 * b + 1) / n]);
  let results: { items: any[], cut: boolean }[];
  try {
    // quadrados em paralelo para não estourar o tempo da função; o orçamento é dividido entre eles
    results = await Promise.all(cells.map(([la, lo]) => serperCell(seg, la, lo, zoom, key, budget).catch((e) => { console.error("serper cell", e); return { items: [], cut: true }; })));
  } finally {
    if (budget.used) await admin.rpc("radar_use_src", { p_src: "serper", p_calls: budget.used });
  }
  const out = new Map<string, any>();
  let cut = false;
  for (const r of results) { cut = cut || r.cut; for (const it of r.items) if (!out.has(it.id)) out.set(it.id, it); }
  if (!out.size && cut) throw new Error("serper sem resposta ou teto do mês");
  return { source: cut ? "Google Maps via Serper (parte da área ficou de fora: teto do mês ou falha)" : "Google Maps via Serper", items: [...out.values()] };
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

  const geo = Deno.env.get("GEOAPIFY_KEY"), google = Deno.env.get("GOOGLE_PLACES_KEY"), serper = Deno.env.get("SERPER_API_KEY");
  if (serper) { try { return json(await fromSerper(seg, lat, lon, km, serper)); } catch (e) { console.error("serper", e); } }
  if (google) { try { return json(await fromGoogle(seg, lat, lon, km, google)); } catch (e) { console.error("google", e); } }
  if (geo) { try { return json(await fromGeoapify(seg, lat, lon, km, geo)); } catch (e) { console.error("geoapify", e); } }
  return json({ nokey: true });
});
