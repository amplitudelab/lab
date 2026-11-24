# Página para DJs · Amplitude Lab

Página de vendas da Amplitude Lab voltada só para DJs: `amplitudelab.github.io/lab/djs/`.
Diferente dos "Sites de clientes", é página **da Amplitude** (marca, WhatsApp e orçamento da
Amplitude). Mostra os sites de artista que já estão no ar, rodando em vídeo, e referências
internacionais.

A ideia central da página: o site não é "uma página", é a ferramenta para o DJ conseguir mais
gigs (o que quem contrata precisa e o caminho até o pedido de booking) e um ambiente para os
ouvintes participarem (player, pedidos de música, "Eu vou", lista da comunidade).

Ordem: abertura, por que um site (dois públicos), vitrine, sites no ar, caminho do booking,
recursos para ouvintes, formulário de booking, o que vai no site, referências, como funciona,
perguntas, contato.

## Demo interativa (`demo/`)

`djs/demo/` é um site de DJ de mentira, **NOVA VOLTZ** (artista fictício, `noindex`), para o
visitante testar: o som é um groove sintetizado na hora com Web Audio (nada de música de
terceiros), o fundo e o logo reagem a ele, pedidos de música com votação, "Eu vou" nas datas,
lista da comunidade e press kit (estes três só simulam e guardam no `localStorage` do
navegador), e o booking de verdade. PT/EN com a mesma chave de idioma da página
(`djs:idioma`).

**Regra:** projeto que ainda é prévia (`previa/`) só aparece aqui com nome fictício e sem
nenhum dado real do cliente. Sites já publicados (ARCANNE, LINNX, BRUXO, DARKY, Bruno
Zampieri) aparecem com o nome.

## Booking pelo WhatsApp (`js/booking.js`)

Usado pela página e pela demo. Campos: nome, data, cidade, local/tipo de evento, duração do
set, orçamento e contato (obrigatórios: nome, data, cidade e contato). Ao enviar, monta a
mensagem no idioma da página e abre `wa.me`. **O número fica no atributo do formulário**:
`<form data-booking data-whats="5511999999999">` (só dígitos, com DDI e DDD). Vazio, como
aqui e na demo, o WhatsApp abre para a pessoa escolher o contato. Nenhum número real fica no
código desta página. Para o site de um DJ, copie o `booking.js` e preencha `data-whats` (e
`data-artista`, que entra no título da mensagem).

## Arquivos

| Quero mudar… | Onde |
|---|---|
| Textos em português | direto no `index.html` (cada texto tem `data-i="<chave>"`) |
| Textos em inglês | objeto `EN` no topo de `js/djs.js`, mesmas chaves |
| Visual | `css/djs.css` |
| Vídeos de fundo e vitrine | `remotion/` (ver abaixo) |
| Clipes de cada site (notebook e celular) | `assets/video/<site>-d.mp4` e `-m.mp4`, capas em `assets/img/` |

Texto novo no HTML precisa de `data-i` e da tradução em `EN`; sem a chave em `EN`, o inglês
mostra o português. Nomes de artistas e gêneros levam `class="notranslate" translate="no"`.

## Idioma

- PT e EN são textos nossos. O botão troca na hora, sem recarregar, e a escolha fica em
  `localStorage` (`djs:idioma`). Na primeira visita: navegador em português abre PT; qualquer
  outro abre EN. `?lang=en` ou `?lang=pt` no link força o idioma (bom para mandar por DM).
- O seletor 🌐 + usa o Google Tradutor (mesmo jeito do `tradutor.js` da raiz: cookie
  `googtrans=/pt/<idioma>` e recarrega). O script do Google só carrega quando alguém escolhe um
  desses idiomas; clicar em PT ou EN apaga o cookie e volta ao normal.

## Vídeos

- Tudo é `muted`, `playsinline`, carrega só perto da tela (`data-src`) e pausa fora dela e com a
  aba escondida. No celular (até 820 px) entram as versões verticais (`data-src-m`).
- Com `prefers-reduced-motion` nada toca sozinho: ficam as capas. A vitrine tem botão de tocar.
- O ponto verde do topo e o "120 BPM" piscam no tempo do fundo (lido do `currentTime` do vídeo).

| Arquivo | O que é |
|---|---|
| `assets/video/palco.mp4`, `palco-v.mp4` | Fundo da primeira tela e do contato: palco com lasers, chão em grade, anéis e equalizador, loop de 8 s a 120 BPM |
| `assets/video/vitrine.mp4`, `vitrine-v.mp4` | Vitrine de 28 s: cada site (e a demo) em notebook e celular, cortes a cada 8 batidas |
| `assets/video/<site>-d.mp4`, `-m.mp4` | Gravação de 9 s de cada site rolando (notebook 960 px, celular 360 px) |

## Remotion (`remotion/`)

Só o código vai para o repositório (`node_modules/`, `public/` e `out/` estão no `.gitignore`).

- `src/ritmo.js`: 120 BPM (uma batida = 15 quadros a 30 fps) e as cores da Amplitude.
- `src/Palco.jsx`: o palco em loop sem emenda; todo movimento fecha em 240 quadros.
- `src/Vitrine.jsx`: abertura "AMPLITUDE LAB × DJS", um bloco por site e o fecho "LIVE.". Os
  textos dos vídeos são só nomes e gêneros, para não precisar de versão por idioma. A lista de
  sites é `SITES`.

Para refazer:

1. `cd djs/remotion && npm install`
2. Grave os sites com `captura.js` (detalhes em "Gravações" abaixo) e ponha os `.webm` em
   `public/cap/<site>-d.webm` e `-m.webm`.
3. `node render.mjs stills` (quadros de conferência em `out/`) e `node render.mjs videos`.
   `--so=Vitrine,VitrineVertical` renderiza só essas; `--novo-bundle` depois de mudar `src/`.
   Neste PC o Chrome do Remotion não abre: use
   `REMOTION_CHROME=<...>/ms-playwright/chromium_headless_shell-<versão>/chrome-headless-shell-win64/chrome-headless-shell.exe`.
4. `node finalizar.js` recodifica para `../assets/video/` e tira as capas.

### Gravações

`node remotion/captura.js <pasta> [sites]`, com o repositório servido em `localhost:8099`
(`npx http-server . -p 8099 -c-1` na raiz) e `REMOTION_CHROME` apontando o navegador. Precisa
do `playwright-core` na versão que bate com o navegador instalado (instale fora do repositório).
Playwright, `chrome-headless-shell`, `recordVideo` no tamanho da tela: notebook 1440×900 e
celular 390×844 (`deviceScaleFactor` 2, `isMobile`). Cada site fica 3,5 s parado no topo e
depois rola suave por cerca de 4 telas em 9 s. ARCANNE abre com `?idioma=fixo`; na LINNX o
script clica em "Entrar em silêncio"; na demo, aperta o play para o fundo reagir. Os clipes da página saem do segundo 2,8, com 9 s,
recodificados com o ffmpeg que vem no Remotion (H.264, CRF 30, sem áudio, `+faststart`).

Licença do Remotion: gratuita para pessoa física e empresas de até 3 pessoas; acima disso,
precisa de licença paga (remotion.pro).

## Referências internacionais

Só texto e link para o site oficial (nenhuma imagem deles na página). Conferidos em
24/11/2026: charlottedewittemusic.com, peggygou.com, anyma.com, disclosureofficial.com,
boilerroom.tv, keinemusik.com, carlcox.com. Se algum sair do ar, troque o card.
