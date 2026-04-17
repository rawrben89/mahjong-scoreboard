const fs = require('fs');
const path = require('path');

const root    = __dirname;
const pkgPath = path.join(root, 'package.json');
const idxPath = path.join(root, 'index.html');
const swPath  = path.join(root, 'sw.js');

// ── Bump patch version ───────────────────────────────────────────────────────
const pkg    = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const parts  = pkg.version.split('.').map(Number);
parts[2]++;                         // bump patch: 1.0.0 → 1.0.1
const newVer = parts.join('.');
pkg.version  = newVer;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Version bumped to v${newVer}`);

// ── Update splash screen in index.html ───────────────────────────────────────
let html = fs.readFileSync(idxPath, 'utf8');
const htmlBefore = html;
html = html.replace(
  /<div class="splash-version">v[\d.]+<\/div>/,
  `<div class="splash-version">v${newVer}</div>`
);
if (html === htmlBefore) {
  console.warn('⚠️  splash-version not found in index.html — check the pattern');
} else {
  fs.writeFileSync(idxPath, html);
  console.log(`index.html → splash version updated to v${newVer}`);
}

// ── Update service worker cache key in sw.js ─────────────────────────────────
let sw = fs.readFileSync(swPath, 'utf8');
const swBefore = sw;
sw = sw.replace(/const CACHE = 'mahjong-v[\d.]+';/, `const CACHE = 'mahjong-v${newVer}';`);
if (sw === swBefore) {
  console.warn('⚠️  CACHE key not found in sw.js — check the pattern');
} else {
  fs.writeFileSync(swPath, sw);
  console.log(`sw.js → cache key updated to mahjong-v${newVer}`);
}
