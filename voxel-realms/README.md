# Voxel Realms · Ato I — A Sombra sobre Aldoria

RPG de ação em voxels, no navegador (Three.js r128, sem build). Mundo aberto de 440 × 440 blocos,
gerado em pedaços (chunks) conforme o jogador anda, com ciclo de dia, pôr do sol e noite.

Jogar: `https://symbiozyy.github.io/amplitude-lab/voxel-realms/`
Versão anterior (V10, mapa único): `v10.html`

## Estrutura

| Arquivo | O que tem |
|---|---|
| `index.html` | marcação da interface e ordem de carregamento dos scripts |
| `css/style.css` | toda a aparência da interface (HUD, janelas, título) |
| `js/core.js` | utilidades, ruído, perfil gráfico (LEVE/MÉDIO/ALTO), renderer, materiais, céu e ciclo do dia, pós-processamento |
| `js/world.js` | regiões, relevo em voxels, rio, estradas, pontes, vegetação e carregamento de pedaços |
| `js/places.js` | vila, pedras de teleporte, pontos de interesse, livros de lore, placas, santuários e baús |
| `js/models.js` | esqueletos articulados e animação procedural de pessoas, animais e monstros |
| `js/fx.js` | partículas, brilhos, alertas no chão, feixes de saque, números de dano, ambiente por região |
| `js/parallax.js` | horizonte em duas camadas com paralaxe, diferente para cada bioma |
| `js/weather.js` | clima (sol, nublado, chuva, tempestade com raios, neblina, cinzas), neblina fixa por lugar |
| `js/items.js` | raridades, afixos, lendários, inventário e loja |
| `js/entities.js` | jogador, mercenários, aldeões, animais, monstros, elites, IA e projéteis |
| `js/combat.js` | ataque básico, dano, saque, santuários, baús, morte e chefes |
| `js/skills.js` | árvore de habilidades (Guerreiro, Arcano, Sobrevivência), magias, Fúria/Mana, dash e corrida |
| `js/classes.js` | classes (Guerreiro, Mago, Caçador), montarias (Leão Dourado) e o Mercante Sombrio |
| `js/ambience.js` | spawn dinâmico, fauna de dia × feras à noite, fumaça das chaminés, rotina dos aldeões, sons ambientes |
| `js/music.js` | trilha sonora épica procedural (Web Audio): temas de título, dia, vila, noite, combate e chefe |
| `js/quests.js` | missões (principal, secundárias e recompensas), diálogos, rumores e bestiário |
| `js/ui.js` | HUD, câmera, controles, minimapa, mapa-múndi, diário, inventário e janelas |
| `js/main.js` | carregamento, tela de título, laço do jogo e salvamento (localStorage) |

## Mundo

| Região | Nível | Destaques |
|---|---|---|
| Vila Pedraverde (centro) | 1 | praça, taverna com mercenários, forja da Helga, quadro de recompensas |
| Planície Dourada (sul) | 2 | trigais, Moinho de Hollow, Acampamento dos Bandidos |
| Campos de Lírio (leste) | 5 | flores e cerejeiras, Templo de Lírio, Colmeia Real |
| Floresta Ancestral (norte) | 8 | Torre Arruinada, Cemitério Esquecido (zumbis), Bosque do Ancião |
| Mangue Sombrio (oeste) | 11 | água rasa, Toca do Eremita, Cabana da Bruxa |
| Caldeira de Brasas (nordeste) | 14 | lava, Covil de Ignarok |

Os monstros acompanham o nível do jogador (no mínimo o nível da região).

## Progressão

- 1 ponto de habilidade por nível. Cada habilidade tem 3 níveis e entra num dos 4 atalhos da barra.
- Com cajado ou varinha o recurso vira Mana (regenera sozinha) e o ataque básico vira orbe arcano.
- Itens raros e lendários são incomuns de propósito; animais deixam materiais para vender.

## Classes, montaria e trilha sonora
- **Classes** no novo jogo: Guerreiro (Fúria, +vida e armadura, Giro), Mago (cajado, Mana, +Poder Mágico, Bola de Fogo) e Caçador (arco, +velocidade e crítico, Chuva de Flechas).
- **Leão Dourado** 🦁 na Forja da Helga (450 ouro): 🦁 ou R monta/desmonta; atacar, usar habilidade ou dar dash desmonta.
- **Mercante Sombrio** 🌑 na estrada do oeste: vende itens misteriosos (sempre mágicos ou melhores, com chance de lendário).
- **Trilha sonora** sintetizada em tempo real: cordas, metais, coral, flauta, alaúde e taiko; muda com dia, vila, noite, combate e chefes. Liga/desliga no menu.
- **Telas de 120 Hz**: o jogo acompanha a taxa da tela; efeitos e partículas são medidos em tempo, não em quadros. No menu, "Quadros" limita a 60 ou 30 fps para poupar bateria.
- Tocar na tela entra em tela cheia (no iPhone, use "Adicionar à Tela de Início").

