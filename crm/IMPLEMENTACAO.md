---
title: Amplitude CRM · Guia de teste e implementação
---

# Amplitude CRM: guia de teste e implementação

Este guia tem duas partes:

1. **Testar o protótipo:** como abrir o CRM e conferir cada função, em 15 minutos, sem instalar nada.
2. **Implementar de verdade:** como trocar o armazenamento do navegador por um banco multi-cliente (Supabase), publicar em subdomínios e ligar captação, cobrança e WhatsApp.

O protótipo fica em `crm/app/index.html`. É um arquivo único que funciona sozinho, sem servidor.
Tudo o que você muda nele fica salvo **só no seu navegador** (`localStorage`). Por isso dá para testar à vontade, e o botão *Restaurar dados de exemplo* volta tudo ao início.

| O que | Onde |
|---|---|
| Protótipo do CRM | `crm/app/index.html` |
| Página de vendas Site + CRM | `crm/index.html` |
| Banco (tabelas, permissões, funções) | `crm/supabase/schema.sql` |
| Dados de exemplo | `crm/supabase/seed.sql` |
| Teste de permissões (29 verificações) | `crm/supabase/tests.sql` |
| Captação, webhook do Asaas, lembretes | `crm/supabase/functions/*/index.ts` |
| Subdomínios dos clientes | `crm/cloudflare/worker.js` |

---

## Parte 1 · Testar o protótipo

### Como abrir

- **Online:** <https://amplitudelab.github.io/lab/crm/app/>
- **No computador, pelo pacote .zip:** abra `crm/app/index.html` com dois cliques. Funciona direto do arquivo.
  As fontes vêm do Google Fonts; sem internet, o CRM usa a fonte do sistema e continua funcionando.
- **No celular:** use o endereço online. O layout troca a barra lateral por uma barra inferior.

### Atalhos de endereço

Coloque depois do `#` para abrir direto numa tela. Ele usa o último cliente escolhido no login (o padrão é a Barbearia Norte).

| Endereço | Abre |
|---|---|
| `crm/app/` | Tela de login com os 4 clientes de exemplo |
| `crm/app/#site` | Página pública do cliente (onde o visitante agenda ou pede orçamento) |
| `crm/app/#painel` | Painel do dia |
| `crm/app/#funil` | Funil de vendas (kanban) |
| `crm/app/#clientes` | Clientes |
| `crm/app/#propostas` | Propostas |
| `crm/app/#agenda` | Agenda |
| `crm/app/#financeiro` | Financeiro |
| `crm/app/#captacao` | Formulário de captação |
| `crm/app/#equipe` | Equipe, permissões, marca e registro |

### Os 4 clientes de exemplo (tenants)

Cada um tem dados próprios e cor própria. É o mesmo sistema servindo empresas diferentes, sem que uma veja a outra.

| Cliente | Endereço simulado | Plano | Cor |
|---|---|---|---|
| Barbearia Norte | `barbearianorte.amplitudelab.com.br` | Pro | âmbar |
| Marina Okada Fotografia | `marinaokada.amplitudelab.com.br` | White-label | pêssego |
| Festival Órbita | `festivalorbita.amplitudelab.com.br` | Pro | lilás |
| Amplitude Lab (uso interno) | `app.amplitudelab.com.br` | Interno | azul |

### Os 4 perfis de acesso

Troque em **Ver como** no topo do painel (no celular: menu *Mais*). O menu e os botões mudam na hora.

| Pode… | Dono | Vendas | Financeiro | Leitura |
|---|:-:|:-:|:-:|:-:|
| Ver funil, clientes e agenda | ✓ | ✓ | ✓ | ✓ |
| Criar e editar leads e propostas | ✓ | ✓ | | |
| Ver e lançar financeiro | ✓ | | ✓ | |
| Convidar pessoas e mudar permissões | ✓ | | | |
| Excluir registros e anonimizar (LGPD) | ✓ | | | |

No perfil **Leitura** os telefones aparecem mascarados.

### Roteiro de teste, função por função

Siga na ordem. Cada linha diz o que fazer e o que deve acontecer.

#### 1. Entrada

