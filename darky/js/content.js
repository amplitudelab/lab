/* ============================================================================
   CONTEÚDO DO SITE — tudo que é editável mora aqui.

   Regra da casa: nada inventado. Campo sem informação fica null, '' ou [] e a
   página simplesmente não mostra aquele bloco. Quando a informação chegar,
   preencha aqui e o bloco aparece sozinho.

   São três universos: DARKY (a porta de entrada, onde o artista se apresenta),
   SLOWLY e OBSKURIAL.

   Fontes do que já está preenchido (material enviado pelo artista):
   - "Release + Redes Sociais.docx"  → textos e links do DARKY
   - "SLOWLY RELEASE.txt"            → texto do SLOWLY
   - "Link FullSets.txt"             → vídeos dos sets
   - conversa com o artista          → OBSKURIAL é o projeto de high BPM
   ========================================================================== */

export const ARTISTA = {
  nome: 'BRUNO',
  nomeCompleto: 'Bruno Martins',
  cidade: 'São Paulo',
  fatos: [
    { valor: '11', rotulo: 'anos de idade quando começou como DJ' },
    { valor: '2010', rotulo: 'ano em que passou a exercer a profissão' },
    { valor: '3', rotulo: 'projetos independentes' },
  ],
  bioCurta:
    'Paulistano, Bruno Martins começou a se aventurar como DJ aos 11 anos e exerce a profissão desde 2010. Hoje assina três projetos independentes: Darky, Slowly e Obskurial.',
  bioLonga: [
    'O projeto Darky é representado pelo paulistano Bruno Martins. Foi com 11 anos que começou a se aventurar como DJ, e em 2010 passou a exercer a profissão.',
    'Seu principal conceito artístico é não ser rotulado. Dessa recusa nasceram três projetos independentes, cada um com a sua pista: Darky, Slowly e Obskurial.',
  ],
  // Ainda não enviados: preencha com texto (ou lista de parágrafos) e o bloco aparece.
  historia: null,
  influencias: null,
  trajetoria: null,
  filosofia: null,
  experiencia: null,
};

/* Contato comercial. Sem WhatsApp nem e-mail, o formulário monta o pedido e
   leva para a mensagem direta do Instagram. Preencha um dos dois e o envio
   passa a ir direto para lá. */
export const CONTATO = {
  whatsapp: '',            // só números com DDI e DDD. ex.: '5511999999999'
  email: '',               // ex.: 'booking@dominio.com.br'
  instagram: 'darkydj',    // do release
  agencia: { nome: 'Snake', logo: 'logos/snake' },
};

export const REDES = [
  { rede: 'Instagram', rotulo: '@darkydj', url: 'https://www.instagram.com/darkydj/', projeto: 'darky' },
  { rede: 'Spotify', rotulo: 'Darky no Spotify', url: 'https://open.spotify.com/intl-pt/artist/31tS1vbhefXhBAsu61diHn', projeto: 'darky' },
  { rede: 'SoundCloud', rotulo: 'soundcloud.com/darkydj', url: 'https://soundcloud.com/darkydj', projeto: 'darky' },
  { rede: 'SoundCloud', rotulo: 'soundcloud.com/progdarky', url: 'https://soundcloud.com/progdarky', projeto: 'darky' },
  { rede: 'YouTube', rotulo: 'Full set autoral 1', url: 'https://www.youtube.com/watch?v=V4_w00LrLhw', projeto: 'darky' },
  { rede: 'YouTube', rotulo: 'Full set autoral 2', url: 'https://www.youtube.com/watch?v=7whojgopDZM', projeto: 'darky' },
];

