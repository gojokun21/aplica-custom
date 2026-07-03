// Copiază asset-urile TinyMCE self-hosted în public/tinymce (servite la /tinymce/*).
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'node_modules/tinymce');
const dest = resolve(root, 'public/tinymce');

if (!existsSync(src)) {
  console.warn('[copy-tinymce] node_modules/tinymce lipsește — sar peste copiere.');
  process.exit(0);
}
rmSync(dest, { recursive: true, force: true });
mkdirSync(dirname(dest), { recursive: true });
cpSync(src, dest, { recursive: true });
console.log('[copy-tinymce] TinyMCE copiat în public/tinymce');