| Faça | Deve acontecer |
|---|---|
| Abra `crm/app/`, escolha **Barbearia Norte** e clique em *Entrar na demonstração* | Abre o Painel com a cor âmbar e o nome da barbearia |
| Volte ao login, digite um e-mail e envie | Aparece o aviso de que, na versão real, chega um link de acesso por e-mail (login sem senha) |
| Escolha outro cliente e entre | Dados, cor e nome trocam por completo |

#### 2. Painel

| Faça | Deve acontecer |
|---|---|
| Olhe os números do topo | Leads em aberto, em negociação, recebido no mês, taxa de fechamento, a receber e tarefas de hoje |
| Veja *Próximos passos* | Retornos, tarefas e cobranças vencidas, os mais urgentes primeiro |
| Clique em *Concluir* numa tarefa ou *Recebido* numa cobrança | Sai da lista e entra no registro de alterações |

#### 3. Funil (kanban)

| Faça | Deve acontecer |
|---|---|
| Arraste um card de *Novo* para *Contato feito* | O card muda de coluna, o total da coluna atualiza e o histórico do lead ganha "Etapa · Novo → Contato feito" |
| Arraste um card para **Fechado** | Partículas comemoram e aparece *Gerar cobrança* (se o perfil puder ver financeiro) |
| Clique em *Gerar cobrança* | Abre a cobrança já preenchida com o valor e o interesse do lead |
| Arraste para **Perdido** | Sai dos leads em aberto e o retorno marcado é limpo |
| No celular | Abra o lead e toque na etapa desejada |
| Clique em *Novo lead* | Formulário de lead; ao salvar, entra em *Novo* |

#### 4. Ficha do lead

| Faça | Deve acontecer |
|---|---|
| Clique em qualquer card | Abre a gaveta com etapa, contato, consentimento, próximo retorno e histórico |
| Clique em *Abrir WhatsApp* | Abre o WhatsApp com mensagem pronta (nos contatos de exemplo, sem destinatário) |
| Em *Registrar contato*, escolha Nota, WhatsApp, Ligação ou E-mail e salve | Aparece no topo do histórico com data, hora e perfil |
| Em *Próximo follow-up*, toque em *Amanhã* | O lead aparece na Agenda e nos próximos passos |
| *Criar proposta* | Abre a proposta já ligada a este lead |
| Como **Dono**, clique em *Anonimizar (LGPD)* e confirme | Nome vira "Titular anonimizado", telefone e e-mail somem, o histórico vira "[removido a pedido do titular]". O valor continua contando no funil |
| Troque para **Vendas** e abra outro lead | O botão de anonimizar não aparece |

#### 5. Propostas

| Faça | Deve acontecer |
|---|---|
| *Nova proposta* (ou *Criar proposta* na ficha do lead): adicione itens com descrição, quantidade e valor | O total soma sozinho |
| Salve | Fica como *Enviada* e aparece *Ver como o cliente* |
| Clique em *Ver como o cliente* | Abre a proposta como o cliente veria pelo link, com a marca do negócio |
| Clique em *Aceitar proposta* | Status vira *Aceita* e o lead vai para *Fechado* sozinho |
| *Copiar link* | Na versão real é um link único e secreto (token) que o cliente abre sem login |

#### 6. Agenda

| Faça | Deve acontecer |
|---|---|
| Veja a faixa de dias | Cada dia mostra quantos compromissos tem |
| Clique num dia | Filtra só aquele dia; clique de novo para ver todos |
| *Nova tarefa*: tipo, dia, horário e lembrete (15 min, 1 hora ou 1 dia antes) | Entra na lista no dia certo. Na versão real o lembrete vai por e-mail |
| Marque como feita | Some da lista de pendentes |

#### 7. Financeiro (perfil Dono ou Financeiro)

| Faça | Deve acontecer |
|---|---|
| Veja o gráfico | Entradas e saídas dos últimos 6 meses |
| *Nova cobrança* (Pix, boleto, cartão ou transferência) | Entra em *A receber* |
| Clique em *Recebido* numa cobrança | Sai de *A receber* e vira entrada no caixa do mês |
| *Lançar despesa* | Entra no gráfico como saída |
| Troque para **Vendas** | O menu Financeiro some |

