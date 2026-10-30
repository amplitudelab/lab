# Amplitude Lab · memória do projeto

Contexto para retomar o trabalho em qualquer sessão ou chat. Mantenha este arquivo
atualizado quando algo importante mudar (preço, endereço, estrutura, decisão).

## O negócio

- **Amplitude Lab**: estúdio que vende sites prontos por segmento para pequenos
  negócios (barbearias, estúdios de tatuagem, hamburguerias, lojas de roupas, quadros
  e decoração) e, junto, o **Amplitude CRM**.
- Contato: WhatsApp **(11) 95218-2016** (`5511952182016`) · Instagram **@amplitude_lab**.
- Todo botão de compra leva ao WhatsApp com mensagem pronta (`data-wa`). O site é
  focado em conversão.
- Idioma: português do Brasil em tudo (textos, comentários, commits).

## Endereços

- Organização no GitHub: **amplitudelab**.
- Repositório: **`amplitudelab/lab`** (antes `symbiozyy/amplitude-lab`; o GitHub redireciona
  o endereço antigo do repositório, mas não o do site).
- Site: **https://amplitudelab.github.io/lab/** (GitHub Pages, branch `main`, pasta raiz).
  - Modelos: `/modelos/` · Site + CRM: `/crm/` · CRM demo: `/crm/app/` ·
    guia do CRM: `/crm/guia.html` · demos de clientes: `/demos/`
- Endereço antigo do site, que não funciona mais: `symbiozyy.github.io/amplitude-lab`.
- Para o site ficar na raiz (`amplitudelab.github.io/`), o repositório teria que se chamar
  `amplitudelab.github.io`. Se isso mudar, troque `amplitudelab.github.io/lab/` em
  `index.html`, `modelos/index.html`, `crm/index.html`, `catalogo.html`,
  `crm/IMPLEMENTACAO.md`, `crm/guia.html`, `README.md` e aqui.
- Futuro: domínio `amplitudelab.com.br` (registro.br, cerca de R$ 40/ano), necessário para
  os subdomínios do CRM (`<cliente>.amplitudelab.com.br`).

## Preços (plano de negócio)

| Produto | Valor | Prazo |
|---|---|---|
| Página vitrine | R$ 600 a 1.200 | 2 a 4 dias |
| Site completo | R$ 1.200 a 2.500 | 5 a 10 dias |
| Loja virtual | R$ 2.500 a 5.000+ | 15 a 30 dias |
| Plano mensal do site | Básico R$ 79 · Completo R$ 199 | |
| CRM Essencial | R$ 79 a 99/mês | |
| CRM Pro | R$ 179 a 199/mês | |
| CRM White-label | R$ 349 a 399/mês | |
| Implantação do CRM | R$ 490 a 1.500 (uma vez) | |

- Site: 50% na aprovação, 50% na entrega.
- **Combo:** qualquer site ganha 3 meses do CRM Essencial.

## Estrutura do repositório

- `index.html` (HTML + CSS inline), `app.js` (CONFIG do WhatsApp, lab de modelos,
  orçamento `PKGS`/`MNT`/`FEATS`/`SEG_FEATS`, interações), `hero3d.js` (partículas 3D
  do topo), `sculpture.js` (frasco 3D). GSAP e Three.js ficam em `vendor/`, via
  importmap, sem CDN.
- `modelos/`: hub + 5 modelos (`<segmento>/` ilustrado e `<segmento>/fotos/` com fotos
  do Pexels em `modelos/img/<id>.webp` e `<id>-p.webp`). `modelos/kit.css` e
  `modelos/kit.js` têm a barra "voltar ao hub", a simulação do WhatsApp (`AL.whats`),
  `AL.toast` e `AL.px`.
