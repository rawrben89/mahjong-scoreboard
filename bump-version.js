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
  commitMsg = commitMsg.replace(/^(feat|fix|chore|refactor|style|docs|test|perf|remove):\s*/i, '');
  commitMsg = commitMsg.charAt(0).toUpperCase() + commitMsg.slice(1);
} catch (e) {
  commitMsg = 'New update.';
}

// ── Update splash + settings version + prepend changelog in index.html ───────
// The bundle stores HTML as escaped JS strings:
//   - attribute quotes appear as \" in the file
//   - closing tag slashes appear as /  (e.g. <\/div> → </div>)
let html = fs.readFileSync(idxPath, 'utf8');
const htmlBefore = html;

html = html.replace(
  /<div class=\\"splash-version\\">v[\d.]+<\\u002Fdiv>/,
  `<div class=\\"splash-version\\">v${newVer}<\\u002Fdiv>`
);

html = html.replace(
  /<span class=\\"settings-version-num\\" id=\\"settings-version\\">v[\d.]+<\\u002Fspan>/,
  `<span class=\\"settings-version-num\\" id=\\"settings-version\\">v${newVer}<\\u002Fspan>`
);

const changelogOpen = '<div id=\\"settings-changelog\\" style=\\"display:none\\">';
const newEntry =
  `<div class=\\"changelog-entry\\">\\n` +
  `        <div class=\\"changelog-ver\\">v${newVer}<\\u002Fdiv>\\n` +
  `        <div class=\\"changelog-desc\\">${commitMsg}<\\u002Fdiv>\\n` +
  `      <\\u002Fdiv>`;
html = html.replace(changelogOpen, `${changelogOpen}\\n      ${newEntry}`);

if (html === htmlBefore) {
  console.error('✗ Patterns not found in index.html — bundle format may have changed');
  process.exit(1);
}
fs.writeFileSync(idxPath, html);
console.log(`index.html → version + changelog updated to v${newVer}`);
console.log(`  Changelog entry: "${commitMsg}"`);

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