#### 8. Captação

| Faça | Deve acontecer |
|---|---|
| Mude o título, os campos (e-mail, interesse, mensagem) e o texto de consentimento | A prévia no celular atualiza na hora |
| Preencha a prévia sem marcar a autorização | Mostra o erro pedindo a autorização (LGPD) |
| Preencha certo e envie | Lead novo em *Novo*, com origem *Formulário* e data do consentimento |
| *Copiar link para a bio* ou o código para o site | É o que vai na bio do Instagram ou no site do cliente |
| Digite um número em *WhatsApp* e copie o link | Link `wa.me` com mensagem pronta |

O formulário tem um campo escondido (honeypot). Robôs preenchem e são ignorados; pessoas nem veem.

#### 9. Página pública do cliente (`#site`)

| Faça | Deve acontecer |
|---|---|
| Abra `crm/app/#site` ou *Ver a página pública deste cliente* no login | Página do negócio com serviços e preços |
| Escolha serviço, dia e horário, preencha nome e WhatsApp e autorize | Confirmação na tela |
| Entre no painel | O pedido virou lead em *Novo* (origem *Página*), um compromisso na Agenda no horário escolhido e uma linha no registro |
| Volte à página e escolha o mesmo dia | O horário já reservado fica desativado |

É o ponto principal da venda **Site + CRM**: quem agenda pelo site já cai organizado no CRM.

#### 10. Equipe e acesso (perfil Dono)

| Faça | Deve acontecer |
|---|---|
| *Convidar* uma pessoa com um perfil | Entra na lista de pessoas |
| Mude o nome exibido e a cor principal | Painel inteiro muda de cor e nome na hora |
| Preencha *Domínio próprio* | O endereço do painel mostra o domínio novo |
| Ligue *Esconder "feito pela Amplitude Lab"* | É a opção do plano White-label |
| Veja o *Registro de alterações* | Cada mudança que você fez aparece com perfil, data e hora |
| *Restaurar dados de exemplo* e confirme | Tudo deste cliente volta ao início |

#### 11. Atalhos e segurança

| Faça | Deve acontecer |
|---|---|
| `Ctrl + K` (ou `⌘ + K`) no painel | Paleta de busca: digite um nome de lead ou uma ação ("nova cobrança") e dê Enter |
| Fique 5 minutos sem mexer | O painel trava e pede para desbloquear |
| Botão de tema | Alterna claro, escuro e automático |
| Botão de efeitos (estrela) | Liga e desliga o fundo de partículas |

### Como o protótipo guarda os dados

Tudo fica em duas chaves do `localStorage`:

- `amp-crm:prefs`: preferências (tema, efeitos e último cliente escolhido)
- `amp-crm:v1:<cliente>`: um objeto por cliente (`norte`, `okada`, `orbita`, `lab`)

Formato do objeto do cliente (valores em **centavos**, datas em milissegundos):

```js
{
  v: 1,
  leads:     [{ id, name, phone, email, interest, source, stage, value, follow, created, consent, client, lost }],
  acts:      [{ id, lead, kind, body, at, by }],          // histórico do lead
  clients:   [{ id, name, email, phone, doc, since, contacts: [{ name, role }] }],
  proposals: [{ id, lead, client, title, items: [{ d, q, u }], status, valid, token, created }],
  tasks:     [{ id, title, kind, due, done, remind }],
  charges:   [{ id, client, desc, amount, due, status, paid, method }],
  cash:      [{ id, dir, cat, desc, amount, date, charge }],
  audit:     [{ at, who, a }],
  form:      { title, email, interest, msg, wa, consent },
  brand:     { name, color, hide, domain },
  members:   [{ n, e, r }]
}
```

Para apagar tudo de uma vez: no navegador, ferramentas do desenvolvedor → Application → Local Storage → apagar as chaves `amp-crm:*`.

---

## Parte 2 · Implementar de verdade

### Arquitetura