## Missões

- **Principal (Ato I)**, 14 missões em cadeia: conversar com Bram, Planície, Capitão Rasgado,
  Pétalas Lunares, Rainha da Colmeia, Cemitério, Ancião Corrompido, Eremita, Bruxa Morgra,
  Ignarok e o retorno.
- **Secundárias**, 13 missões que aparecem ao descobrir cada região.
- **Recompensas** repetíveis no quadro da vila.

Para criar uma missão nova, basta acrescentar um objeto em `QD` (`js/quests.js`). Os tipos aceitos são
`talk`, `wp`, `kill`, `boss`, `collect`, `interact`, `zone`, `hire`, `lore` e `elite`.

## Próximos atos (ideias já plantadas na história)

- **Ato II — Terras Geladas:** o Rei Sem Nome fugiu da cova do Cemitério para o norte.
- Novas regiões entram em `REG` (`world.js`), novos monstros em `MT`/`BOSS` (`entities.js`) e
  modelos em `MDL` (`models.js`).

## Versão 15.0 — desvio refeito, poções, mochila e inventário completo
- **Desvio:** para a frente o herói mergulha e rola encolhido (ou desliza de barriga e levanta com as mãos); perto de um inimigo, para os lados rola sem tirar os olhos dele e para trás dá um salto. O corpo gira em volta do próprio centro e nenhuma parte entra no chão.
- **Colisão com o chão:** a altura do herói, dos inimigos e dos animais usa o chão sob a pegada inteira; subir degraus não deixa mais metade do corpo enterrada.
- **Poções:** não são mais infinitas. A Forja da Helga vende Poção de Vida Menor, Poção de Vida, Poção de Vida Maior, Antídoto e Elixir de Ânimo; cada uma ocupa um espaço da mochila. O 🧪 mostra quantas você tem e bebe a menor que cobre o que falta. Monstros, elites e chefes às vezes deixam cair.
- **Mochila:** todo herói usa uma mochila nas costas no lugar da capa. Bolsa Velha (30 espaços), Mochila de Viajante (36), de Aventureiro (42) e Real (48).
- **Inventário:** painel com retrato do herói ao vivo (arma, mão esquerda, anel e amuleto nos cantos), atributos, mochila com ícones 3D dos próprios itens, coluna do equipado (cabeça, peito, costas, luvas, botas) e medidores de vida, recurso, nível, carga e poções. Tocar duas vezes num item equipa ou bebe; dá para organizar, vender, desmanchar e largar.

## Versão 14.7 — correr sempre visível
- O botão 🏃 correr fica fixo acima do ✦ (o leque agora tem furtivo, tocha e montaria). No painel 🎛️ HUD, desligar "Correr sempre visível" devolve o correr para o leque; o 🏃 também pode ser arrastado no modo de mover.

## Versão 14.6 — HUD imersiva e ajustável
- **Menos botões na tela:** o ataque tem 4 botões em volta (mergulho, pulo, bloqueio e ✦). O ✦ abre um leque com correr, furtivo, tocha e montaria que fecha sozinho. Mapa, diário, primeira pessoa, HUD e menu ficam na gaveta ☰ ao lado do minimapa.
- **Minimapa limpo:** toque para mudar o zoom, segure para abrir o mapa; a região aparece como legenda embaixo.
- **Imersão:** fora de combate a HUD esmaece (botões mais que painéis) e volta ao tocar na tela ou entrar em luta; empurrar o joystick até a borda faz correr.
- **Painel 🎛️ HUD:** tamanho da interface, tamanho dos botões, opacidade, esmaecer, minimapa, números de dano, botões pular/bloquear, missões compactas/completas/ocultas e modo de arrastar botões e painéis (não deixa soltar em cima de outro). Se o tamanho escolhido não couber na tela, a HUD diminui sozinha só naquela tela.

