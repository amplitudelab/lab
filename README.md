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
