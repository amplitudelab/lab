# DARKY · SLOWLY · OBSKURIAL — inventário e pendências

Os três projetos de Bruno Martins. Direção e desenvolvimento: AMPLITUDE LAB.

## Como o site está montado

Três universos, três rotas. **O Darky é a porta de entrada** e é nele que o artista se
apresenta — a biografia vale para os três projetos, mas aparece uma vez só.

| Rota | Endereço | O que tem |
|---|---|---|
| Darky | `/lab/darky/` | Hero, manifesto, andamento, **o artista**, faixas, festivais, mosaico, audiovisual, som, ponte, booking, press kit |
| Slowly | `/lab/darky/slowly/` | Hero, conceito, equalizador, galeria-roleta, audiovisual, ponte, booking |
| Obskurial | `/lab/darky/obskurial/` | Hero, conceito (high BPM), andamento, artes, audiovisual, ponte, booking |

| Arquivo | Para quê |
|---|---|
| `index.html` | Casca única, com a tela de abertura. `slowly/` e `obskurial/` são cópias geradas por `node gerar-rotas.js`. |
| `js/content.js` | **Todo o conteúdo editável**: textos, links, contatos, listas de fotos e vídeos. Campo vazio não aparece. |
| `js/app.js` | Roteador, abertura, vistas, passagens, roleta, formulário. |
| `js/fx.js` | Fundo WebGL (três climas) e a geometria 3D do Obskurial. Só carrega em máquina que aguenta. |
| `css/site.css` | Paleta, tipografia e layout de cada universo (`html[data-universo]`). |
| `assets/` | Versões para a web. Os originais não ficam no repositório. |

### Abertura

A tela de carregamento anima os três logos em sequência e só libera a experiência quando
as peças pesadas do universo já estão na memória — é isso que evita o travão na primeira
animação. A barra mostra o progresso real. A saída é por CSS, com um prazo de segurança,
para a tela nunca ficar presa se o navegador pausar as animações (aba em segundo plano).

### O que é leve e o que é pesado

O site mede o aparelho e serve o que ele aguenta:

| | Celular / máquina fraca | Desktop |
|---|---|---|
| Fundo WebGL | não carrega | carrega |
| Cenário | textura + vídeo em 568×320 | textura + vídeo em 960×540 |
| Imagens | só a versão de 900 px, sem `srcset` | 900 px ou 1800 px, conforme a tela |
| Vídeos | versão `-m` (320–640 px) | 480–960 px |
| Passagens | 60% das peças | todas |
| Paralaxe de rolagem e de cursor | desligada | ligada |
| Players (YouTube, Spotify, SoundCloud) | entram quando a seção se aproxima | entram sozinhos assim que a máquina fica livre |

Peso medido em 375 px, rolando a página inteira do Darky: **2,4 MB**. Sem rolagem lateral
em nenhuma rota.

### Galeria em roleta

Clicar e arrastar gira a galeria, com inércia, como uma roleta. A foto não fica
selecionável nem é arrastada para fora. Também responde a setas do teclado e ao gesto
horizontal do trackpad. A tira de fotos do artista gira sozinha devagar e pode ser pegada
do mesmo jeito.

## Material recebido (ZIP de 11/11/2026, 1,98 GB)

### Fotos — 34 JPG e 6 PNG

| Origem no ZIP | O que é | Onde foi usado |
|---|---|---|
| `01 FOTOS P_ FLYER/01–03.png` | Capuz, pintura de caveira, fogo e aura violeta, fundo transparente | **Darky** (`assets/darky/skull-01..03`) |
| `01 FOTOS P_ FLYER/DARKY_5–8.jpg` | Ensaio de blazer preto (4000×6000) | **Artista** (`assets/artist/bruno-01..04`) |
| `01 FOTOS P_ FLYER/DARKY, _2, _3, _4.jpg` | Ensaio de camiseta azul | **Artista** (`assets/artist/bruno-05..08`) |
| `Fotos Para Divulgação/darky2023-5, -6, -7, -8` | Blazer e camisa estampada | **Artista** (`assets/artist/bruno-09..12`) |
| `Fotos Para Divulgação/darky2023-9, -10, -15, -16` e `darky2022-6` | Sobretudo preto, luz violeta | **Darky** (`assets/darky/darky-01..05`) |
| `SLOWLY - Fotos e Logo/` | Seleção que veio na pasta do projeto | **Slowly** (`assets/slowly/slowly-01..10`) |
| `OBSKURIAL - fotos e logo/` | Duas ilustrações | **Obskurial** (`assets/obskurial/art-01..02`) |

### Logos

