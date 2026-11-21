# Amplitude Lab · memória do projeto

Contexto para retomar o trabalho em qualquer sessão ou chat. Mantenha este arquivo
atualizado quando algo importante mudar (preço, endereço, estrutura, decisão).

## O negócio

- **Amplitude Lab**: estúdio que vende sites prontos por segmento para pequenos
  negócios (barbearias, estúdios de tatuagem, hamburguerias, lojas de roupas, quadros
  e decoração) e, junto, o **Amplitude CRM**.
- Contato: WhatsApp **(11) 95218-2016** (`5511952182016`) · Instagram **@amplitude_lab**.
- Todo botão de compra leva ao orçamento (`data-orc`, seção `#monte`); o WhatsApp só abre no envio, e o pedido entra no CRM como lead e proposta (função `site-quote`). O site é
  focado em conversão.
- Idioma: português do Brasil em tudo (textos, comentários, commits).

## Endereços

- Organização no GitHub: **amplitudelab**.
- Repositório: **`amplitudelab/lab`** (antes `symbiozyy/amplitude-lab`; o GitHub redireciona
  o endereço antigo do repositório, mas não o do site).
- Site: **https://amplitudelab.github.io/lab/** (GitHub Pages, branch `main`, pasta raiz).
  - Modelos: `/modelos/` · Site + CRM: `/crm/` · CRM demo: `/crm/app/` ·
    guia do CRM: `/crm/guia.html` · demos de clientes: `/demos/` · prévias temporárias e
    privadas: `/previa/<id>/#<chave>` (ver "Prévias temporárias" abaixo)
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
- `demos/`: demos feitas para clientes reais (`noindex`). É vitrine **pública e
  permanente**: `demos/index.html` lista todas, e o hub de modelos e a página Sites
  apontam para lá. Demo que ainda não pode aparecer vai para `previa/`.
- `previa/`: prévias temporárias e privadas (uma semana, conteúdo cifrado). Processo
  completo na seção "Prévias temporárias" abaixo.
