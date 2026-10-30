// Worker do Cloudflare para os subdomínios dos clientes.
// Rota: *.amplitudelab.com.br/*  (e cada domínio próprio do plano White-label, via Custom Hostnames)
//
//   barbearianorte.amplitudelab.com.br        → página pública (agendamento e formulário)
//   barbearianorte.amplitudelab.com.br/painel → painel do CRM (login)
//   barbearianorte.amplitudelab.com.br/p/<token> → proposta para o cliente aceitar
//
// O app é um só (publicado no Cloudflare Pages em APP_ORIGIN). O Worker só descobre
// o tenant pelo host e repassa no cabeçalho x-tenant; o front lê com
// fetch('/tenant') ou pelo próprio hostname.
const APP_ORIGIN = 'https://amplitude-crm.pages.dev';
const ROOT = 'amplitudelab.com.br';

export default {
  async fetch(req) {
    const url = new URL(req.url);
    const host = url.hostname.toLowerCase();
    const slug = host.endsWith('.' + ROOT) ? host.slice(0, -(ROOT.length + 1)) : host;   // domínio próprio vai inteiro
    if (!/^[a-z0-9.-]{3,80}$/.test(slug) || slug === 'www') return Response.redirect('https://' + ROOT, 302);

    if (url.pathname === '/tenant') {
      return Response.json({ slug }, { headers: { 'cache-control': 'no-store' } });
    }
    const fwd = new Request(new URL(url.pathname + url.search, APP_ORIGIN), req);
    fwd.headers.set('x-tenant', slug);
    const res = await fetch(fwd);
    const out = new Response(res.body, res);
    out.headers.set('x-frame-options', 'DENY');
    out.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
    out.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
    return out;
  },
};
