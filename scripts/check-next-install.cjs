/**
 * Vérifie que le paquet `next` est entièrement installé (évite ENOENT sur helpers.js, etc.).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const markers = [
  ['next', 'dist', 'build', 'templates', 'helpers.js'],
  ['next', 'dist', 'bin', 'next'],
];

const missing = [];
for (const parts of markers) {
  const p = path.join(root, 'node_modules', ...parts);
  if (!fs.existsSync(p)) missing.push(parts.join('/'));
}

if (missing.length) {
  console.error('\n[x] Installation incomplete: missing in node_modules:\n   - ' + missing.join('\n   - '));
  console.error('\nFix (close Cursor/IDE and all terminals using the project first):');
  console.error('   1. Delete the folder: node_modules');
  console.error('   2. Run: npm ci');
  console.error('   (or: npm install)\n');
  process.exit(1);
}
