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

## Versão 15.8 — horizonte, névoa e moeda de ouro
- **Fim dos blocos gigantes:** as montanhas e colinas do horizonte (camadas de paralaxe) seguiam a câmera pela metade do caminho; com o mundo maior, longe da vila elas entravam no mapa a 20–70 m do herói. Agora acompanham a câmera e ficam sempre a mais de 180 m, esmaecidas atrás da névoa.
- **Nada surge mais na tela:** a névoa termina antes do limite do que está carregado. O mundo carrega em círculo além da névoa, a troca de detalhe (LOD) acontece já dentro dela e monstros e animais nascem e aparecem dentro da névoa, chegando até você em vez de brotar na frente.
- **Moeda de ouro com o V de Voxel Realms** em pixel art no HUD, na loja, no inventário, nos avisos e nos números de ouro; no chão, pilhas de moedas douradas com uma moeda de pé cunhada com o V.

## Versão 15.7 — biomas 3× maiores, os Seis Fragmentos e chefes únicos
- **Cada bioma ficou 3× maior.** O mundo agora vai de −645 a +645 (antes ±372). Tudo o que existia — vilas, chefes, baús, santuários, livros, missões, masmorras — foi junto com a sua região, e o espaço novo ganhou flora, fauna e monstros da região. O rio também acompanhou.
- **12 Pedras de Teleporte novas** nos confins de cada região (Colina dos Pastores, Trigais do Leste, Prado das Fadas, Clareira das Corujas, Charco Profundo, Fendas de Magma, Vale das Folhas, Passo do Vento, Poço das Manadas, Oásis Perdido, Enseada dos Naufrágios e Geodo Cantante).
- **6 marcos novos** com diário próprio: Fazenda Abandonada, Forte da Estrada, Círculo das Fadas, Pedras dos Druidas, Vila Afogada (palafitas) e Forja dos Anões.
- **6 chefes únicos**, um por terra de fora, cada um no seu covil: **Sylvara, a Dríade Carmesim** (Trono de folhas), **Vorn, o Lich do Gelo** (cripta de pilares de gelo), **Juba-de-Fogo, o Rei da Savana** (Pedra do Rei), **Sarkhan, o Escorpião-Imperador** (obeliscos na areia), **Carapaça, o Caranguejo Colossal** (naufrágio) e **Nihil, o Arauto do Vazio** (espinhos de cristal). Todos com 3 fases.
- **Lutas de chefe mais complexas:** *Escudo de pilares* (o chefe fica imune e se cura até você destruir os 3 pilares; depois fica atordoado e vulnerável), *Onda de choque* (anel que se expande — pule ou desvie; na fase III vêm duas), *Maré* (três faixas avançando) e *Estouro* (três investidas seguidas). Os chefes antigos também ganharam: o Capitão (estouro), a Rainha (maré), o Ancião e Morgra (escudo de pilares) e Ignarok (onda de choque).
- **14 missões principais novas:** depois de Morgra, o Ancião Bram revela que o selo de Aldor tinha seis fragmentos. Para cada terra de fora: chegar à pedra dos confins e derrotar o guardião corrompido. Com os seis, "O Selo Restaurado" libera a luta contra Ignarok (que continua sendo a última).
- **30 missões secundárias novas:** relíquias para ativar, áreas para limpar e alvos com nome em cada marco e em cada confim.
- Saves antigos continuam: a posição do herói e o mapa revelado são levados para o lugar novo da sua região.

## Versão 15.6 — árvore de habilidades mais complexa
- **5 círculos por árvore** (I a V, pelo nível da habilidade). Para aprender no círculo II é preciso já ter 3 pontos gastos naquela árvore; III pede 7, IV pede 12 e V pede 18. O grimório mostra os círculos, os cadeados e quantos pontos faltam.
- **41 habilidades novas.** Guerreiro: Investida, Golpe Telúrico (fissura em linha), Lâmina Bumerangue, Execução (dobro em quem tem menos de 30% e zera a recarga se matar). Mago: Piscar, Orbe Glacial, Tormenta Elétrica. Caçador: Flecha Explosiva, Rede de Caça. Necromante: Maldição da Fraqueza, Prisão Óssea, Nuvem Pestilenta. Vampiro: Enxame de Morcegos, Abraço Sombrio. Mais passivas como Mestre de Armas, Colosso, Ira Inesgotável, Combustão, Hipotermia, Canalização, Sobrecarga, Fluxo Arcano, Franco-Atirador, Escaramuça, Predador, Hemorragia, Instinto Selvagem, Legião, Ceifador, Medula Profana, Sudário, Hemofilia, Pacto Carmesim, Predador Noturno, Sangue Nobre e Imortalidade.
- **Uma suprema por classe** no círculo V: Avatar da Guerra, Singularidade (buraco negro), Chuva Estelar, Exército dos Mortos e Senhor da Noite.
- **Escolhas exclusivas:** pares de passivas rivais (ex.: Baluarte ou Fúria Sanguinária); aprender uma tranca a outra. Dá para trocar no grimório pagando moedas (os pontos voltam).
- **Sinergias:** habilidades ganham dano por nível de outras (ex.: Bola de Fogo +8% por nível de Explosão de Chamas); o grimório mostra o bônus atual.
- **Missões principais** concluídas dão +1 ponto de habilidade.

