# BRUNO · Darky · Slowly · Obskurial — inventário e pendências

Direção e desenvolvimento: AMPLITUDE LAB — Laboratório de Experiências Digitais.

## Como o site está montado

| Arquivo | Para quê |
|---|---|
| `index.html` | Casca única. As rotas `/darky/`, `/slowly/` e `/obskurial/` são cópias geradas por `node gerar-rotas.js`. |
| `js/content.js` | **Todo o conteúdo editável**: textos, links, contatos, listas de fotos e vídeos. Campo vazio não aparece. |
| `js/app.js` | Roteador (History API), vistas dos quatro climas, passagens, seletor, formulário. |
| `js/fx.js` | Fundo WebGL (um shader com quatro climas) e a geometria 3D do Obskurial. |
| `css/site.css` | Paleta, tipografia e layout de cada universo (`html[data-universo]`). |
| `assets/` | Versões para a web. Os originais não ficam no repositório. |

## Material recebido (ZIP de 11/11/2026, 1,98 GB)

### Fotos — 34 JPG e 6 PNG

| Origem no ZIP | O que é | Onde foi usado |
|---|---|---|
| `01 FOTOS P_ FLYER/01–03.png` | Capuz, pintura de caveira, fogo e aura violeta, com fundo transparente | **Darky** (`assets/darky/skull-01..03`) |
| `01 FOTOS P_ FLYER/DARKY_5–8.jpg` | Ensaio de blazer preto (4000×6000) | **Bruno** (`assets/artist/bruno-01..04`) |
| `01 FOTOS P_ FLYER/DARKY, _2, _3, _4.jpg` | Ensaio de camiseta azul | **Bruno** (`assets/artist/bruno-05..08`) |
| `Fotos Para Divulgação/darky2023-5, -6, -7, -8` | Blazer e camisa estampada | **Bruno** (`assets/artist/bruno-09..12`) |
| `Fotos Para Divulgação/darky2023-9, -10, -15, -16` e `darky2022-6` | Sobretudo preto, luz violeta | **Darky** (`assets/darky/darky-01..05`) |
| `SLOWLY - Fotos e Logo/` (camiseta branca, press kit 19 e 40) | Seleção que veio na pasta do projeto | **Slowly** (`assets/slowly/slowly-01..10`) |
| `OBSKURIAL - fotos e logo/darkycartoon2.png`, `darkycartoonfinal.png` | Duas ilustrações | **Obskurial** (`assets/obskurial/art-01..02`) |

Fotos repetidas entre "Fotos Para Divulgação" e a pasta do Slowly foram tratadas como do Slowly,
que é onde o artista as separou. As demais ficaram com o Bruno ou com o Darky pelo figurino.

### Logos

Darky (branco, preto, colorido, novo logo), Slowly (branco e preto), Obskurial e
**Agência Snake** — o arquivo veio marcado como obrigatório, então aparece no booking e no rodapé.

### Vídeos — 12 MP4, 1,4 GB

Entraram só trechos de 10 s, sem som, em 720p (≈1 MB cada):

| Origem | Trecho | No site |
|---|---|---|
| Aftermovie Ultra | 44–54 s | Darky |
| Arcadia 03 | 30–40 s | Darky |
| Arcadia 02 | 40–50 s | Darky |
| Aftermovie Baobá | 42–52 s | Darky |
| Slowly `VID_…081918` | 4–14 s | Slowly |
| Slowly `InShot_…` | 20–30 s | Slowly |
| Vídeo Chamada | 8–18 s | Galeria geral (sem projeto definido) |

Não usados: Aftermovie UNK Reels, Aftermovie VERTICA Ultra, Arcadia 01 e dois vídeos do Slowly
(mesmo material em outro corte).

### Áudio — 8 WAV, 585 MB — **pendente, não publicado**

`01 Wallerman`, `03 Paganini Stan`, `04 Max Headroom`, `ALEK (Skore master 16b)v2`, `Coraline`,
`Creepy`, `Hoist the Colours`, `Take Me`.

Não dá para saber de qual projeto é cada faixa, nem se podem ir ao ar inteiras. O site usa os
players oficiais (YouTube, Spotify, SoundCloud) dos links do release.

### Textos

- `Release + Redes Sociais.docx` → bio, conceito, vertentes, BPM, faixas, festivais e links do Darky.
- `SLOWLY RELEASE.txt` → conceito do Slowly.
- `Link FullSets.txt` → os dois sets no YouTube.

## Gerado no Higgsfield (MCP)

| Arquivo | Modelo | Entrada | Resultado |
|---|---|---|---|
| `assets/generated/darky-aura.mp4` | Kling 3.0, 3 s, sem som | `01 FOTOS P_ FLYER/02.png` | Aura violeta e fumaça em movimento. Rosto e pintura conferidos quadro a quadro: sem alteração. |
| `assets/generated/obskurial-fumaca.mp4` | Kling 3.0, 3 s, sem som | `darkycartoon2.png` | Fumaça vermelha atrás da ilustração. Traço mantido. |

Os dois foram convertidos em loop de ida e volta (6 s). Custo: 9 créditos dos 10 que a conta tinha.

## O que falta o artista mandar

Tudo abaixo já tem lugar no `js/content.js`; é só preencher.

- **Contato comercial**: WhatsApp ou e-mail de booking. Sem isso, o formulário monta o pedido e
  leva para a mensagem direta do Instagram @darkydj.
- **Obskurial**: release, vertentes, BPM, sets e links. Hoje a página tem só as duas artes e o logo.
- **Slowly**: vertentes com nome, BPM e links de áudio.
- **Bruno**: história, influências, trajetória, filosofia musical.
- **Rider técnico, duração do set e formatos** de cada projeto.
- **PDF do press kit** (caminho em `PRESS.pdf`). Por enquanto a seção tem "Salvar em PDF" pela impressão.
- Redes do Slowly e do Obskurial, se existirem.

## Para conferir com o artista

1. O logo do Slowly está escrito **"Slowlly"**, com dois L. O site escreve SLOWLY, como no briefing e
   no vídeo ao vivo.
2. O release diz "apenas 5 anos na produção musical". A frase envelhece; ficou só no texto oficial
   do press kit.
3. A ilustração do Obskurial tem no manto um brasão de casa de filme conhecido. Vale trocar ou
   apagar antes de divulgar.
4. O site está com `noindex`, como os outros sites de clientes. Para aparecer no Google, tirar a
   linha do `index.html` e rodar `node gerar-rotas.js`.