## Versões 14.1 → 14.5 — combate, equipamento, inimigos, masmorras e motor voxel
- **Movimento (14.1):** pulo (⤒ / F) com golpe aéreo; mergulho com cambalhota no estilo Helldivers no lugar do dash; rios atravessáveis (água na cintura, mais lento); colisão pela borda do corpo; campo de visão no menu; chapéu não some mais; aviso de inventário cheio sem repetir; Vampiro mais resistente e servos do Necromante mais fracos.
- **Equipamento (14.2):** o que você equipa aparece no herói; armas de duas mãos; mão esquerda com escudo, grimório de bolso ou segunda arma; qualidade por nível (Rústico → do Dragão) com nível mínimo; desmanchar em Fragmentos Arcanos e ascender raridade no Durin; segunda árvore de outra classe com o Eremita Ulric.
- **Inimigos (14.3):** Escudeiro, Brutamontes, Xamã, Assassino, Feiticeiro de gelo e Cultista com comportamentos próprios; Veteranos; animais e aranhas mais detalhados; Ignarok refeito (voo, sopro em cone, rasantes, 3 fases).
- **Missões e masmorras (14.4):** masmorras com 3 salões, portões, totens, espinhos e jatos de fogo; missões em etapas com caçadas e defesas por ondas; nova missão O Cerco de Pedraverde.
- **Motor voxel (14.5):** textura de voxel no shader (grama, terra, madeira, pedra, folhas), franja de grama nas laterais, sombra nos cantos dos blocos; primeira pessoa com arcos de corte na tela, coice da câmera e mão esquerda; o herói não atravessa inimigos; ajuste automático de desempenho.

## Versão 14.0 — visual e grimório
- **Grimório 📖 (K):** a árvore de habilidades virou um livro de magia aberto: selo do elemento, grade de habilidades, atalhos, detalhe com DANO / MANA (ou Fúria, Almas, Sangue) / RECARGA e abas por elemento. Ícones em pixel art gerados a partir dos emojis e recoloridos na paleta de cada elemento; os mesmos ícones aparecem nos atalhos do HUD.
- **Ambientação por bioma:** floresta de outono (copas laranja e amarelas, pinheiros azul-petróleo, sombras azuladas, cervo branco), Campos de Lírio com bétulas roxas e templo de mármore branco, mangue com árvores azuis, cogumelos que brilham, água turquesa e lua verde gigante à noite, vila e planície mais vivas. Névoa, horizonte e partículas na cor de cada região.
- **Mais voxel, menos quadrado:** copas arredondadas feitas de camadas de voxels com folhinhas soltas; bordas chanfradas em todos os blocos e personagens (shader), grade de voxels no terreno.
- **Efeitos:** partículas "quentes" nascem brancas, ganham a cor e uma casca brilhante; estrelas de impacto; explosões de fogo (meteoro, bola de fogo, flecha explosiva, cadáver); arco do corte com gradiente; rastro da arma suave na cor da classe.
- **Combate mais fluido:** toques durante o golpe encadeiam o próximo do combo; tremor de câmera suave; personagens com tufos de cabelo, bolsinha no cinto, polegares e dobras na capa.

## Versão 13 (13.0 → 13.3)
- **Combate:** bloqueio 🛡️ (Z) com aparo perfeito; combo de 4 golpes com finalização; animações com o corpo inteiro para todas as classes; círculo de runas ao conjurar; impactos e rastros coloridos pelo poder da arma.
- **Caçador:** arco virado para a frente com flecha encaixada, bestas e lanças.
- **Classes novas:** Necromante (servos: esqueleto, arqueiro, golem de ossos) e Vampiro (roubo de vida com teto de 15%, magias com a mão, fraco a fogo). 5 personagens, um por classe. Menu de habilidades mostra só a árvore da classe.
- **IA:** visão de 24–28 m com linha de visão, audição de corrida e montaria, alerta em grupo, busca no último ponto visto.
- **Furtividade 🥷 (N):** inimigos te veem de mais perto; ataque pelas costas causa dano triplo.
- **Masmorras:** Cripta (cemitério), Caverna (torre) e Ruína (templo): 3 ondas, chefe e baú; lendário garantido na primeira vez.
- **Culinária** com a Marta (pratos com bônus de 4 min) e **forja** com o Durin (arma até +5).
- **Missões de classe** em 3 partes com recompensa lendária; **conquistas** com títulos (Diário → Conquistas); **eventos**: invasão noturna da vila e chefe errante.

## Primeira pessoa (v12.1)
Opcional: toque em 👁️ (ou tecla X) para alternar. Arraste para olhar em volta, o joystick anda na direção do olhar, a mira fica no centro (com mira assistida em um cone à frente). Braços, arma, arco e tocha aparecem na tela; o corpo some da imagem mas continua fazendo sombra. As florestas ficaram mais altas para as copas não taparem a visão.