- **Sites de clientes** — grupo à parte, sem ligação com o ecossistema da Amplitude
  (nada de CRM, orçamento ou WhatsApp da Amplitude). Cada cliente tem uma pasta própria
  **na raiz**, então o nome dele fica no fim do link:
  `amplitudelab.github.io/lab/<cliente>/`. Regras do grupo: identidade do cliente,
  `noindex`, tudo dentro da própria pasta (fontes, fotos e vídeo, sem CDN), nenhum link
  do site da Amplitude apontando para lá, e como único laço a assinatura "Site feito por
  Amplitude Lab" no rodapé. A lista de todos fica em `clientes/index.html`
  (`amplitudelab.github.io/lab/clientes/`), que é o único lugar que reúne o grupo e
  também guarda o passo a passo para entrar um site novo. Não confundir com `demos/`,
  que são prévias para fechar negócio.
  - A lista **pede o código de acesso do CRM**. Como o repositório é público, os nomes
    dos clientes não ficam no HTML: eles vivem em `SITES`, dentro da função
    `clientes-lista` (`crm/supabase/producao/functions/clientes-lista/index.ts`), que
    confere o código contra `access_codes` e só então devolve a lista. Para incluir um
    cliente, acrescente a linha em `SITES` **e faça o deploy da função**; mudar só o
    HTML não adianta. A função tem limite de tentativas (5 por IP em 15 min, 10 por
    hora no total) e nunca guarda o código, só compara com o hash.
  - `bruno-zampieri/`: página do criador Bruno Zampieri (@obrunozampieri). Contatos no
    objeto `CONTATO` do script.
    Um vídeo da sequência de vivências pode começar depois do início do arquivo:
    `data-inicio="4"` no `<video>` faz a cena abrir no segundo 4 e voltar para lá ao
    repetir. É assim que o começo do vídeo das falésias fica de fora. A capa
    (`poster`) precisa sair de um quadro depois desse ponto.
  - `bruxo/`: página do DJ Bruxo (@bruxoemsp) — Progressive, Hard e Hi-Tech. Fotos em
    `bruxo/img/` e fontes em `bruxo/fonts/` (Pirata One, Barlow, Barlow Condensed e
    IBM Plex Mono, todas SIL OFL, licenças na mesma pasta). O campo de partículas do
    fundo bate no BPM da seção em que o visitante está — 136 na abertura, 190 na
    catarse —, e o HUD embaixo à esquerda mostra esse BPM e pausa o movimento. As
    seções levam `data-bpm`; é de lá que sai o andamento.
    As fotos originais têm no máximo 700 px de lado, então nada na página pode
    ampliá-las muito: as faixas de largura total (`.band`) mostram a foto nítida
    no centro, com uma cópia desfocada preenchendo o resto, e o "ampliar" da galeria
    para em 700 px. Se chegarem fotos maiores, dá para soltar esses limites.
  - `darky/`: site de **DARKY, SLOWLY e OBSKURIAL**, os três projetos de Bruno Martins.
    O Darky é a porta de entrada (`/lab/darky/`) e é nele que o artista se apresenta — a
    biografia vale para os três, mas aparece uma vez só. As outras rotas são
    `darky/slowly/` e `darky/obskurial/`, cópias do `index.html` geradas por
    `node darky/gerar-rotas.js` (**rode de novo sempre que mudar o `index.html`**).
    Obskurial é o projeto de high BPM.
    Todo texto, link e contato fica em `js/content.js`: campo vazio não aparece na
    página, nada é inventado. `js/app.js` monta as vistas, a tela de abertura, as
    passagens, a galeria-roleta e o formulário; `js/fx.js` é o fundo WebGL (Three.js em
    `vendor/`). Sem script inline, então a CSP é `script-src 'self'` e não tem hash para
    recalcular.
    **Peso por aparelho:** o site mede o aparelho e serve o que ele aguenta. No celular
    não carrega o WebGL (fica a textura), as imagens vão sem `srcset` (só a versão de
    900 px), os vídeos usam os arquivos `-m` e as passagens têm menos peças. Cada
    universo tem um vídeo de fundo em `assets/bg/` e uma textura em `assets/texturas/`.
    O inventário do material, as medições e o que falta do artista estão em
    `darky/INVENTARIO.md`. As fotos e vídeos originais (ZIP de 2 GB) não vão para o
    repositório; só as versões otimizadas em `assets/`.
  - `linnx/`: página da DJ **Linnx** (progressive trance e acelerado, São Paulo). Veio
    do press kit de 2025: duas fotos já recortadas, o logo rosa em pincel (fundo
    transparente), um vídeo vertical de 28 s ao vivo e o release. Todo o texto da página
    sai do release; nada foi inventado. Contatos de booking ficam no objeto `CONTATO` de
    `js/app.js` — **ainda vazios**: campo vazio não aparece, e sem nenhum o formulário só
    copia o pedido. **Primeira seção: última passagem, o set do Comic Festival 2026**
    (vídeo do canal dela, `youtube.com/watch?v=O3xTPJZGzeo`, 58 min). Oito cortes de 6 s
    em `assets/comic/` (`corte-NN.mp4`, `-m` no celular, e `quadro-NN.webp`) giram
    sozinhos; o minuto de cada corte fica em `data-seg` no HTML, e o botão "Assistir ao set
    completo" abre o YouTube sem cookies (`youtube-nocookie`, liberado no `frame-src`)
    a partir desse ponto. O vídeo original (1,9 GB) não vai para o repositório. O som da
    página é `assets/audio/comic-trilha.m4a`: 4 min do fim do set (52:50 a 56:50, o trecho
    de maior energia); com ele ligado, um
    `AnalyserNode` lê os graves e faz o fundo WebGL (`js/fx.js`, sem biblioteca), o logo e
    o visualizador pulsarem; sem som, um pulso sintético em 140 BPM. No celular não há
    WebGL (fica um gradiente em CSS) e o vídeo é o `-m`. Antes de ligar o fundo, `fx.js` mede o custo
    de alguns quadros na GPU e desiste se passar de 8 ms (GPU por software também fica de
    fora); `?semfx` no endereço desliga o WebGL para testes. Use `powerPreference:
    'default'`: com `low-power`, em notebook de duas GPUs, WebGL e vídeo juntos travavam
    a página. Sem script inline (CSP
    `script-src 'self'`). O ZIP do press kit (`assets/press/linnx-presskit.zip`) é gerado
    à mão: refaça se trocar logo, foto, release ou vídeo.
  - `arcanne/`: site do DJ e produtor **ARCANNE** (Rodolfo Carvalho), bilíngue:
    `/lab/arcanne/` em português e `/lab/arcanne/en/` em inglês, as duas páginas geradas
    por `node arcanne/gerar.js` a partir de `dados.json` (links, discografia, mídia, contato)
    e `locales/pt-BR.json` / `locales/en.json`. **Não edite os `index.html` à mão; rode o
    gerador.** `js/idioma.js` escolhe a versão na chegada (escolha manual guardada vence;
    senão idioma do navegador, com fuso só de desempate). Fica com `noindex` até ir para o
    domínio do artista (`site.indexar` em `dados.json`), mas canonical, hreflang, sitemap
    e dados estruturados já saem prontos. Abertura, fundo da primeira tela e fundo da seção
    Música são vídeos feitos no **Remotion** (`arcanne/remotion/`, cortes em 140 BPM, o
    andamento de "Odin on Acid"); como renderizar está em `arcanne/LEIAME.md`. Dois dos três
    aftermovies são verticais e viram coluna 9:16 no desktop. Contato de booking ainda só
    pela DM do Instagram: `contato.email` e `contato.whatsapp` vazios até o artista confirmar.
    O único script inline é o `js/idioma.js`, embutido no `<head>` pelo gerador, que calcula
    o hash da CSP sozinho; o resto fica em `js/app.js`.
  - Bruxo e Bruno Zampieri usam CSP com hash do `<script>` inline: **recalcule o `sha256`
    sempre que mudar o script**, senão ele não roda. Para recalcular e já gravar no
    cabeçalho:

    ```bash
    node -e "const f=process.argv[1],fs=require('fs'),c=require('crypto');const h=fs.readFileSync(f,'utf8');const m=h.match(/<script>([\s\S]*?)<\/script>/);const s=c.createHash('sha256').update(m[1],'utf8').digest('base64');fs.writeFileSync(f,h.replace(/script-src 'sha256-[^']*'/,\"script-src 'sha256-\"+s+\"'\"));console.log(s)" bruxo/index.html
    ```
