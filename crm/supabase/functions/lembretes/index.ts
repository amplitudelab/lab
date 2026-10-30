// lembretes: roda a cada 5 minutos (Supabase Cron) e manda e-mail das tarefas que estão chegando.
// Agendar no SQL Editor (extensões pg_cron e pg_net ligadas):
//   select cron.schedule('lembretes', '*/5 * * * *', $$
//     select net.http_post(
//       url := 'https://<projeto>.supabase.co/functions/v1/lembretes',
//       headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
//     ) $$);
// Segredos: RESEND_API_KEY, CRON_SECRET, MAIL_FROM (ex.: "Amplitude CRM <avisos@amplitudelab.com.br>").
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.headers.get('authorization') !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('não autorizado', { status: 401 });
  }
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // tarefas abertas, ainda não avisadas, que vencem nas próximas 2 horas
  const { data: tasks } = await db.from('tasks')
    .select('id, tenant_id, title, due_at, remind_minutes, assigned_to')
    .is('done_at', null).is('reminded_at', null)
    .lte('due_at', new Date(Date.now() + 2 * 3600e3).toISOString())
    .gte('due_at', new Date().toISOString());

  let sent = 0;
  for (const t of tasks ?? []) {
    if (new Date(t.due_at).getTime() - Date.now() > t.remind_minutes * 60e3) continue;   // ainda cedo
    // destinatário: quem foi atribuído; se ninguém, os donos do tenant
    const q = db.from('memberships').select('email').eq('tenant_id', t.tenant_id);
    const { data: to } = t.assigned_to ? await q.eq('user_id', t.assigned_to) : await q.eq('role', 'owner');
    const emails = (to ?? []).map((m) => m.email).filter(Boolean);
    if (!emails.length) continue;
    const hora = new Date(t.due_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: Deno.env.get('MAIL_FROM'), to: emails, subject: `Às ${hora}: ${t.title}`, text: `Lembrete do seu CRM: ${t.title} às ${hora}.` }),
    });
    if (r.ok) { await db.from('tasks').update({ reminded_at: new Date().toISOString() }).eq('id', t.id); sent++; }
  }
  return Response.json({ sent });
});