## Versão 15.5 — arsenal, armaduras e acessórios refeitos
- **63 armas** com modelo próprio e **12 estilos de luta**. Guerreiro: espadas de uma mão, espadões e montantes de duas mãos, martelos de guerra, machadinhas, machados grandes e bardiche, katanas e nodachi, maças e estrela da manhã, adagas. Mago: cajados de cristal, lua, orbe e fogo, varinhas estelar, de brasa e de gelo. Caçador: arcos solar e da tempestade, besta de repetição, tridente, glaive e alabarda. Necromante: foices (sombria, ceifadora de almas, de ossos) e cajados de caveira. Vampiro: garras e rapieiras.
- **Cada família luta diferente** (combo de 4 golpes): espada (corte, revés, estocada, salto), adaga (estocadas rápidas e rajada de 3), machadinha (machadadas de cima e redemoinho), espadão (varridas largas, esmagar e giro), martelo (esmaga e atordoa, varrida, salto que abala o chão), katana (saque iaido, corte cruzado, corte subindo, corte em disparada), maça, lança (alcance e investida), foice (ceifa larga e giro duplo), garras (arranhões alternados e frenesi de 4) e rapieira (investida e rajada de estocadas). Dano e ritmo também mudam por família.
- **18 elmos** (viseira, crista, nasal, chifres curvos, dracônico, coroa de guerra, diadema, chapéu de mago com fivela e ponta curvada, chapéu emplumado, capuz sombrio, elmo de caveira, tricorne, bandana…) e **12 peitorais** (couraça com gola e placas, escamas, cota com tabardo, brigantina, sobretudo, túnica de batalha, manto de gola alta…), com ombreiras, punhos, joelheiras e canos de bota próprios. O amuleto aparece no peito; anéis e amuletos têm formatos novos.
- Cada base tem armadura própria e um bônus fixo pequeno: peças pesadas protegem mais; leves dão Poder Mágico, crítico ou velocidade.

## Versão 15.4 — regras de combate, progressão e luta final
- **Sem primeira pessoa:** o 👁️ troca o campo de visão (56° a 86°) e fica no lugar do botão de correr; correr é pelo joystick (ou Shift).
- **Colisão:** colunas, postes e pilares de construções (pedras de teleporte, santuários, templos) e o plano dos portais das masmorras não deixam mais o herói atravessar.
- **Barra de vida flutuante** com nome sobre errantes, elites e chefes, com marcas das fases.
- **Tocha:** só pode ser usada com uma mão livre (sem escudo, segunda arma, arco ou arma de duas mãos); o herói tira da cintura e acende na mão; a luz ficou mais forte e maior.
- **Segunda classe (Eremita):** custa 6000 + 150 por nível; habilidades dela causam 30% menos dano e recarregam 30% mais devagar; itens de classe caem 60% da principal e 40% da segunda.
- **Montarias:** de 650 a 8500 moedas; as mais caras correm um pouco mais (113% a 139% da corrida).
- **Dificuldade:** monstros sempre no seu nível (ou no da região, o que for maior), escalam mais forte e campeões/raros aparecem mais conforme você sobe.
- **Fases:** chefes do mundo têm 3 fases (50% e 22%), chefes de masmorra 3 fases (66% e 33%, chamando reforços), elites 2 (fúria aos 50%) e errantes 1.
- **Ignarok é a luta final:** fica invulnerável e mata com um golpe até todas as outras missões principais estarem concluídas; ficou bem mais forte.

