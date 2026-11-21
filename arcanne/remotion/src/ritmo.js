// Grade rítmica de "Odin on Acid": 140 BPM, medido no WAV do artista
// (varredura de 136 a 150 BPM com pente alinhado em fase; 140 ficou isolado no topo).
export const BPM = 140;
export const FPS = 30;
// Uma batida em quadros (12,857 a 30 fps).
export const BATIDA = (60 / BPM) * FPS;
export const b = (n) => Math.round(n * BATIDA);

// Cores tiradas do material do artista: preto do fundo de estúdio, branco-osso das camisetas
// e do pano de palco, laranja do pano de palco (Arcanne 5) e da camiseta da ficha (Arcanne 4).
export const COR = {
  tinta: '#0b0b0c',
  osso: '#f1ece4',
  sinal: '#ff5a1f',
};

// Tratamento comum das imagens dos aftermovies, para as três festas conversarem entre si.
export const GRADE = 'contrast(1.08) saturate(0.88) brightness(0.96)';
