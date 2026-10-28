# Amplitude Lab

Site da Amplitude Lab: sites prontos por segmento (barbearias, estúdios de
tatuagem, hamburguerias, lojas de roupas e de decoração), com a marca do
cliente e pedidos direto no WhatsApp.

Publicado com GitHub Pages a partir da branch `main`.

- `index.html`: página (HTML e CSS), com segmentos, manifesto, modelos no
  celular, processo, preços, orçamento e dúvidas
- `app.js`: animações, frasco com líquido em onda, modelos rodando no celular,
  orçamento guiado, botões de WhatsApp, cards com inclinação 3D e faíscas
- `hero3d.js`: campo de partículas 3D do topo (Three.js), que reage ao mouse
  e solta ondas no toque
- `sculpture.js`: frasco 3D do manifesto (Three.js), com vidro iridescente,
  brilho de borda, anéis e halo de partículas
- `vendor/`: GSAP (core, ScrollTrigger, SplitText) e Three.js, sem depender de CDN
- `catalogo.html`: redireciona para `index.html#precos` (o catálogo agora é uma seção)
- `assets/`: ícones e imagem de prévia para redes sociais
- `demos/`: demos feitas para clientes, cada uma na sua pasta
  (`demos/<cliente>/index.html` e fotos em `img/`). A lista fica em
  `demos/index.html`, aberta em `https://symbiozyy.github.io/amplitude-lab/demos/`.
  As páginas têm `noindex` para não aparecerem no Google como site do cliente.
- `modelos/`: hub com os cinco modelos por segmento do plano de negócio, aberto em
  `https://symbiozyy.github.io/amplitude-lab/modelos/`. Cada modelo fica em
  `modelos/<segmento>/index.html` (barbearia, tatuagem, hamburgueria, moda, decoracao),
  com marca fictícia e um botão fixo no topo para voltar ao hub. `modelos/kit.css` e
  `modelos/kit.js` têm a barra do hub e a simulação do WhatsApp (as mensagens montadas
  nas demos não são enviadas; o botão final leva ao WhatsApp da Amplitude Lab).
  Cada modelo tem duas versões: a ilustrada (`modelos/<segmento>/`) e a com fotos
  reais (`modelos/<segmento>/fotos/`), com fotos gratuitas do Pexels salvas em
  `modelos/img/` como `<número da foto>.webp` (1200 px) e `<número>-p.webp` (600 px).
  `AL.px(id, largura)` em `kit.js` escolhe o tamanho. O hub abre a versão com fotos
  e tem um seletor para a ilustrada.
- `voxel-realms/`: jogo Voxel Realms (RPG voxel em Three.js), aberto em
  `https://symbiozyy.github.io/amplitude-lab/voxel-realms/` (detalhes em `voxel-realms/README.md`)

## Como editar

- **WhatsApp e Instagram:** objeto `CONFIG` no topo de `app.js` (`whatsapp` só com
  dígitos, `instagram` sem @). Os botões com `data-wa` em `index.html` levam a
  mensagem pronta que está nesse atributo.
- **Preços dos cards:** números em `index.html` (`data-num`) e textos de cada card.
- **Orçamento:** listas `PKGS` (tamanhos e faixas de preço), `MNT` (plano mensal),
  `FEATS` (o que o site faz e qual tamanho cada item pede) e `SEG_FEATS` (o que
  vem marcado para cada segmento) em `app.js`, na função `quote`.
- **Modelos no celular:** lista `MODELS` em `app.js`, na função `lab` (marca,
  pacote, prazo, descrição e foto de cada segmento).
- **Link direto para um tamanho:** `index.html?pacote=completo#monte` já abre o
  orçamento com o tamanho marcado (`vitrine`, `completo` ou `loja`).

Para testar localmente: `npx http-server .` e abrir `http://localhost:8080/`
(a escultura 3D só carrega servida por HTTP, não abrindo o arquivo direto).

Contato: WhatsApp (11) 95218-2016 · Instagram @amplitude_lab