export const PROJETOS = {
  darky: {
    id: 'darky',
    rota: '',                     // o Darky é a porta de entrada do site
    nome: 'DARKY',
    logo: 'logos/darky-novo',
    logoLinha: 'logos/darky-branco',
    chamada: 'Não ser rotulado.',
    resumo: 'Progressive Trance que vai do Dark Progressive ao Techno, entre 134 e 142 BPM.',
    conceito: [
      'O principal conceito artístico do Darky é não ser rotulado. A base é o Progressive Trance, variando do Dark Progressive até o Techno, com fortes influências do Rock e das músicas dos anos 80 e 90.',
      'Com os BPMs entre 134 e 142, conquistou um grande espaço pelo Brasil.',
    ],
    vertentes: ['Progressive Trance', 'Dark Progressive', 'Techno'],
    influencias: ['Rock', 'Anos 80', 'Anos 90'],
    bpm: '134 – 142',
    bpmMin: 134, bpmMax: 142,
    faixas: ['Distúrbios Psicológicos', 'Feel Good', 'Nem Todos os Anjos São Bons', 'Saturn', 'Ina di Getto'],
    festivais: ['Baobá', 'Yanomami', 'Ultra Trance', 'Mundo Psicodélico', 'E-Trip'],
    duracaoSet: null,
    formatos: null,
    rider: null,
    release:
      'O Projeto Darky é representado pelo paulistano Bruno Martins. Apesar de ter apenas 5 anos na produção musical, foi com 11 anos que começou a se aventurar como DJ, começando a exercer a profissão em 2010. Seu principal conceito artístico é não ser rotulado, tendo como base o Progressive Trance mas variando do Dark Progressive até o Techno, formando assim sua identidade musical única e exclusiva, com fortes influências do Rock e músicas dos anos 80 e 90. Variando os BPMs entre 134 e 142, conquistou um grande espaço pelo Brasil. Darky é o responsável pelos hits "Distúrbios Psicológicos", "Feel Good", "Nem Todos os Anjos São Bons", "Saturn" e "Ina di Getto", que conquistaram as pistas de grandes festivais, como Baobá, Yanomami, Ultra Trance, Mundo Psicodélico e E-Trip.',
    som: [
      { tipo: 'youtube', id: 'V4_w00LrLhw', titulo: 'Full set autoral 1', url: 'https://www.youtube.com/watch?v=V4_w00LrLhw' },
      { tipo: 'youtube', id: '7whojgopDZM', titulo: 'Full set autoral 2', url: 'https://www.youtube.com/watch?v=7whojgopDZM' },
      { tipo: 'spotify', id: '31tS1vbhefXhBAsu61diHn', titulo: 'Darky no Spotify', url: 'https://open.spotify.com/intl-pt/artist/31tS1vbhefXhBAsu61diHn' },
      { tipo: 'soundcloud', id: 'darkydj', titulo: 'SoundCloud · darkydj', url: 'https://soundcloud.com/darkydj' },
      { tipo: 'soundcloud', id: 'progdarky', titulo: 'SoundCloud · progdarky', url: 'https://soundcloud.com/progdarky' },
    ],
    heroVideo: 'generated/darky-aura',
    fundo: 'bg/bg-darky',
    textura: 'texturas/darky',
    capa: 'darky/skull-02',
    fotos: ['darky/darky-01', 'darky/darky-02', 'darky/darky-03', 'darky/darky-04', 'darky/darky-05'],
    altFotos: [
      'Darky estendendo a mão tatuada em direção à câmera',
      'Darky de sobretudo preto, de perfil',
      'Darky de óculos escuros, braços abertos, com luz ao fundo',
      'Darky de sobretudo, com a mão na nuca',
      'Darky de óculos escuros, abrindo o casaco',
    ],
    videos: [
      { arquivo: 'videos/darky-ultra', titulo: 'Aftermovie Ultra', formato: 'h' },
      { arquivo: 'videos/darky-arcadia', titulo: 'Arcadia', formato: 'h' },
      { arquivo: 'videos/darky-arcadia-2', titulo: 'Arcadia', formato: 'h' },
      { arquivo: 'videos/darky-baoba', titulo: 'Aftermovie Baobá', formato: 'h' },
      { arquivo: 'videos/darky-unk', titulo: 'Aftermovie UNK', formato: 'v' },
      { arquivo: 'videos/pista-02', titulo: 'Ultra', formato: 'v' },
    ],
  },

  slowly: {
    id: 'slowly',
    rota: 'slowly',
    nome: 'SLOWLY',
    logo: 'logos/slowly-preto',
    logoLinha: 'logos/slowly-branco',
    chamada: 'Uma progressão de sentimentos.',
    resumo: 'As músicas mais lentas: psicodelia e melodia, dos BPMs baixos ao progressive melódico.',
    conceito: [
      'Projeto idealizado por Darky, focado nas músicas mais lentas, com muita psicodelia e cheio de melodias. Vai dos BPMs mais baixos até o progressive melódico.',
      'Sua identidade é causar impacto na pista, com uma progressão de sentimentos causados pelas melodias. Com muita felicidade, alegria e extremamente dançante.',
    ],
    palavras: ['psicodelia', 'melodias', 'felicidade', 'alegria', 'dançante'],
    vertentes: [],
    influencias: [],
    bpm: null,
    bpmMin: 118, bpmMax: 132,          // só para o ritmo da animação; não aparece como dado
    faixas: [],
    festivais: [],
    duracaoSet: null,
    formatos: null,
    rider: null,
    release:
      'Projeto idealizado por Darky. Focado nas músicas mais lentas, com muita psicodelia e cheio de melodias, indo desde os BPMs mais baixos até o progressive melódico. Sua identidade é causar impacto na pista, com uma progressão de sentimentos causados pelas melodias. Com muita felicidade, alegria e extremamente dançante.',
    som: [],
    heroVideo: null,
    fundo: 'bg/bg-slowly',
    textura: 'texturas/slowly',
    capa: 'slowly/slowly-01',
    fotos: ['slowly/slowly-01', 'slowly/slowly-02', 'slowly/slowly-03', 'slowly/slowly-08', 'slowly/slowly-06', 'slowly/slowly-09', 'slowly/slowly-07', 'slowly/slowly-04', 'slowly/slowly-05'],
    altFotos: [
      'Slowly com o punho erguido',
      'Slowly dançando de braço levantado',
      'Slowly fazendo sinal com as duas mãos',
      'Slowly de camiseta vinho, ajustando os óculos escuros',
      'Perfil de Slowly de óculos escuros',
      'Slowly de braços abertos, camiseta estampada',
      'Slowly de perfil fazendo o sinal de paz',
      'Slowly de braços abertos',
      'Slowly de camiseta branca, mãos abertas',
    ],
    videos: [
      { arquivo: 'videos/slowly-live-01', titulo: 'Slowly ao vivo', formato: 'v' },
      { arquivo: 'videos/slowly-live-02', titulo: 'Slowly ao vivo', formato: 'v' },
      { arquivo: 'videos/slowly-live-03', titulo: 'Slowly ao vivo', formato: 'v' },
      { arquivo: 'videos/slowly-live-04', titulo: 'Slowly ao vivo', formato: 'v' },
    ],
  },

  obskurial: {
    id: 'obskurial',
    rota: 'obskurial',
    nome: 'OBSKURIAL',
    logo: 'logos/obskurial',
    logoLinha: 'logos/obskurial',
    chamada: 'High BPM.',
    resumo: 'O projeto de high BPM do artista.',
    conceito: [
      'Obskurial é o projeto de high BPM do artista: a pista levada ao limite de velocidade.',
    ],
    vertentes: [],
    influencias: [],
    bpm: 'High BPM',
    bpmMin: 180, bpmMax: 210,
    faixas: [],
    festivais: [],
    duracaoSet: null,
    formatos: null,
    rider: null,
    release: null,
    som: [],
    heroVideo: 'generated/obskurial-fumaca',
    fundo: 'bg/bg-obskurial',
    textura: 'texturas/obskurial',
    capa: 'obskurial/art-01',
    fotos: [],
    altFotos: [],
    artes: ['obskurial/art-01', 'obskurial/art-02'],
    altArtes: [
      'Ilustração: figura de capuz preto forrado de vermelho, rosto pintado de caveira, mão estendida para a frente',
      'Ilustração: figura de capuz marrom com meia pintura de caveira, segurando uma chama na mão',
    ],
    videos: [
      { arquivo: 'videos/pista-01', titulo: 'Registro de pista', formato: 'v' },
      { arquivo: 'videos/darky-arcadia-2', titulo: 'Registro de pista', formato: 'h' },
      { arquivo: 'videos/darky-ultra', titulo: 'Registro de pista', formato: 'h' },
    ],
  },
};