- `demos/`: demos feitas para clientes reais (`noindex`).
- `crm/index.html`: página de vendas Site + CRM.
- `crm/app/index.html`: protótipo do CRM, arquivo único, dados no `localStorage`
  (`amp-crm:v1:<tenant>`, `amp-crm:prefs`).
  - Clientes de exemplo: `norte`, `okada`, `orbita`, `lab`.
  - Perfis: owner, sales, finance, viewer.
  - `?t=<cliente>` escolhe o cliente e `#funil`, `#site` etc. abrem direto numa tela.
- `crm/IMPLEMENTACAO.md`: guia de teste e implementação. `crm/guia.html` é gerado dele:
  `pandoc IMPLEMENTACAO.md -f gfm+yaml_metadata_block -t html5 -s --toc --toc-depth=3 -H <head.html> -o guia.html`.
  O head com o CSS está no topo de `guia.html`: copie de lá ao regenerar.
- `crm/supabase/`: `schema.sql` (13 tabelas, RLS, funções), `seed.sql`, `tests.sql`
  (29 verificações, testadas num Postgres 16 local) e Edge Functions `capture-lead`,
  `asaas-webhook` e `lembretes` (ainda não testadas com contas reais).
- `crm/cloudflare/worker.js`: subdomínio por cliente.
- `voxel-realms/`, `voxel-realms-android/`: jogo à parte, sem relação com o negócio.
  Não vai no pacote .zip.


## CRM real (em produção)

- **Entrar:** o link "Entrar" do site abre `crm/app/?empresa=amplitudelab`, com login por e-mail e senha.
- Mesmo arquivo nos dois modos: sem `?empresa=` é a demonstração no navegador; com `?empresa=<slug>` é o painel real no Supabase (projeto `amplitude-crm`, ref `ozregdgphaxkxumsujys`, São Paulo).
- Página pública de compra: `crm/app/?empresa=<slug>#site`. Primeiro acesso: `?empresa=<slug>&convite=<token>` (uso único, 7 dias).
- O que roda de verdade está em `crm/supabase/producao/` (migrations e funções `checkout`, `infinitepay-webhook`, `first-access`, `radar`). Os demais arquivos de `crm/supabase/` são o rascunho anterior com Asaas, não aplicado.
- Pagamento: InfinitePay com a tag `norduk`, gravada em `tenants.payment_handle`. O aviso de pagamento não tem assinatura; o servidor sempre confere em `/payment_check`.
- Radar de leads: OpenStreetMap por padrão; com o segredo `GOOGLE_PLACES_KEY`, usa o Google Maps.
- Nunca coloque chaves secretas no repositório.

## Visual

- Escuro: fundo `#05070d`, azul `#5b8cff` / `#a9c4ff`, verde `#3fcf9b`.
- Fontes: Unbounded (títulos), IBM Plex Sans (texto), IBM Plex Mono (rótulos).
- Sempre testar no celular (390 px): sem rolagem lateral; respeitar
  `prefers-reduced-motion`.

## Como trabalhar

- Servir localmente: `npx http-server . -p 8099 -c-1`. O 3D não carrega abrindo o
  arquivo direto.
- Testar com Playwright em 1440 px e 390 px: conferir erros de script e
  `scrollWidth - innerWidth`. Para capturar seções da página principal, role aos poucos
  antes (as animações de entrada dependem do scroll).
- Links internos usam `index.html` explícito quando a página precisa abrir também do
  disco (pacote .zip).
- Pacote para enviar: `git archive` do `main` sem `voxel-realms*`, mais uma página
  `COMECE-AQUI.html` na raiz, zipado como `amplitude-lab-completo.zip`.
- Pull requests só quando pedido. O dono costuma pedir PR + merge no fim.

## Próximos passos

1. Conferir **Settings → Pages** em `amplitudelab/lab` (branch `main`, raiz) e trocar o
   link da bio para `https://amplitudelab.github.io/lab/`.
2. Registrar `amplitudelab.com.br` quando fechar os primeiros clientes do CRM.
3. CRM real: Fase 0 do `crm/IMPLEMENTACAO.md` (Supabase, Cloudflare, login).
