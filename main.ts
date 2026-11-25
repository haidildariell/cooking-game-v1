// main.ts — program hand-in "Dapur Senja — Warung Kilat" (Node 22, stdlib saja).
// Menyalin game/ dan screenshots/ dari repo ini ke direktori output, lalu
// menulis dossier.json dengan buildDossier dari vendor/makefun-game.ts.
// Direktori output: MAKEFUN_OUTPUT_DIR bila diset, selain itu /output.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

function copyTree(name: string): void {
  const src = join(repoRoot, name);
  const dst = join(outDir, name);
  if (!existsSync(src)) throw new Error(`main.ts: ${name}/ tidak ditemukan di repo`);
  cpSync(src, dst, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
rmSync(join(outDir, 'game'), { recursive: true, force: true });
rmSync(join(outDir, 'screenshots'), { recursive: true, force: true });
copyTree('game');
copyTree('screenshots');

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`dossier.json ditulis (${dossier.length} bytes) ke ${outDir}`);
