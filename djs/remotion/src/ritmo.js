// Grade rítmica das peças: 120 BPM, para a batida cair em quadro inteiro (15 quadros a 30 fps).
export const BPM = 120;
export const FPS = 30;
export const BATIDA = (60 / BPM) * FPS; // 15
export const b = (n) => Math.round(n * BATIDA);

// Paleta da Amplitude Lab (CLAUDE.md, "Visual") com o violeta de pista para os lasers.
export const COR = {
  fundo: '#05070d',
  azul: '#5b8cff',
  azulClaro: '#a9c4ff',
  verde: '#3fcf9b',
  violeta: '#a36bff',
  branco: '#eef2ff',
};

// Pulso do bumbo: 1 na batida, cai rápido até a próxima.
export const bumbo = (frame) => Math.exp(-((frame % BATIDA) / BATIDA) * 5);

// Onda periódica que fecha o loop: n voltas inteiras em `periodo` quadros.
export const onda = (frame, periodo, n = 1, fase = 0) => Math.sin((frame / periodo) * Math.PI * 2 * n + fase);
