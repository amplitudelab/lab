// Servidor estático mínimo para o preview local (sem dependências).
const http = require('http');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const porta = +process.argv[2] || 8099;
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.pdf': 'application/pdf', '.apk': 'application/vnd.android.package-archive' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(raiz, p);
  if (!f.startsWith(raiz)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) {
    if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' }); return res.end(); }
    f = path.join(f, 'index.html');
  }
  if (!fs.existsSync(f)) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404'); }
  const st = fs.statSync(f);
  const cab = { 'Content-Type': tipos[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };
  const r = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  if (r) {
    const ini = r[1] ? +r[1] : 0, fim = r[2] ? +r[2] : st.size - 1;
    res.writeHead(206, { ...cab, 'Content-Range': `bytes ${ini}-${fim}/${st.size}`, 'Content-Length': fim - ini + 1 });
    return fs.createReadStream(f, { start: ini, end: fim }).pipe(res);
  }
  res.writeHead(200, { ...cab, 'Content-Length': st.size });
  fs.createReadStream(f).pipe(res);
}).listen(porta, () => console.log('http://localhost:' + porta));