```
 visitante                       cliente da Amplitude Lab (dono, vendas, financeiro)
     │                                        │
     ▼                                        ▼
 barbearianorte.amplitudelab.com.br     barbearianorte.amplitudelab.com.br/painel
     │                                        │
     └──────────── Cloudflare Worker ─────────┘   descobre o tenant pelo endereço
                         │
                  Cloudflare Pages                  o mesmo app para todos (crm/app)
                         │
        ┌────────────────┼──────────────────────────┐
        ▼                ▼                          ▼
  Supabase Auth     Supabase Postgres          Edge Functions
  link por e-mail   13 tabelas + RLS           capture-lead   (Turnstile + LGPD)
  + 2FA do dono     tenant_id em tudo          asaas-webhook  (pagamento → caixa)
                                               lembretes      (e-mail via Resend)
                                                    │
                                     Asaas (Pix/boleto/cartão) · WhatsApp
```

| Peça | Para quê | Alternativa |
|---|---|---|
| **Supabase** (Postgres, Auth, Edge Functions, Cron) | Banco, login e código no servidor | Postgres + Node próprio |
| **RLS** (Row Level Security) | O banco recusa ler ou mudar linhas de outro cliente, mesmo se o front tiver bug | Filtro no back-end (mais frágil) |
| **Cloudflare Pages + Worker** | Hospedagem e um subdomínio por cliente | Vercel com middleware |
| **Cloudflare Turnstile** | Anti-robô no formulário público, sem quebra-cabeça | hCaptcha |
| **Resend** ou **Brevo** | E-mail de login e de lembretes | SMTP próprio |
| **Asaas** | Cobrança Pix, boleto e cartão com webhook | Mercado Pago, Pagar.me |
| **WhatsApp** | Fase 1: link `wa.me` com mensagem pronta. Fase 2: API oficial da Meta | Z-API (não oficial: evite) |

### Do protótipo para as tabelas

| No protótipo (`S.*`) | No banco | Observação |
|---|---|---|
| `TENANTS` (fixo no código) | `tenants` | `slug` vira o subdomínio |
| `members` | `memberships` | Liga `auth.users` ao tenant com o perfil |
| `STAGES` (fixo) | `pipeline_stages` | Cada tenant nasce com as 6 etapas (trigger) e pode renomear |
| `leads` | `leads` | `stage` → `stage_id`; `value` → `value_cents`; `follow` → `follow_up_at`; `consent` → `consent_at` + `consent_text` |
| `acts` | `activities` | Mudança de etapa vira atividade sozinha (trigger) |
| `clients` + `contacts` | `clients` + `contacts` | Contatos saem do objeto e viram tabela |
| `proposals` | `proposals` | `total_cents` calculado pelo banco; `token` gerado pelo banco |
| `tasks` | `tasks` | Ganha `reminded_at` e `assigned_to` |
| `form` | `forms` | |
| `charges` | `charges` | Ganha `asaas_id` e `payment_url` |
| `cash` | `cash_entries` | Cobrança paga cria a entrada sozinha (trigger) |
| `audit` | `audit_log` | Escrito só pelo banco (triggers), ninguém edita |
| `brand` | colunas `brand_*` em `tenants` | |

### Fase 0 · Fundação (1 semana)

1. **Conta e projeto no Supabase.** Crie o projeto na região *South America (São Paulo)*.
2. **Banco.** Em *SQL Editor*, rode na ordem:
   1. `crm/supabase/schema.sql`: tipos, 13 tabelas, RLS, views, triggers e funções.
   2. Entre uma vez no app com seu e-mail (passo 4) e troque o e-mail no topo de `seed.sql`.
   3. `crm/supabase/seed.sql`: cria a Barbearia Norte de exemplo com você como dono.
   4. `crm/supabase/tests.sql`: deve terminar com **TODOS OS TESTES PASSARAM**. Ele roda dentro de uma transação e desfaz tudo no fim.
3. **Login.** *Authentication → Providers → Email*: ligue *magic link*. Em *URL Configuration* coloque `https://*.amplitudelab.com.br/**` nas URLs de retorno. Em *SMTP*, configure o Resend para os e-mails saírem com o seu domínio. Ligue o **MFA (TOTP)** e exija para o perfil Dono no front (`supabase.auth.mfa`).
4. **Cloudflare.** Domínio `amplitudelab.com.br` no Cloudflare. Publique `crm/app` no **Pages** (projeto `amplitude-crm`). Crie o **Worker** com `crm/cloudflare/worker.js` e a rota `*.amplitudelab.com.br/*`. Adicione o DNS curinga `*` em modo proxy (nuvem laranja).

