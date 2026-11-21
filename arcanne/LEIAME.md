# ARCANNE · site oficial

Site do DJ e produtor **ARCANNE** (Rodolfo Carvalho), no grupo "Sites de clientes" da
Amplitude Lab: `amplitudelab.github.io/lab/arcanne/` (português) e `.../arcanne/en/` (inglês).
Tudo fica nesta pasta (fontes, fotos, vídeos, áudio), sem CDN e sem biblioteca.

## Como mexer

| Quero mudar… | Onde |
|---|---|
| Links, discografia, contato de booking, mídia de cada seção, endereço do site | `dados.json` |
| Textos em português | `locales/pt-BR.json` |
| Textos em inglês | `locales/en.json` |
| Estrutura da página (HTML) | `gerar.js` |
| Visual | `css/site.css` |
| Comportamento (players, vídeos, menu, formulário) | `js/app.js` |
| Escolha de idioma na chegada | `js/idioma.js` |

Depois de mudar `dados.json`, `locales/` ou `gerar.js`, rode:

```bash
node arcanne/gerar.js
```

Ele reescreve `index.html`, `en/index.html`, `sitemap.xml` e `robots.txt`. **Não edite os
`index.html` à mão**: a próxima geração apaga.

Regras de conteúdo: campo vazio em `dados.json` não aparece na página, e nada é inventado.
Os fatos vêm do release do press kit, do Linktree (`linktr.ee/arcanne`), do Spotify
(discografia lida em 21/11/2026) e do YouTube. Nomes de faixas, festas e lugares não se
traduzem.

## Idioma

- Duas páginas estáticas, com o texto já no HTML (bom para busca): `/arcanne/` e `/arcanne/en/`.
- `js/idioma.js` roda antes de a página aparecer. A escolha manual (botão PT/EN, guardada em
  `localStorage` como `arcanne:idioma`) vale sempre. Sem escolha, só a raiz em português
  redireciona: vale o primeiro idioma do navegador que for `pt` ou `en`; se nenhum for, o fuso
  horário desempata (Brasil e Portugal ficam em português). Sem sinal nenhum, português.
  A localização nunca é pedida. Robôs de busca não são redirecionados.
- `?idioma=fixo` no endereço desliga o redirecionamento (para testes).

## Busca (SEO)

Já saem prontos: `lang`, canonical, `hreflang` (pt-BR, en e x-default), Open Graph,
`sitemap.xml` e dados estruturados `MusicGroup` (só com fatos confirmados).

**O site está com `noindex` de propósito**, pela regra dos sites de clientes enquanto moram em
`amplitudelab.github.io/lab`. Quando for para o domínio do artista: em `dados.json`, troque
`site.base` pelo endereço novo, ponha `site.indexar: true` e rode `node arcanne/gerar.js`.
O `robots.txt` só funciona na raiz de um domínio; aqui ele fica pronto para essa mudança.

## Mídia

| Arquivo | O que é |
|---|---|
| `assets/video/abertura.mp4`, `abertura-v.mp4` | Abertura de 3,7 s feita no Remotion (horizontal e vertical) |
| `assets/video/montagem.mp4`, `montagem-m.mp4` | Fundo da primeira tela, feito no Remotion: tríptico das três festas no desktop, coluna única no celular |
| `assets/video/pulso.mp4` | Fundo da seção Música, feito no Remotion: os anéis do logo pulsando com "Odin on Acid" |
| `assets/video/<festa>-loop.mp4` e `-m.mp4` | Loops sem som de cada aftermovie (normal e celular) |
| `assets/video/neelix-aftermovie.mp4`, `ricks-aftermovie.mp4` | Aftermovies completos, com som, para o player |
| `assets/audio/odin-on-acid.m4a` | Faixa completa enviada pelo artista (AAC 160 kbps) |
| `assets/audio/*-30s.m4a` | Cortes de 30 s do press kit |
| `assets/img/` | Fotos em WebP (versão cheia e `-m` para celular), logos, capas, ícones |
| `assets/press/` | Downloads: fotos em alta, seis logos em PNG e `arcanne-presskit.zip` |