- `crm/index.html`: página de vendas Site + CRM.
- `crm/app/index.html`: protótipo do CRM, arquivo único, dados no `localStorage`
  (`amp-crm:v1:<tenant>`, `amp-crm:prefs`).
  - Clientes de exemplo: `norte`, `okada`, `orbita`, `lab`.
  - App no celular: `crm/app/manifest.webmanifest` abre o painel da Amplitude Lab. No Supabase Auth, Site URL e Redirect URLs precisam apontar para `crm/app/`; sem isso, o link de recuperação de senha cai em `localhost`.
  - Código de acesso: a função `access-code` troca um código do dono por uma sessão. O hash fica em `access_codes`, nunca o código, e o dono troca ou desativa em Equipe e acesso. No iPhone, o app da tela de início não compartilha o login com o navegador, então o código é digitado dentro do app.
  - Operação (010_operacao.sql): Projetos (projects), Mensalidades (subscriptions + função subscription-link; o webhook marca o mês como pago), Arquivos (bucket privado arquivos, pasta = tenant_id, tabela files), cópia semanal (função backup, bucket privado copias, 12 mais recentes, domingo 3h), lembretes diários às 9h (app.daily_reminders) e avisos no celular (função push + crm/app/sw.js; chaves VAPID e o segredo interno ficam no Vault).
  - Perfis: owner, admin, sales, finance, viewer.
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
- Radar de leads: roda no navegador com Overpass e, em reserva, Nominatim por quadrantes; com `SERPER_API_KEY`, `GOOGLE_PLACES_KEY` ou `GEOAPIFY_KEY` (nessa ordem) usa o servidor primeiro. Link de rede social, WhatsApp, Linktree, bio.link ou iFood no lugar do site conta como "sem site" e fica em `link_social`.
- Apagar venda, proposta, lead ou lançamento só por `delete_record`, com motivo e autor. Nada é removido do banco.
- Vender para outras empresas: veja `crm/VENDER-O-CRM.md`. O plano só muda pelo servidor.
- **Chaves de acesso (só o dono):** menu "Chaves de acesso". O dono escolhe o perfil (Vendas, Financeiro, Leitura ou Admin) e a validade; a função `first-access` (`action:'create'`) gera `AMP-XXXX-XXXX-XXXX` de uso único e guarda só o hash em `invites.code_hash` (migração `006_chaves_acesso.sql`). O colaborador toca em "Tenho uma chave de cadastro" e cria e-mail e senha. Erros de chave têm limite por endereço (`invite_attempts`). O link `?chave=` preenche a chave.
- **App Android:** `crm-android/` é um WebView que abre `crm/app/?empresa=amplitudelab&app=android` (o painel se atualiza sozinho). O APK fica em `crm/app/amplitude-crm.apk`. A chave de assinatura nunca vai para o repositório: o workflow `crm-android.yml` usa os segredos `CRM_KEYSTORE_B64` e `CRM_KEYSTORE_PASS`, e sem eles não gera nada. Dentro do app, `window.AmpApp` copia texto e salva o CSV.
- **Fichas de anamnese (tatuagem, dono e admin):** menu "Fichas de anamnese". O estúdio gera um link privado por cliente (`anamnesis_links`, token de 64 caracteres, uso único, validade de 3, 7 ou 30 dias) e o cliente preenche e assina com o dedo em `crm/ficha/#<token>`, sem login. O token vai depois do `#` para não aparecer em registros de servidor. O envio passa por `anamnese_submit` (migração `007_anamnese.sql`), que confere o link, limita o tamanho, fecha o link e avisa no sino. As fichas (`anamnesis_forms`) são dado de saúde: só dono e admin leem e só o dono exclui. `crm/ficha/#demo` e o painel da demonstração mostram tudo sem gravar nada.
- **AI Sales (só a instalação do dono):** agente comercial no WhatsApp Business Cloud API (migrações `013_ai_sales.sql` e `014_ai_sales_allowed.sql`, função `ai-sales`). Liberado por empresa em `app.ai_sales_tenants` (fora da API); clientes que compram o CRM não têm. Modos: simulação (nada sai), desenvolvimento (só números de teste) e produção. Respeita a janela de 24 horas (fora dela, só template aprovado), o pedido de não contato e a conversa assumida por uma pessoa. Credenciais (Meta e chave do Claude) ficam no Vault como `ai:<empresa>:<nome>`, gravadas pela tela de Integrações. Regras puras e testes em `functions/ai-sales/core.ts` e `core.test.ts`.
- **AI Commander (só dono e admin da instalação do dono):** diretor operacional virtual (migrações `015_commander.sql`, `016_commander_despacho.sql` e `017_commander_ajustes.sql`, função `ai-commander`, aba AI Commander). Liberado em `app.commander_tenants`. Reaproveita as tabelas do CRM: tarefas da agenda ganharam categoria, prioridade, status, origem e histórico (`done_at` e `status` ficam de acordo por gatilho); projetos ganharam responsável, tipo e início. Tabelas próprias: `commander_settings`, `commander_alerts`, `commander_audits`, `commander_approvals`, `agent_dispatches`, `agent_activity`, `commander_reports`, `commander_chat`, `agent_identities`.
  - Números e auditoria são SQL fixo, sem IA: `commander_snapshot`, `commander_intel`, `commander_scan`, `commander_run_audit` e `commander_report_data`. O agendador `commander-monitor` roda a cada 15 minutos e respeita a frequência configurada. Cada problema tem uma chave fixa: vira um alerta só, fecha sozinho quando some, e alerta dispensado não volta por 30 dias. Um aviso no sino por auditoria, só para crítico ou alto.
  - O chat usa a mesma chave do Claude do AI Sales e só acessa dados pelas ferramentas da função (lista em `functions/ai-commander/core.ts`). A autonomia (somente análise, assistido, autonomia controlada) e as permissões são conferidas no servidor a cada ação; financeiro e fechar ou perder venda sempre pedem aprovação, e a aprovação só executa uma vez. Ações feitas pelo dono nos botões não passam por aprovação.
  - Despacho para o AI Sales: o Commander grava em `agent_dispatches` e chama `ai-sales` com `x-interno`; o AI Sales executa dentro das regras dele e devolve o resultado na mesma linha. A resposta do cliente fecha a tarefa como "respondeu" e o pagamento como "convertido" (gatilhos no banco). A mensagem fica ligada ao despacho (`ai_messages.dispatch_id`), então reenviar não manda duas vezes.
  - Regras fixas: pagamento só conta quando a cobrança está paga no sistema; cobrança vencida não é inadimplência (só vira confirmada por uma pessoa, `charges.delinquent_confirmed_at`); projeto só vira entregue com arquivo ligado em Arquivos. Teste de isolamento em `tests/commander_isolamento.sql` (roda e desfaz).