Testado localmente: `schema.sql`, `seed.sql` e `tests.sql` rodam limpos num Postgres 16 com o esquema `auth` simulado igual ao do Supabase, e as 29 verificações passam.

### Fase 1 · MVP (4 a 6 semanas)

Objetivo: o protótipo funcionando com banco real para os primeiros 3 clientes.

**1. Trocar o `store` do protótipo pelo Supabase.** No protótipo, `load()` lê tudo de uma vez e `save()` grava tudo. Na versão real, cada ação grava só o que mudou:

```html
<script type="module">
  import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
  const sb = createClient('https://<projeto>.supabase.co', '<chave anon pública>');
</script>
```

```js
// entrar: link mágico por e-mail
await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + '/painel' } });

// descobrir o tenant pelo endereço e o perfil da pessoa
const slug = location.hostname.split('.')[0];
const { data: tenant } = await sb.from('tenants').select('*').eq('slug', slug).single();
const { data: me } = await sb.from('memberships').select('role').eq('tenant_id', tenant.id)
  .eq('user_id', (await sb.auth.getUser()).data.user.id).single();
role = me.role;   // owner | sales | finance | viewer: o mesmo ROLES do protótipo

// carregar (o RLS já filtra pelo tenant; o filtro abaixo é só para não misturar se a pessoa tiver 2 tenants)
const [stages, leads, tasks] = await Promise.all([
  sb.from('pipeline_stages').select('*').eq('tenant_id', tenant.id).order('position'),
  sb.from(role === 'viewer' ? 'leads_masked' : 'leads').select('*').eq('tenant_id', tenant.id),
  sb.from('tasks').select('*').eq('tenant_id', tenant.id).is('done_at', null).order('due_at'),
]);

// mover lead no funil (substitui moveLead + save)
await sb.from('leads').update({ stage_id }).eq('id', leadId);   // o banco grava o histórico e o registro

// nova proposta
await sb.from('proposals').insert({ tenant_id: tenant.id, lead_id, title, items, status: 'sent' });

// anonimizar (LGPD)
await sb.rpc('anonymize_lead', { p_lead: leadId });

// tempo real: outra pessoa da equipe moveu um card
sb.channel('funil').on('postgres_changes',
  { event: '*', schema: 'public', table: 'leads', filter: `tenant_id=eq.${tenant.id}` },
  () => render()).subscribe();
```

Converta datas com `new Date(row.due_at).getTime()` para reaproveitar as funções de tela do protótipo (`fdate`, `rel`, `money`) sem mudar nada nelas.

**2. Captação.** Publique a função:

```bash
supabase functions deploy capture-lead --no-verify-jwt
supabase secrets set TURNSTILE_SECRET=<chave secreta do Turnstile>
```

No formulário público troque o `submit` do protótipo por:

```js
const r = await fetch('https://<projeto>.supabase.co/functions/v1/capture-lead', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ slug, name, phone, email, interest, consent: true,
    website: form.website.value,                        // honeypot
    turnstile: turnstile.getResponse() }),              // widget do Cloudflare
}).then((r) => r.json());
if (r.whatsapp) location.href = r.whatsapp;            // visitante já cai na conversa
```

A página pública lê nome, cor e formulário com `sb.rpc('tenant_public', { p_slug: slug })`, sem login e sem expor dados internos.

**3. Proposta pelo link.** A rota `/p/<token>` chama `sb.rpc('proposal_public', { p_token })` para mostrar e `sb.rpc('proposal_accept', { p_token })` no botão *Aceitar*. O lead vai para *Fechado* sozinho.

**4. Lembretes.** Publique `lembretes`, configure `RESEND_API_KEY`, `MAIL_FROM` e `CRON_SECRET`, ligue `pg_cron` e `pg_net` em *Database → Extensions* e agende com o SQL que está no topo de `functions/lembretes/index.ts`.

