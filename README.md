# Amplitude Lab

Site da Amplitude Lab, laboratório de experiências digitais: cartões digitais,
páginas de agendamento, displays interativos, página central e remake visual
para empresas, artistas e eventos.

Publicado com GitHub Pages a partir da branch `main`.

- `index.html`: página (HTML e CSS), com serviços, demos, processo, preços,
  calculadora de orçamento e dúvidas
- `app.js`: animações, frasco com líquido em onda, demos no celular,
  calculadora e envio pelo WhatsApp
- `sculpture.js`: frasco 3D do manifesto (Three.js)
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
  reais (`modelos/<segmento>/fotos/`), que usa fotos gratuitas do Pexels carregadas
  direto de `images.pexels.com` pelo número da foto (`AL.px(id)` em `kit.js`). O
  hub abre a versão com fotos e tem um seletor para a ilustrada.
- `voxel-realms/`: jogo Voxel Realms (RPG voxel em Three.js), aberto em
  `https://symbiozyy.github.io/amplitude-lab/voxel-realms/` (detalhes em `voxel-realms/README.md`)

## Como editar

- **Contatos:** objeto `CONFIG` no topo de `app.js` (`whatsapp` só com dígitos,
  `instagram` sem @, valor da `maintenance`).
- **Preços:** atributo `data-price` de cada card em `index.html` e o número
  mostrado (`data-num`). A calculadora lê os valores direto dos cards.
- **O que cada pacote inclui:** objeto `PKG` em `app.js` (itens cobertos e meses
  de manutenção grátis). É daí que sai a sugestão automática de pacote.
- **Link direto para um pacote:** `index.html?pacote=frequencia#monte` já abre a
  calculadora com o pacote marcado.

Para testar localmente: `npx http-server .` e abrir `http://localhost:8080/`
(a escultura 3D só carrega servida por HTTP, não abrindo o arquivo direto).

Contato: WhatsApp (11) 95218-2016 · Instagram @amplitude_lab
