// Grade rítmica: 138 BPM, o andamento medido na faixa preferida do press kit.
export const BPM = 138;
export const FPS = 30;
export const BATIDA = (60 / BPM) * FPS; // 13,04 quadros
export const b = (n) => Math.round(n * BATIDA);

// "Psicodelia de alta classe": preto quente, latão e o branco do paletó; a cor forte vem das festas.
export const COR = {
  noite: '#0b0a08',
  latao: '#d9a35b',
  lataoClaro: '#f3d29a',
  fumaca: '#ece6da',
  uv: '#8b5cff',
};

// Pulso do bumbo: 1 na batida, cai rápido até a próxima.
export const bumbo = (frame) => Math.exp(-((frame % BATIDA) / BATIDA) * 5);
export const onda = (frame, periodo, n = 1, fase = 0) => Math.sin((frame / periodo) * Math.PI * 2 * n + fase);

// Grade de cor das imagens das festas: um pouco mais de contraste e calor.
export const GRADE = 'contrast(1.1) saturate(1.2) brightness(1.02)';

// Logo (1018 × 542): recortes de cada peça, em % da caixa, e o centro da gravata.
export const LOGO_PROP = 542 / 1018;
export const PECAS = {
  cartola: 'polygon(0% 0%, 25.5% 0%, 25.5% 15.7%, 7.9% 43.4%, 0% 43.4%)',
  o: 'polygon(9.3% 44.3%, 24.6% 20.3%, 39.8% 20.3%, 39.8% 100%, 9.3% 100%)',
  a: 'polygon(40.5% 18%, 72% 18%, 72% 100%, 40.5% 100%)',
  k: 'polygon(72.5% 18%, 100% 18%, 100% 100%, 72.5% 100%)',
};
export const GRAVATA = { x: 0.251, y: 0.618 };
