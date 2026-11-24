# Oak · site oficial

Site do DJ e produtor **Oak** (João Victor Carvalho), no grupo "Sites de clientes" da
Amplitude Lab: `amplitudelab.github.io/lab/project-oak/`. Lema, tirado da bio do Instagram
dele: **"Psicodelia de alta classe"**. O logo é uma cartola e uma gravata, então a identidade
é de noite elegante (preto quente, latão, o branco do paletó) e a cor forte vem das festas.

Tudo fica nesta pasta (fontes, fotos, vídeos, áudio). Nada de CDN; as únicas coisas de fora
são o player do Spotify (só quando a pessoa pede) e o Google Tradutor (só quando a pessoa
escolhe um idioma além de PT e EN).

## Como mexer

| Quero mudar… | Onde |
|---|---|
| Textos em português | direto no `index.html` (cada texto tem `data-i="<chave>"`) |
| Textos em inglês | objeto `EN` no topo de `js/oak.js`, mesmas chaves |
| Visual | `css/oak.css` |
| Comportamento (abertura, som, corredor das noites, aftermovies) | `js/oak.js` |
| Número do booking | `data-whats` no `<form data-booking>` e os links `wa.me` do `index.html` |
| Vídeos feitos por nós (abertura, fundo, túnel, teaser) | `remotion/` (ver abaixo) |

Texto novo no HTML precisa de `data-i` e da tradução em `EN`. Nomes de festas, faixas e
pessoas levam `class="notranslate" translate="no"`. Textos alternativos de imagem usam
`data-i-alt`; placeholders, `data-i-ph`.

## De onde veio cada coisa

- **Release, logos, fotos, aftermovies, vídeos das festas e trechos de música**: press kit
  "Presskit Oak 2026" (dois ZIPs, 3,7 GB). Os originais não vão para o repositório.