## Montarias, chefes e economia (v12)
- **5 montarias** na Forja da Helga, cada uma com preço e velocidade: Cavalo Baio 🐴 (220), Leão Dourado 🦁 (480), Javali de Guerra 🐗 (720, +armadura montado), Lobo das Neves 🐺 (1050, rastro de geada) e Raptor de Brasa 🦖 (1800, a mais rápida, rastro de brasas). Comprou mais de uma? Toque em "Usar" para escolher.
- **Vitória contra chefe**: câmera lenta, coluna de luz, chuva de ouro, saque garantido (lendário na primeira vitória de cada chefe) e **subida de nível garantida**.
- **Economia**: loja da forja cobra 3× o valor de venda (antes 3,5×); ouro dos chefes escala com o nível.
- **Efeitos estilo Diablo**: pedaços voando na morte, manchas no chão, estrela nos críticos, coluna dourada ao subir de nível.
- **Modelos novos** inspirados em Hytale: cabeça maior, olhos com íris e brilho, sobrancelhas, nariz, bochechas, orelhas, franja, golas, barras, fivelas, punhos e solas; chapéu de patrulheiro com pena no Caçador.

## Arqueiro e saque por classe
- **Árvore do Arqueiro** 🏹 (a da sua classe aparece primeiro): Chuva de Flechas, Tiro Múltiplo, Olho de Águia, Salto Evasivo, Flecha Perfurante, Aljava Leve, Armadilha de Gelo, Falcão Caçador e Tempestade de Flechas. As habilidades de tiro exigem arco.
- **Drops pela classe**: cerca de 80% das armas que caem são da sua classe (Guerreiro: espadas, machados e maças; Mago: cajados e varinhas; Caçador: arcos), mas armas de outras classes ainda aparecem. Os atributos também puxam para a classe (Fúria, Vida e Armadura; Poder Mágico e Recarga; Crítico e Velocidade de Ataque), e os lendários preferem os da sua classe. Cada arma mostra se é da sua classe.

## Tocha, pets, mapa e chefes
- **Tocha** 🔥 (botão ou G): todo personagem tem; fica na mão livre (na outra mão se usar arco), solta fogo da ponta e ilumina de leve ao redor e à frente.
- **Pets**: o Mercador Tobias, na praça da vila, vende Lobo, Gato, Raposa e Ovelha, cada um com um bônus. Um pet por vez.
- **Minimapa** com ＋/－ (cinco níveis de zoom) e marcações de missões, locais, serviços e chefes. No mapa há filtros por tipo.
- **IA**: monstros esquivam de golpes e flechas, cercam em grupo (só dois atacam por vez), atacam e recuam, fogem quando feridos; atiradores mantêm distância.
- **Chefes em duas fases**: aos 50% de vida rugem, ficam imunes por um instante e passam a usar novas habilidades (Abalo, Anel de projéteis, Espiral, Chuva de fogo, Varredura, Poças).
- **Desempenho**: resolução dinâmica (segura o FPS em aparelhos medianos), partículas e anéis em pool, e um único `game.min.js` minificado. O código-fonte fica em `src/` (`node build.js` gera a versão publicada).

## Versão e atualização
A versão aparece no canto inferior esquerdo da tela de título e no menu. Ao abrir o jogo, ele compara com a versão publicada; se houver uma nova, mostra **VERSÃO NOVA DISPONÍVEL** com o botão **ATUALIZAR AGORA** (mesmo esquema do Quebrada Z). Para publicar uma versão nova, suba `VR_VERSION` (e a nota `VR_NOTE`) no topo de `src/index.html` e rode `node build.js`.

## Instalar como app (recomendado)
No Chrome do Android, abra o link do jogo e toque em **📲 INSTALAR APP** na tela de título (ou no menu ⋮ → *Instalar app*). O jogo ganha ícone, abre em tela cheia na horizontal, se atualiza sozinho e não passa pelo Play Protect.

## App Android
O APK é gerado automaticamente pelo GitHub Actions (`.github/workflows/android.yml`) a partir de `voxel-realms-android/`. Ele é um invólucro WebView que abre o jogo publicado, sempre em paisagem, em tela cheia e na maior taxa de atualização da tela. Como carrega o link, o jogo se atualiza sozinho.
Download: https://github.com/symbiozyy/amplitude-lab/releases/download/apk/voxel-realms.apk