- Nunca coloque chaves secretas no repositório.

## Prévias temporárias (`previa/`)

Para mostrar uma demo a um cliente durante uma semana sem divulgar: o cliente avalia e a
equipe usa a semana para projetar a versão final. O link é entregue pelo chat.

**O que fica protegido e o que não fica.** O GitHub Pages é público e estático, e o
repositório também é público. Por isso a prévia não confia só em "endereço difícil":
- A pasta é `previa/<id>/`, com 16 letras e números sorteados, `noindex`, sem link de
  nenhuma página e fora de qualquer lista. `/lab/previa/` dá 404.
- O conteúdo vai **cifrado** (AES-256-GCM) em `previa/<id>/dados.bin`: textos, nome do
  cliente, fontes e imagens. O `index.html` da pasta só abre a prévia. A chave existe
  apenas no link, depois do `#`, e o navegador não manda essa parte para o servidor.
  Quem olha o repositório vê que a pasta existe, mas não o que tem dentro.
- **Não fica protegido:** quem tem o link completo pode repassar, e ele abre para
  qualquer pessoa até a validade. A data é conferida no navegador, então alguém com o
  link e conhecimento técnico consegue decifrar depois do vencimento enquanto o arquivo
  existir (e o histórico do git guarda o `dados.bin` antigo, ainda cifrado). Prévia não
  leva dado sensível de cliente.