- **Lema, número de booking e parceria com o Green Garden Festival**: bio do Instagram
  `@project_oak_` (lida em 24/11/2026: "Contrate 11 95800-8632", "Sócio proprietário:
  @greengarden.festival"). O press kit não traz contato.
- **Faixas do Spotify**: lista "Top tracks" do player do Spotify do artista (24/11/2026).
- **Selo**: a pasta "LOGOS GRAVADORA (obrigatório)" do press kit traz o logo da Bantuh
  Records; ele aparece no rodapé, no press kit e no fim do teaser.
- Os quatro trechos de música do press kit não têm nome; o site chama de "Trecho do press
  kit" e marca o 01 como o preferido do artista (é o arquivo marcado como preferência).

## Idioma

Igual à página `djs/`: PT e EN escritos por nós, troca na hora, escolha guardada em
`localStorage` (`oak:idioma`). Primeira visita: navegador em português abre PT, qualquer
outro abre EN. `?lang=en` ou `?lang=pt` força o idioma. O seletor 🌐 + usa o Google Tradutor
(cookie `googtrans=/pt/<idioma>` e recarrega); o script do Google só carrega nessa hora e a
CSP libera só os endereços dele. A CSP tem `'unsafe-inline'` em `script-src` e `data:` em
`frame-src` só por causa do tradutor: ele cria um iframe `data:` com um script embutido, e
esse iframe herda a CSP da página. Sem isso a tradução carrega mas não traduz. O site em si
não tem script inline.

## Som e pulso

- O som nunca começa sozinho: "Ligar som" no topo, "Entrar com som" na abertura ou o play de
  um trecho. Ao fim de um trecho, toca o próximo.
- Com som, um `AnalyserNode` lê os graves e escreve `--pulso` (0 a 1) no `<html>`: logo do
  topo, logo da primeira tela, ponto do BPM, túnel da seção Som e barras do botão respiram
  juntos. Sem som, um pulso de **138 BPM** (o andamento medido no trecho preferido) faz o
  mesmo, no tempo do vídeo de fundo.

## Seções

Abertura (vídeo) → primeira tela (mandala em vídeo, canhão de luz que segue o mouse) →
história (frases que acendem palavra por palavra) → som (trechos, Spotify) → noites
(corredor: a rolagem vertical anda na horizontal por sete festas) → aftermovies (cartões em
loop; o toque abre o filme inteiro com som) → retratos → booking → press kit → rodapé.

- A abertura aparece uma vez por sessão (`sessionStorage`), some com `?semabertura` e não
  existe com `prefers-reduced-motion`. Esc ou "Pular abertura" fecham.
- Vídeos só carregam perto da tela e pausam fora dela. Até 820 px (ou tela em pé) entram as
  versões de celular (`data-src-m`).
- Com `prefers-reduced-motion`: sem abertura, sem vídeo tocando sozinho, frases inteiras e o
  corredor vira uma faixa com rolagem lateral.

## Mídia

| Arquivo | O que é |
|---|---|
| `assets/video/abertura.mp4`, `abertura-v.mp4` | Abertura (12 batidas a 138 BPM): O, A e K entram um por batida, a cartola cai, as letras viram janelas para a festa e a câmera atravessa a gravata |
| `assets/video/salao.mp4`, `salao-v.mp4` | Fundo da primeira tela: as festas viradas mandala de seis gomos, loop de 16 batidas sem emenda |
| `assets/video/tunel.mp4`, `tunel-v.mp4` | Fundo da seção Som: túnel de hexágonos (o "O" do logo), entra com `mix-blend-mode: screen` |
| `assets/video/noites/<festa>.mp4`, `-m.mp4` | Corte de 6 s de cada festa (4:5), capas em `assets/img/noite-<festa>.jpg` |
| `assets/video/after/<filme>-loop.mp4` | Corte de 6 s de cada aftermovie para o cartão |
| `assets/video/after/<filme>.mp4` | Aftermovie inteiro, com som (540×960, H.264 + AAC) |
| `assets/audio/trecho-1..4.m4a` | Os quatro trechos do press kit (AAC 160 kbps) |
| `assets/img/` | Fotos em WebP (versão cheia e `-m`), logo, selo, capas, ícone e `og.jpg` |
| `assets/press/` | `oak-presskit.zip` (release, cinco fotos em alta, logos do Oak e da Bantuh) e os logos em PNG |

Os cortes das festas e dos aftermovies foram feitos com o ffmpeg que vem no projeto de
vídeo (`remotion/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe`): H.264, CRF
28 a 29, `+faststart`. As fotos saíram com o `sharp`.

## Vídeos animados (`remotion/`)

Só o código vai para o repositório (`node_modules/`, `public/` e `out/` estão no
`.gitignore`).

- `src/ritmo.js`: 138 BPM, paleta, grade de cor e os recortes de cada peça do logo.
- `src/Caleido.jsx`: caleidoscópio de seis gomos com imagens das festas.
- `src/Abertura.jsx`, `src/Salao.jsx`, `src/Tunel.jsx`: as três peças do site.
- `src/Teaser.jsx`: teaser vertical de divulgação (17 s, com o trecho preferido; o drop
  cai quando a câmera atravessa a gravata). Não vai para o site; `finalizar.js` deixa em
  `out/oak-teaser.mp4`.

Para renderizar de novo:

1. `cd project-oak/remotion && npm install`
2. Ponha em `public/`: `logo-4x.png` e `gravata-4x.png` (logo branco aumentado 4× e a
   máscara da gravata), `bantuh.png`, `faixa.wav` (o trecho preferido) e os trechos das
   festas em H.264 30 fps: `dreamon.mp4` (Dream On 5, de 10 s), `infinity.mp4` (Infinity 1,
   de 3 s), `horus.mp4` (Horus 1, de 1 s), `gg.mp4` (GG Showcase 1, de 8 s), `reveillon.mp4`
   (Réveillon 1, de 7 s), `sintetika.mp4` (Sintetika 2, de 9 s), `noite.mp4` (Noite Mágica
   4, de 1 s) e `fogo.mp4` (aftermovie principal, de 56 s). O Chrome do render não lê HEVC,
   e vários originais são HEVC.
3. `node render.mjs stills` (quadros de conferência em `out/`) e `node render.mjs videos`.
   `--so=Abertura,Salao` renderiza só essas; `--novo-bundle` depois de mudar `src/`.
   Se o Chrome do renderizador não abrir, aponte outro em `REMOTION_CHROME` (o
   `chrome-headless-shell` do Playwright funciona).
4. `node finalizar.js` recodifica para `../assets/video/` e tira as capas.

Licença do Remotion: gratuita para pessoa física e empresas de até 3 pessoas; acima disso,
precisa de licença paga (remotion.pro).

## O que falta do artista

- Confirmar o número de booking (veio da bio do Instagram, não do press kit) e, se houver,
  um e-mail.
- Nomes dos quatro trechos do press kit.
- Datas e cidades das festas (o site mostra só os nomes que estão no press kit).
- Release em inglês revisado por ele (o do site foi escrito a partir do português).
- Endereço final do SoundCloud: o link curto do release não abriu para leitura automática;
  conferir se abre no navegador.
- Domínio próprio, para tirar o `noindex`.
