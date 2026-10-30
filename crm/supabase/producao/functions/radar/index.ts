// Radar de leads: acha negócios de um segmento numa região e separa os que não têm site.
// Fonte padrão: OpenStreetMap (grátis). Com GOOGLE_PLACES_KEY nos segredos, usa o Google Maps.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const UA = "AmplitudeCRM/1.0 (+https://amplitudelab.github.io/lab/)";

// Só estes segmentos entram na consulta: nada digitado pelo usuário vai para a linguagem de busca.
const OSM: Record<string, string[]> = {
  barbearia: ['["shop"="hairdresser"]', '["shop"="barber"]'],
  tattoo: ['["shop"="tattoo"]'],
  clinica: ['["amenity"="dentist"]', '["amenity"="clinic"]', '["amenity"="doctors"]', '["healthcare"]'],
  restaurante: ['["amenity"="restaurant"]', '["amenity"="fast_food"]', '["amenity"="cafe"]'],
  academia: ['["leisure"="fitness_centre"]'],
  salao: ['["shop"="beauty"]', '["shop"="hairdresser"]'],
  loja: ['["shop"="clothes"]', '["shop"="shoes"]', '["shop"="gift"]', '["shop"="furniture"]'],
  fotografia: ['["craft"="photographer"]', '["shop"="photo"]'],
  evento: ['["amenity"="events_venue"]', '["amenity"="nightclub"]'],
  pet: ['["shop"="pet"]', '["amenity"="veterinary"]'],
  mecanica: ['["shop"="car_repair"]'],
  padaria: ['["shop"="bakery"]', '["shop"="pastry"]'],
};
const GOOGLE_TERM: Record<string, string> = {
  barbearia: "barbearia", tattoo: "estúdio de tatuagem", clinica: "clínica odontológica", restaurante: "restaurante", academia: "academia",
  salao: "salão de beleza", loja: "loja de roupas", fotografia: "fotógrafo", evento: "casa de eventos", pet: "pet shop", mecanica: "oficina mecânica", padaria: "padaria",
};
const SOCIAL = /instagram\.com|facebook\.com|fb\.com|wa\.me|whatsapp\.com|linktr\.ee|tiktok\.com/i;
const digits = (s: unknown) => String(s ?? "").split(";")[0].replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");

async function fromOsm(seg: string, area: string) {
  const geo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(area)}`, { headers: { "User-Agent": UA } }).then((r) => r.json());
  if (!geo?.[0]) return { error: "Não encontrei essa região. Tente bairro e cidade, como Vila Prudente, São Paulo." };
  const lat = Number(geo[0].lat), lon = Number(geo[0].lon), r = 4000;
  const q = `[out:json][timeout:25];(${OSM[seg].map((t) => `nwr${t}["name"](around:${r},${lat},${lon});`).join("")});out center tags 200;`;
  for (const host of ["https://overpass-api.de", "https://overpass.kumi.systems"]) {
    const res = await fetch(`${host}/api/interpreter`, { method: "POST", headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" }, body: "data=" + encodeURIComponent(q) }).catch(() => null);
    if (!res?.ok) continue;
    const data = await res.json().catch(() => null);
    if (!data) continue;
    return { items: (data.elements ?? []).map((e: any) => {
      const t = e.tags ?? {};
      const site = t.website || t["contact:website"] || t.url || "";
      const insta = t["contact:instagram"] || (/instagram\.com/i.test(site) ? site : "");
      return {
        id: `osm:${e.type}/${e.id}`, name: t.name,
        phone: digits(t["contact:whatsapp"] || t["contact:mobile"] || t.phone || t["contact:phone"]),
        address: [t["addr:street"], t["addr:housenumber"], t["addr:suburb"]].filter(Boolean).join(", "),
        site: SOCIAL.test(site) ? "" : site, instagram: insta,
        map: `https://www.openstreetmap.org/${e.type}/${e.id}`,
      };
    }) };
  }
  return { error: "O serviço de mapas está ocupado. Tente de novo em 1 minuto." };
}

async function fromGoogle(seg: string, area: string, key: string) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.googleMapsUri,places.businessStatus" },
    body: JSON.stringify({ textQuery: `${GOOGLE_TERM[seg]} em ${area}`, languageCode: "pt-BR", regionCode: "BR", pageSize: 20 }),
  });
  if (!res.ok) return { error: "O Google Maps recusou a busca. Confira a chave e a cobrança da API." };
  const data = await res.json();
  return { items: (data.places ?? []).filter((p: any) => p.businessStatus !== "CLOSED_PERMANENTLY").map((p: any) => {
    const site = p.websiteUri ?? "";
    return { id: `google:${p.id}`, name: p.displayName?.text, phone: digits(p.nationalPhoneNumber), address: p.formattedAddress ?? "",
      site: SOCIAL.test(site) ? "" : site, instagram: /instagram\.com/i.test(site) ? site : "", map: p.googleMapsUri ?? "" };
  }) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { data: u } = await admin.auth.getUser(token);
  if (!u?.user) return json({ error: "Entre no CRM para usar o Radar." }, 401);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: "Corpo inválido." }, 400); }
  const tenant = String(b.tenant_id ?? ""), seg = String(b.segment ?? ""), area = String(b.area ?? "").trim().slice(0, 120);
  const { data: m } = await admin.from("memberships").select("role").eq("tenant_id", tenant).eq("user_id", u.user.id).in("role", ["owner", "admin", "sales"]).maybeSingle();
  if (!m) return json({ error: "Seu perfil não usa o Radar." }, 403);
  if (!OSM[seg]) return json({ error: "Segmento inválido." }, 400);
  if (area.length < 3) return json({ error: "Digite o bairro ou a cidade." }, 400);

  const key = Deno.env.get("GOOGLE_PLACES_KEY");
  const out = key ? await fromGoogle(seg, area, key) : await fromOsm(seg, area);
  if ("error" in out) return json({ error: out.error }, 502);

  // Marca quem já está no CRM, pelo telefone ou pelo nome.
  const { data: known } = await admin.from("leads").select("name, phone").eq("tenant_id", tenant);
  const phones = new Set((known ?? []).map((k) => digits(k.phone)).filter(Boolean));
  const names = new Set((known ?? []).map((k) => String(k.name).toLowerCase()));
  const items = out.items.filter((i: any) => i.name).map((i: any) => ({ ...i, known: (i.phone && phones.has(i.phone)) || names.has(i.name.toLowerCase()) }));
  return json({ source: key ? "Google Maps" : "OpenStreetMap", total: items.length, withSite: items.filter((i: any) => i.site).length, items: items.filter((i: any) => !i.site) });
});