/* Fotos do artista: ensaios sem projeto definido. Ficam na apresentação. */
export const FOTOS_ARTISTA = ['artist/bruno-01', 'artist/bruno-02', 'artist/bruno-03', 'artist/bruno-04', 'artist/bruno-05', 'artist/bruno-06', 'artist/bruno-07', 'artist/bruno-08', 'artist/bruno-09', 'artist/bruno-10', 'artist/bruno-11', 'artist/bruno-12'];
export const ALT_ARTISTA = [
  'Bruno de blazer preto, de perfil, ajustando os óculos',
  'Bruno de blazer, segurando os óculos ao lado do rosto',
  'Bruno de blazer, braços cruzados',
  'Bruno de blazer, olhando o relógio',
  'Bruno de camiseta azul e óculos azuis, mãos cruzadas',
  'Bruno de camiseta azul, mão no queixo',
  'Bruno de perfil, camiseta azul',
  'Bruno ajustando os óculos azuis',
  'Bruno de blazer e camisa estampada, ajustando os óculos',
  'Bruno de blazer e camisa estampada',
  'Bruno segurando os óculos ao lado do rosto',
  'Bruno ajustando o punho do blazer',
];

export const VIDEO_ARTISTA = { arquivo: 'videos/bruno-chamada', titulo: 'Vídeo chamada', formato: 'v' };