- O nome do cliente não entra no repositório: nem na pasta, nem no commit, nem no PR,
  nem aqui. O link fica no chat e no histórico do lead no CRM.

**Validade.** 7 dias por padrão (`--dias`, de 1 a 30), até 23h59 de Brasília do último
dia, contados da criação (não do merge; se o merge atrasar, use `prorrogar`). Vencida, a
página mostra "saiu do ar" e não abre mais. A rotina `.github/workflows/previas.yml`
confere a pasta todo dia às 9h e fica vermelha, com e-mail do GitHub, enquanto houver
prévia vencida no repositório. Ela não apaga nada sozinha: a remoção vai por PR.

**Como criar.** Monte a demo numa pasta **fora do repositório**: `index.html` e os
arquivos que ele usa (fontes, imagens, CSS), sem CDN. Regras: script só dentro do
`index.html` (nada de `<script src>`), nenhum `onclick=` e afins (a CSP bloqueia; use
`addEventListener`), e caminhos de arquivo usados por script ficam em atributos do HTML,
porque dentro do `<script>` eles não são trocados. Links `#secao` funcionam. Players do
SoundCloud, YouTube, Mixcloud, Spotify e Apple Music podem entrar em `<iframe>`.

```bash
node previa/previa.js criar <pasta> [--dias 7] [--idioma pt|en]  # cria previa/<id>/ e mostra o link
node previa/previa.js atualizar "<link>" <pasta>                 # troca o conteúdo; link e data continuam
node previa/previa.js abrir "<link>" <pasta-saida>               # devolve os arquivos da demo
node previa/previa.js prorrogar <id> <dias>                      # empurra a validade
node previa/previa.js lista                                      # prévias no repositório e validades
node previa/previa.js limpar                                     # apaga as vencidas
```

- `--idioma` muda os avisos da página de abertura e a faixa "no ar até" que aparece no
  canto da demo. Use `en` para cliente que não fala português.
- Publicar: ramo, commit só de `previa/<id>/`, PR e merge com a aprovação do dono. O
  GitHub Pages atualiza em 1 ou 2 minutos (depois de `atualizar`, espere uns minutos
  antes de conferir).
- O link é `https://amplitudelab.github.io/lab/previa/<id>/#<chave>`. A chave não é
  gravada em lugar nenhum além do link: sem ele não há como abrir nem atualizar a prévia.
- A fonte não precisa ficar guardada: `abrir` recupera os arquivos a partir do
  repositório e do link.
- **Remover:** `node previa/previa.js limpar` (ou apague a pasta), commit, PR e merge. A
  página sai do ar alguns minutos depois.
- **Virou cliente:** `abrir` a prévia, levar os arquivos para a pasta do cliente na raiz
  (grupo "Sites de clientes"), refazer o que faltar e remover a prévia.

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
- Pacote para enviar: `git archive` do `main` sem `voxel-realms*`, sem `previa/` e sem
  os sites de clientes (`clientes/`, `bruno-zampieri/`, `bruxo/`, `darky/`, `linnx/`, `arcanne/` e os
  próximos que entrarem na lista), mais uma página `COMECE-AQUI.html` na raiz, zipado como
  `amplitude-lab-completo.zip`.
- Pull requests só quando pedido. O dono costuma pedir PR + merge no fim.

## Próximos passos

1. Conferir **Settings → Pages** em `amplitudelab/lab` (branch `main`, raiz) e trocar o
   link da bio para `https://amplitudelab.github.io/lab/`.
2. Registrar `amplitudelab.com.br` quando fechar os primeiros clientes do CRM.
3. CRM real: Fase 0 do `crm/IMPLEMENTACAO.md` (Supabase, Cloudflare, login).
