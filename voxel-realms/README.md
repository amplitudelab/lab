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