/* Press kit: arquivos para baixar. */
export const PRESS = {
  fotos: [
    { arquivo: 'press/bruno-oficial-01.jpg', previa: 'artist/bruno-01', rotulo: 'Bruno · 01' },
    { arquivo: 'press/bruno-oficial-02.jpg', previa: 'artist/bruno-02', rotulo: 'Bruno · 02' },
    { arquivo: 'press/bruno-oficial-03.jpg', previa: 'artist/bruno-05', rotulo: 'Bruno · 03' },
    { arquivo: 'press/darky-oficial-01.jpg', previa: 'darky/darky-01', rotulo: 'Darky · 01' },
    { arquivo: 'press/darky-oficial-02.jpg', previa: 'darky/darky-02', rotulo: 'Darky · 02' },
    { arquivo: 'press/slowly-oficial-01.jpg', previa: 'slowly/slowly-01', rotulo: 'Slowly · 01' },
    { arquivo: 'press/slowly-oficial-02.jpg', previa: 'slowly/slowly-08', rotulo: 'Slowly · 02', credito: '@lorrannascimento.ph' },
  ],
  logos: [
    { arquivo: 'logos/darky-novo.png', previa: 'logos/darky-novo', rotulo: 'Darky · novo logo', fundo: 'escuro' },
    { arquivo: 'logos/darky-branco.png', previa: 'logos/darky-branco', rotulo: 'Darky · branco', fundo: 'escuro' },
    { arquivo: 'logos/darky-preto.png', previa: 'logos/darky-preto', rotulo: 'Darky · preto', fundo: 'claro' },
    { arquivo: 'logos/darky-colorido.png', previa: 'logos/darky-colorido', rotulo: 'Darky · colorido', fundo: 'escuro' },
    { arquivo: 'logos/slowly-branco.png', previa: 'logos/slowly-branco', rotulo: 'Slowly · branco', fundo: 'escuro' },
    { arquivo: 'logos/slowly-preto.png', previa: 'logos/slowly-preto', rotulo: 'Slowly · preto', fundo: 'claro' },
    { arquivo: 'logos/obskurial.png', previa: 'logos/obskurial', rotulo: 'Obskurial', fundo: 'escuro' },
  ],
  // Quando o PDF profissional existir, coloque o caminho aqui (ex.: 'press/presskit.pdf').
  pdf: null,
};

export const TIPOS_EVENTO = ['Festival', 'Club', 'Festa independente', 'Evento privado', 'Outro'];