Darky (branco, preto, colorido, novo logo), Slowly (branco e preto), Obskurial e
**Agência Snake** — o arquivo veio marcado como obrigatório, então aparece no booking e no
rodapé. Todos têm uma versão `-m` para o celular.

### Vídeos — 12 MP4, 1,4 GB

Entraram como trechos de 10 s sem som, em duas resoluções, mais três fundos de 14 s:

| Papel | Origem | Trecho |
|---|---|---|
| Fundo do Darky | Aftermovie Ultra | 60–74 s |
| Fundo do Slowly | Slowly ao vivo (InShot) | 26–40 s |
| Fundo do Obskurial | Arcadia 02 | 12–26 s |
| Clipes do Darky | Ultra, Arcadia 02 e 03, Baobá, UNK, VERTICA | 10 s cada |
| Clipes do Slowly | os quatro registros da pasta do projeto | 10 s cada |
| Clipes do Obskurial | Arcadia 01 e dois registros de pista | 10 s cada |
| Vídeo do artista | Vídeo Chamada | 8–18 s |

Os clipes do Obskurial são registros de pista do artista, sem nome de evento na legenda:
material audiovisual do projeto ainda não foi enviado.

### Áudio — 8 WAV, 585 MB — **pendente, não publicado**

`01 Wallerman`, `03 Paganini Stan`, `04 Max Headroom`, `ALEK (Skore master 16b)v2`,
`Coraline`, `Creepy`, `Hoist the Colours`, `Take Me`. Não dá para saber de qual projeto é
cada faixa, nem se podem ir ao ar inteiras. O site usa os players oficiais.

### Textos

- `Release + Redes Sociais.docx` → bio, conceito, vertentes, BPM, faixas, festivais e links do Darky.
- `SLOWLY RELEASE.txt` → conceito do Slowly.
- `Link FullSets.txt` → os dois sets no YouTube.
- Conversa com o artista → **Obskurial é o projeto de high BPM**.

## Gerado no Higgsfield (MCP)

| Arquivo | Modelo | Entrada | Resultado |
|---|---|---|---|
| `assets/generated/darky-aura.mp4` | Kling 3.0, 3 s | `01 FOTOS P_ FLYER/02.png` | Aura violeta e fumaça. Rosto e pintura conferidos quadro a quadro: sem alteração. |
| `assets/generated/obskurial-fumaca.mp4` | Kling 3.0, 3 s | `darkycartoon2.png` | Fumaça vermelha atrás da ilustração. Traço mantido. |
| `assets/texturas/darky.webp` | GPT Image 2.6 | texto | Fumaça violeta sobre rocha. Abstrata, sem pessoas. |
| `assets/texturas/slowly.webp` | GPT Image 2.6 | texto | Gradiente líquido creme, pêssego e lilás. |
| `assets/texturas/obskurial.webp` | GPT Image 2.6 | texto | Geometria corrompida em vermelho sobre preto. |
| `assets/texturas/obskurial-2.webp` | GPT Image 2.6 | texto | Espelho partido com luz vermelha. Reserva, não usada. |

As texturas são fundo abstrato: nenhuma representa o artista. Custo total: 10 créditos,
que era todo o saldo da conta.

## O que falta o artista mandar

Tudo abaixo já tem lugar no `js/content.js`; é só preencher.

- **Contato comercial**: WhatsApp ou e-mail de booking. Sem isso, o formulário monta o
  pedido e leva para a mensagem direta do Instagram @darkydj.
- **Obskurial**: release completo, vertentes com nome, faixa de BPM, sets e links. Hoje a
  página se apoia em "high BPM", nas duas artes e no logo.
- **Slowly**: vertentes com nome, BPM e links de áudio (não há seção de som sem links).
- **Artista**: história, influências, trajetória, filosofia musical.
- **Rider técnico, duração do set e formatos** de cada projeto.
- **PDF do press kit** (caminho em `PRESS.pdf`). Por enquanto a seção tem "Salvar em PDF"
  pela impressão.
- Redes do Slowly e do Obskurial, se existirem.

## Para conferir com o artista

1. O logo do Slowly está escrito **"Slowlly"**, com dois L. O site escreve SLOWLY, como no
   briefing e no vídeo ao vivo.
2. O release diz "apenas 5 anos na produção musical". A frase envelhece; ficou só no texto
   oficial do press kit.
3. A ilustração do Obskurial tem no manto um brasão de casa de filme conhecido. Vale trocar
   ou apagar antes de divulgar.
4. O site está com `noindex`, como os outros sites de clientes. Para aparecer no Google,
   tirar a linha do `index.html` e rodar `node gerar-rotas.js`.