**5. Bloqueio por inatividade.** O protótipo já tem (`armLock`). Na versão real, acrescente `sb.auth.signOut()` depois de 30 minutos travado.

**6. Backups.** Plano Pro do Supabase tem backup diário; *Point in Time Recovery* é um adicional pago, para oferecer no plano Pro do CRM.

### Fase 2 · Cobrança e WhatsApp

- **Asaas:** crie uma subconta por cliente (ou use a chave do próprio cliente). O botão *Gerar cobrança* chama a API `POST /v3/payments` pelo servidor (nunca pelo navegador) e salva `asaas_id` e `payment_url`. Publique `asaas-webhook`, cadastre a URL no Asaas com o token em `ASAAS_WEBHOOK_TOKEN`. Pagamento confirmado → cobrança paga → entrada no caixa → atividade no lead, tudo sozinho.
- **WhatsApp:** comece com o link `wa.me` (já está no protótipo e na `capture-lead`). Para mensagens automáticas (lembrete de horário, cobrança), use a **API oficial do WhatsApp Business (Meta Cloud API)** com modelos de mensagem aprovados. Cada cliente precisa do próprio número verificado.

### Fase 3 · Diferenciais

- Domínio próprio no White-label: *Cloudflare for SaaS → Custom Hostnames*; o Worker já trata o domínio inteiro como identificador (coluna `tenants.custom_domain`).
- Relatórios por origem do lead e taxa de conversão por etapa.
- App instalável (PWA) para o dono usar no celular.

### Segurança e LGPD: checklist

- [ ] RLS ligado em **todas** as tabelas (o `schema.sql` já liga; confira em *Database → Tables*).
- [ ] `tests.sql` passando depois de qualquer mudança no banco.
- [ ] A chave `service_role` **só** nas Edge Functions, nunca no front, nunca no Git.
- [ ] `capture_lead` só executável pela `service_role` (já está assim).
- [ ] Consentimento salvo com data **e** texto exato (`consent_at`, `consent_text`).
- [ ] Anonimização disponível para o dono (`anonymize_lead`) e registrada no `audit_log`.
- [ ] 2FA obrigatório para o perfil Dono e para quem vê o financeiro.
- [ ] Turnstile e honeypot no formulário público.
- [ ] Contrato com cada cliente dizendo que ele é o **controlador** dos dados e a Amplitude Lab é **operadora**.
- [ ] Política de privacidade na página pública de cada cliente.

### Checklist antes de entregar para um cliente

- [ ] Tenant criado (`insert into tenants (slug, name, plan, whatsapp) …`): as etapas e o formulário nascem sozinhos.
- [ ] Dono convidado (`invite_member`) e com 2FA ligado.
- [ ] Cor, nome e logo conferidos no painel e na página pública.
- [ ] Formulário testado de ponta a ponta: envio → lead em *Novo* → WhatsApp abre.
- [ ] Proposta de teste aceita pelo link.
- [ ] Cobrança de teste no Asaas (sandbox) virando entrada no caixa.
- [ ] Lembrete de tarefa chegando por e-mail.

---

## Como vender: Site + CRM

Faixas do plano de negócio (ajuste em `crm/index.html`):

| Plano do CRM | Mensal | Para quem |
|---|---|---|
| **Essencial** | R$ 79 a 99 | Funil, clientes, agenda e captação para 1 a 2 pessoas |
| **Pro** | R$ 179 a 199 | Tudo, mais propostas com link, financeiro, perfis de equipe e backup com restauração |
| **White-label** | R$ 349 a 399 | Pro com a marca e o domínio do cliente, sem "feito pela Amplitude Lab" |
| **Implantação** | R$ 490 a 1.500 (uma vez) | Importar contatos, configurar funil, formulário, cobrança e treinar a equipe |

**Combo de entrada:** quem fecha qualquer site (vitrine, completo ou loja) ganha **3 meses do CRM Essencial**, com o formulário do site já ligado ao funil.
É o argumento principal: *o site traz o cliente, o CRM não deixa ele escapar.*

Contato: WhatsApp (11) 95218-2016 · Instagram @amplitude_lab
