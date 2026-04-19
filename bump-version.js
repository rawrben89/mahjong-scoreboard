const fs           = require('fs');
const path         = require('path');
const { execSync } = require('child_process');

const root    = __dirname;
const pkgPath = path.join(root, 'package.json');
const idxPath = path.join(root, 'index.html');
const swPath  = path.join(root, 'sw.js');

// ── Bump patch version ───────────────────────────────────────────────────────
const pkg    = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const oldVer = pkg.version;
const parts  = oldVer.split('.').map(Number);
parts[2]++;
const newVer = parts.join('.');
pkg.version  = newVer;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Version bumped to v${newVer}`);

// ── Get last commit message for changelog ────────────────────────────────────
let commitMsg = '';
try {
  commitMsg = execSync('git log -1 --pretty=%s', { cwd: root }).toString().trim();
  // Strip conventional commit prefixes for readability
  commitMsg = commitMsg.replace(/^(feat|fix|chore|refactor|style|docs|test|perf|remove):\s*/i, '');
  // Capitalise first letter
  commitMsg = commitMsg.charAt(0).toUpperCase() + commitMsg.slice(1);
} catch (e) {
  commitMsg = 'New update.';
}

// ── Update splash + settings version + prepend changelog in index.html ───────
let html = fs.readFileSync(idxPath, 'utf8');
const htmlBefore = html;

html = html.replace(
  /<div class="splash-version">v[\d.]+<\/div>/,
  `<div class="splash-version">v${newVer}</div>`
);
html = html.replace(
  /<span class="settings-version-num" id="settings-version">v[\d.]+<\/span>/,
  `<span class="settings-version-num" id="settings-version">v${newVer}</span>`
);

// Prepend new changelog entry after the opening <div id="settings-changelog">
const changelogOpen = '<div id="settings-changelog" style="display:none">';
const newEntry =
  `<div class="changelog-entry">\n` +
  `        <div class="changelog-ver">v${newVer}</div>\n` +
  `        <div class="changelog-desc">${commitMsg}</div>\n` +
  `      </div>`;
html = html.replace(changelogOpen, `${changelogOpen}\n      ${newEntry}`);

if (html === htmlBefore) {
  console.warn('⚠️  patterns not found in index.html — check the selectors');
} else {
  fs.writeFileSync(idxPath, html);
  console.log(`index.html → version + changelog updated to v${newVer}`);
  console.log(`  Changelog entry: "${commitMsg}"`);
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