## Versão 15.3 — trilhas de batalha, efeitos sonoros, montarias e economia
- **Trilhas de batalha diferentes:** cada luta escolhe um tema pelo inimigo mais perto e pela região — Choque de Aço (padrão), Fúria Selvagem (feras), Dança Macabra (mortos-vivos), Tempestade Gélida (neve e cristal), Maré Pirata (costa e bandidos) e Coração de Brasa (Ignarok). Cada tema tem andamento, harmonia, tambores e riff próprios.
- **Efeitos sonoros:** o golpe corta o ar conforme a arma (leve, pesada, mágica); o acerto soa como metal, osso, carne ou flecha; o arco estala a corda; o escudo ressoa; equipar faz o som da peça (metal, cota de malha, couro, tecido, joia, mochila); poções borbulham; moedas tilintam; passos mudam com o chão (grama, pedra, areia, neve, água) e viram cascos na montaria.
- **Montarias mais lentas:** de 114% (Cavalo Baio) a 137% (Raptor de Brasa) da corrida; antes chegavam a 191%.
- **Economia mais difícil:** itens raros e lendários caem bem menos, monstros comuns quase não soltam itens, baús dão 1 ou 2 itens e vender rende menos. Em troca a Helga vende peças sempre mágicas ou raras, dois níveis acima, e as masmorras dão raro garantido, fragmentos arcanos, poções e mais ouro.

## Versão 15.2 — mundo três vezes maior
- **Seis terras novas** num anel em volta do mapa antigo (área 3×): **Bosque Carmesim** (nível 9, outono vermelho e ruínas), **Picos Gelados** (18, neve, pinheiros gelados e mosteiro), **Savana Rubra** (8, acácias, capim alto e aldeia de tendas), **Dunas de Âmbar** (15, dunas, cactos e o Templo do Sol), **Costa das Conchas** (11, praia, coqueiros e farol) e **Vale de Cristal** (20, chão roxo, cristais que brilham e um obelisco).
- **Pedras de teleporte** em cada terra nova, estradas ligando ao mapa antigo e horizonte próprio em cada uma.
- **Monstros e animais novos:** lobos da neve, yetis, esqueletos glaciais, lobos carmesim, hienas, escorpiões, múmias, caranguejos, piratas, golems de cristal; raposas do ártico, cabras, antílopes, camelos, caranguejinhos e raposas de cristal.
- **NPCs e missões:** cada terra tem um NPC com 4 missões (conversa, caça, coleta e um líder com nome).
- **Eventos aleatórios enquanto explora:** caravana atacada (2 ondas), tesouro enterrado, chuva de meteoros (fragmentos arcanos), santuário perdido (bênção) e fera lendária — marcados no mapa.
- **Clima novo:** nevasca nos picos e tempestade de areia nas dunas.
- **Mais flora:** arbustos, troncos caídos e mais detalhes pequenos em todas as regiões; **a grama, flores e arbustos se dobram quando o herói passa**.
- As masmorras saíram dos cantos do mapa (agora só se chega pelo portal).

## Versão 15.1 — ragdoll, modelos, animações, drops e skills
- **Morte com ragdoll:** o corpo é arremessado na direção do golpe (mais longe com golpe pesado), tomba, quica e os membros balançam soltos até assentar; fica caído ~10 s e se desfaz em poeira. Vale para humanoides, animais, aranhas, sapos, slimes, abelhas, dragões e o herói.
- **Modelos menos quadrados:** as peças grandes dos personagens, monstros e animais têm bordas e cantos chanfrados de verdade, e os personagens perderam o ruído de "voxel" na pintura.
- **Variações de animação:** cada golpe sorteia uma variação (corte de cima na diagonal, corte subindo, giro com o corpo, varrida baixa, estocada em avanço); parado, o personagem espreguiça, confere a arma ou olha em volta; reação a dano varia; quadrúpedes galopam quando correm e mordem de jeitos diferentes.
- **Drops:** o item cai mostrando o próprio modelo (arma, escudo, elmo, peitoral, poção, mochila, joia) sobre um círculo de luz na cor da raridade; materiais viram trouxinhas ou cristais, ouro é pilha de moedas e o globo de vida é uma esfera.
- **Skills com assinatura por elemento:** círculo rúnico desenhado no chão com o símbolo do elemento; fogo com línguas de chama, gelo/ossos/sangue com cristais que brotam do chão, raio com descargas em zigue-zague, almas e sombras com espíritos em espiral, aço e vigor com meia-lua dourada e pedregulhos, vento com lâminas de ar.

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
