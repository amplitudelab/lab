// Gera slowly/ e obskurial/ a partir do index.html da raiz (que é o Darky),
// para que cada universo abra direto pelo link — o GitHub Pages só serve
// arquivos reais. Rode sempre que mudar o index.html:  node gerar-rotas.js
const fs = require('fs');
const path = require('path');
const base = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const dados = {
  slowly: [
    'SLOWLY — projeto de Bruno Martins',
    'Slowly: as musicas mais lentas, com psicodelia e melodia, dos BPMs mais baixos ao progressive melodico. Um dos tres projetos de Bruno Martins.',
    '#f4ece1',
  ],
  obskurial: [
    'OBSKURIAL — projeto de Bruno Martins',
    'Obskurial: o projeto de high BPM de Bruno Martins, a pista levada ao limite de velocidade.',
    '#070203',
  ],
};
for (const [rota, [titulo, desc, cor]] of Object.entries(dados)) {
  const html = base
    .replace(/(href|src)="\.\//g, '$1="../')
    .replace('data-universo="darky"', 'data-universo="' + rota + '"')
    .replace(/<title>[^<]*<\/title>/, '<title>' + titulo + '</title>')
    .replace(/(<meta name="description" content=")[^"]*/, '$1' + desc)
    .replace(/(<meta name="theme-color" content=")[^"]*/, '$1' + cor);
  fs.mkdirSync(path.join(__dirname, rota), { recursive: true });
  fs.writeFileSync(path.join(__dirname, rota, 'index.html'), html);
  console.log('ok', rota + '/index.html');
}
