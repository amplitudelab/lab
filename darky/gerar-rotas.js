// Gera darky/, slowly/ e obskurial/ a partir do index.html da raiz, para que
// cada universo abra direto pelo link (o GitHub Pages só serve arquivos reais).
// Rode sempre que mudar o index.html:  node gerar-rotas.js
const fs = require('fs');
const path = require('path');
const base = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const dados = {
  darky: ['DARKY — projeto de Bruno', 'Darky: Progressive Trance, Dark Progressive e Techno entre 134 e 142 BPM. Projeto de Bruno Martins.', '#07040d'],
  slowly: ['SLOWLY — projeto de Bruno', 'Slowly: músicas mais lentas, psicodelia e melodias, dos BPMs mais baixos ao progressive melódico. Projeto de Bruno Martins.', '#f4ece1'],
  obskurial: ['OBSKURIAL — projeto de Bruno', 'Obskurial, um dos três projetos de Bruno Martins.', '#070203'],
};
for (const [rota, [titulo, desc, cor]] of Object.entries(dados)) {
  const html = base
    .replace(/(href|src)="\.\//g, '$1="../')
    .replace('data-universo="home"', `data-universo="${rota}"`)
    .replace(/<title>[^<]*<\/title>/, `<title>${titulo}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${desc}`)
    .replace(/(<meta name="theme-color" content=")[^"]*/, `$1${cor}`);
  fs.mkdirSync(path.join(__dirname, rota), { recursive: true });
  fs.writeFileSync(path.join(__dirname, rota, 'index.html'), html);
  console.log('ok', rota + '/index.html');
}
