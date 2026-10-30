// capture-lead: recebe o formulário público (e o agendamento da página) e cria o lead.
// Fluxo: honeypot → Turnstile → validação → rpc capture_lead (service_role) → link de WhatsApp.
// Deploy: supabase functions deploy capture-lead --no-verify-jwt
// Segredos: TURNSTILE_SECRET (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já vêm no ambiente).
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'content-type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'método não permitido' }, 405);

  let f: Record<string, string>;
  try { f = await req.json(); } catch { return json({ error: 'corpo inválido' }, 400); }

  // honeypot: campo "website" escondido; robô preenche, pessoa não. Responde ok para não ensinar o robô.
  if (f.website) return json({ ok: true });

  // Turnstile (Cloudflare): token gerado pelo widget na página
  const ts = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: Deno.env.get('TURNSTILE_SECRET') ?? '',
      response: f.turnstile ?? '',
      remoteip: req.headers.get('cf-connecting-ip') ?? '',
    }),
  }).then((r) => r.json()).catch(() => ({ success: false }));
  if (!ts.success) return json({ error: 'verificação anti-robô falhou' }, 403);

  const name = String(f.name ?? '').trim();
  const digits = String(f.phone ?? '').replace(/\D/g, '');
  if (name.length < 2) return json({ error: 'Escreva seu nome.' }, 422);
  if (digits.length < 10 || digits.length > 13) return json({ error: 'Digite o WhatsApp com DDD.' }, 422);
  if (String(f.consent) !== 'true') return json({ error: 'Marque a autorização de contato.' }, 422);

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const pub = await db.rpc('tenant_public', { p_slug: f.slug });
  if (pub.error || !pub.data) return json({ error: 'página não encontrada' }, 404);

  const { data: leadId, error } = await db.rpc('capture_lead', {
    p_slug: f.slug,
    p_name: name,
    p_phone: f.phone,
    p_email: f.email ?? null,
    p_interest: f.interest ?? null,
    p_message: (f.message ?? '').slice(0, 1000) || null,
    p_consent_text: pub.data.form.consent,          // grava o texto que estava na tela
    p_source: f.source === 'site' ? 'site' : 'form',
    p_value_cents: Number(f.value_cents) || 0,
    p_when: f.when ?? null,                          // agendamento: ISO 8601
  });
  if (error) return json({ error: 'não foi possível salvar' }, 500);

  // Fase 1: click-to-chat. O visitante já sai com a conversa aberta no WhatsApp do negócio.
  const wa = pub.data.whatsapp
    ? `https://wa.me/${pub.data.whatsapp}?text=${encodeURIComponent(`Oi! Sou ${name} e acabei de pedir pela página: ${f.interest ?? ''}`)}`
    : null;
  return json({ ok: true, lead: leadId, whatsapp: wa });
});
