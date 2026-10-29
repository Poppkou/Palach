// Assembles src/ into the three shipping forms of the game:
//   game.html      – artifact body (no doctype; CDN three.js, Google Fonts)
//   index.html     – standalone page for GitHub Pages
//   www/           – offline bundle for the Android APK (local three.js, fonts, music)
const fs = require('fs');
const path = require('path');
const root = __dirname;
const src = path.join(root, 'src');

const shell = fs.readFileSync(path.join(src, 'shell-head.html'), 'utf8');
const parts = fs.readdirSync(src).filter(f => /^\d\d-.*\.js$/.test(f)).sort();
const js = parts.map(f => `/* ---- ${f} ---- */\n` + fs.readFileSync(path.join(src, f), 'utf8')).join('\n');
const body = `${shell}<script>\n(()=>{\n${js}\n})();\n</script>\n`;

const wrap = (html) => `<!doctype html>\n<html lang="ru"><head><meta charset="utf-8">\n` +
  `<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n` +
  `</head><body>\n${html}\n</body></html>\n`;

fs.writeFileSync(path.join(root, 'game.html'), body);
fs.writeFileSync(path.join(root, 'index.html'), wrap(body));

// offline bundle
const www = path.join(root, 'www');
fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(path.join(www, 'music'), { recursive: true });
fs.mkdirSync(path.join(www, 'fonts'), { recursive: true });
let offline = body
  .replace(/<script src="https:\/\/cdnjs[^"]+three\.min\.js"><\/script>/, '<script src="three.min.js"></script>')
  .replace(/<link rel="preconnect"[^>]*>\n?/, '')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^"]*">/, '<link rel="stylesheet" href="fonts.css">');
fs.writeFileSync(path.join(www, 'index.html'), wrap(offline));
fs.copyFileSync(path.join(root, 'vendor', 'three.min.js'), path.join(www, 'three.min.js'));
const fontDir = path.join(root, 'vendor', 'fonts');
const have = new Set(fs.readdirSync(fontDir));
for (const f of have) fs.copyFileSync(path.join(fontDir, f), path.join(www, 'fonts', f));
const css = fs.readFileSync(path.join(root, 'vendor', 'fonts-local.css'), 'utf8')
  .split('@font-face').filter(b => { const m = b.match(/fonts\/([^)]+)\)/); return m && have.has(m[1]); })
  .map(b => '@font-face' + b).join('');
fs.writeFileSync(path.join(www, 'fonts.css'), css);
for (const f of fs.readdirSync(path.join(root, 'music'))) fs.copyFileSync(path.join(root, 'music', f), path.join(www, 'music', f));
console.log(`built: ${parts.length} modules, game.html ${(body.length / 1024).toFixed(0)} KB`);
