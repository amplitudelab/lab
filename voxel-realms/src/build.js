// Gera dist/: um único game.min.js (todos os scripts, minificados), um único style.min.css e o index.html apontando para eles.
// Uso: node build.js   (precisa de terser e clean-css: npm i terser clean-css)
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const T=require('terser'),CC=require('clean-css');
const root=__dirname,out=path.join(root,'dist');
(async()=>{
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(path.join(out,'js'),{recursive:true});
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map(m=>m[1]).filter(s=>!s.includes('three.min'));
const code=scripts.map(s=>fs.readFileSync(path.join(root,s),'utf8')).join('\n;\n');
const r=await T.minify(code,{compress:{passes:2,pure_getters:true},mangle:true,format:{comments:false}});
if(!r.code)throw new Error('terser falhou');
const h=crypto.createHash('md5').update(r.code).digest('hex').slice(0,8);
fs.writeFileSync(path.join(out,'js/game.min.js'),r.code);
const css=['css/style.css','css/hud.css'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
const c=new CC({level:2}).minify(css);if(c.errors.length)throw new Error(c.errors.join());
fs.mkdirSync(path.join(out,'css'));fs.writeFileSync(path.join(out,'css/style.min.css'),c.styles);
// html
let first=true;
html=html.replace(/<script src="(js\/[^"]+)"><\/script>\n?/g,(m,s)=>{if(s.includes('three.min'))return m;if(first){first=false;return`<script src="js/game.min.js?v=${h}"></script>\n`}return''});
html=html.replace(/<link rel="stylesheet" href="css\/style.css">\n<link rel="stylesheet" href="css\/hud.css">/,`<link rel="stylesheet" href="css/style.min.css?v=${h}">`);
fs.writeFileSync(path.join(out,'index.html'),html);
for(const f of['sw.js','manifest.json'])fs.copyFileSync(path.join(root,f),path.join(out,f));
fs.cpSync(path.join(root,'icons'),path.join(out,'icons'),{recursive:true});
fs.copyFileSync(path.join(root,'js/three.min.js'),path.join(out,'js/three.min.js'));
const sz=f=>(fs.statSync(path.join(out,f)).size/1024).toFixed(0)+' KB';
console.log('scripts',scripts.length,'| código',(code.length/1024).toFixed(0)+' KB →',sz('js/game.min.js'),'| css',(css.length/1024).toFixed(0)+' KB →',sz('css/style.min.css'),'| versão',h);
})().catch(e=>{console.error(e);process.exit(1)});