- Arcadia 2023 toca pelo YouTube oficial (`youtube-nocookie`, só quando pedem); os outros dois
  aftermovies não estão no YouTube e ficam aqui.
- Dois aftermovies foram gravados na **vertical** (Arcadia e Neelix): no desktop eles viram
  colunas 9:16 ao lado do texto, nunca são cortados para 16:9. Rick's Experiment é horizontal
  e vira cena de tela cheia; no celular usa um recorte vertical do centro.
- Vídeo de fundo só carrega perto da tela, pausa fora dela e quando a aba fica escondida. No
  celular ou com economia de dados entram as versões `-m`. Com `prefers-reduced-motion` não
  há abertura nem vídeo de fundo: ficam as capas.
- O som nunca começa sozinho. Com o som ligado, um `AnalyserNode` lê os graves e faz o logo
  da primeira tela respirar com o bumbo (variável CSS `--pulso`).
- Os originais (ZIP de 590 MB do press kit e o WAV) não vão para o repositório.

### Refazer as mídias

As imagens e os vídeos que não são do Remotion foram gerados com o `sharp` e com o ffmpeg que
vem no Remotion (`remotion/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe`; ele
tem `scale`, `crop`, `trim`, libx264 e libfdk_aac, mas não tem `fps` nem `tile`). Parâmetros
usados: loops em H.264 CRF 27 (celular CRF 29), aftermovies CRF 26 com teto de 1,7 Mbps,
áudio AAC. O `.m4a` precisa de `-f mp4` nesse ffmpeg.

## Remotion (`remotion/`)

Projeto à parte para as peças de movimento. Fica fora do site publicado na prática (só o
código vai para o repositório; `node_modules/`, `public/` e `out/` estão no `.gitignore`).

- `src/ritmo.js`: grade de 140 BPM de "Odin on Acid" (medida no WAV do artista) e as cores.
- `src/Abertura.jsx`: os três anéis do logo aparecem um por batida, cenas das três festas
  passam dentro do anel central, o nome entra e o anel abre como íris.
- `src/Montagem.jsx`: tríptico em loop sem emenda; os cortes caem a cada 4 batidas e correm
  da esquerda para a direita.
- `src/Pulso.jsx`: lê o WAV quadro a quadro (`visualizeAudio`) e mexe os anéis por graves,
  médios e agudos.

Para renderizar de novo:

1. `cd arcanne/remotion && npm install`
2. Ponha em `public/`: `arcadia.mp4` e `ricks.mp4` (originais do press kit), `neelix.mp4`
   (o `.mov` do press kit convertido para H.264, porque o Chrome do render não lê HEVC),
   `odin.wav`, `anel.webp` e `palavra.webp` (de `../assets/img/`).
3. `node render.mjs stills` (quadros de conferência em `out/`) e `node render.mjs videos`.
   O bundle leva alguns minutos e fica guardado (`out/bundle.txt`); depois de mudar `src/` ou
   `public/`, passe `--novo-bundle`. Se o Chrome do Remotion não abrir, aponte outro com
   `REMOTION_CHROME=<caminho do chrome-headless-shell>`.
4. `node finalizar.js` recodifica as saídas de `out/` para `assets/video/` e tira as capas da primeira tela (tamanhos na lista `pecas`).

`npx remotion studio src/index.jsx` abre o editor visual.

Licença do Remotion: gratuita para pessoa física e empresas de até 3 pessoas; acima disso,
precisa de licença paga (remotion.pro).

## O que falta do artista

- **Contato de booking**: e-mail e/ou WhatsApp confirmados. Hoje o único canal é a DM do
  Instagram; os campos `contato.email` e `contato.whatsapp` estão vazios em `dados.json`.
- Rider técnico, se ele quiser no press kit.
- Datas e local da Arcadia e do Rick's Experiment (o site não mostra o que não foi confirmado).
- Link do álbum "Parallax" (não aparece como álbum no Spotify do artista).
- Release em inglês revisado por ele (o do site foi escrito a partir do release em português).
- Domínio próprio, para tirar o `noindex`.
