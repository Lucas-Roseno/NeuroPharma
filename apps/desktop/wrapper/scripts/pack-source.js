// =============================================================================
//  pack-source.js
//  Gera neuropharma-src.tar.gz a partir da raiz do projeto,
//  excluindo arquivos desnecessários para distribuição.
//
//  Saída: apps/desktop/NeuroPharma-Launcher/neuropharma-src.tar.gz
//
//  Uso: node scripts/pack-source.js
// =============================================================================

const { execSync } = require('child_process');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const WRAPPER_DIR = path.resolve(__dirname, '..');
const DESKTOP_DIR = path.resolve(WRAPPER_DIR, '..');
const PROJECT_ROOT = path.resolve(DESKTOP_DIR, '..', '..');
const LAUNCHER_DIR = path.join(DESKTOP_DIR, 'NeuroPharma-Launcher');
const OUTPUT_TAR = path.join(LAUNCHER_DIR, 'neuropharma-src.tar.gz');
// Published next to the tarball so the desktop app can verify its download.
const OUTPUT_SHA = `${OUTPUT_TAR}.sha256`;

function log(msg)  { console.log(`[pack-source] ${msg}`); }
function fail(msg) { console.error(`[pack-source] ERRO: ${msg}`); process.exit(1); }

if (!fs.existsSync(path.join(PROJECT_ROOT, 'package.json'))) {
  fail(`Raiz do projeto não encontrada em: ${PROJECT_ROOT}`);
}

if (fs.existsSync(OUTPUT_TAR)) {
  fs.unlinkSync(OUTPUT_TAR);
  log('Tarball anterior removido.');
}
if (fs.existsSync(OUTPUT_SHA)) fs.unlinkSync(OUTPUT_SHA);

log(`Gerando tarball do projeto em: ${OUTPUT_TAR}`);
log('(Excluindo: .git, node_modules, uploads, logs, .next, dist, *.tar, *.zip, *.AppImage)');

const excludes = [
  '.git',
  'node_modules',
  'uploads',
  'logs',
  '.next',
  'dist',
  '*.tar',
  '*.tar.gz',
  '*.zip',
  '*.AppImage',
  '*.exe',
  '*.dmg',
  '*.db',
].map((p) => `--exclude="${p}"`).join(' ');

const projectName = path.basename(PROJECT_ROOT);
const parentDir = path.dirname(PROJECT_ROOT);

try {
  execSync(
    `tar -czf "${OUTPUT_TAR}" ${excludes} -C "${parentDir}" "${projectName}"`,
    { stdio: 'inherit' }
  );
} catch (err) {
  fail(`Falha ao gerar o tarball: ${err.message}`);
}

const sizeMB = (fs.statSync(OUTPUT_TAR).size / 1024 / 1024).toFixed(1);
log(`OK! Tarball gerado: ${OUTPUT_TAR}`);
log(`Tamanho: ${sizeMB} MB`);

// Same "<hash>  <filename>" format as sha256sum.
const hash = crypto.createHash('sha256').update(fs.readFileSync(OUTPUT_TAR)).digest('hex');
fs.writeFileSync(OUTPUT_SHA, `${hash}  ${path.basename(OUTPUT_TAR)}\n`);
log(`SHA-256 gerado: ${OUTPUT_SHA}`);
