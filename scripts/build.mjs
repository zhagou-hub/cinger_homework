import { mkdir, cp, rm, writeFile } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { collectSiteFiles } from './site-files.mjs';
const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'dist');
const files = await collectSiteFiles(root);
if (dirname(out) !== root || basename(out) !== 'dist') throw Error('Unsafe build directory');
console.log(`Rebuilding: ${out}`);
await rm(out, { recursive: true, force: true });
for (const file of files) {
 await mkdir(dirname(resolve(out, file)), { recursive: true });
 await cp(resolve(root, file), resolve(out, file));
}
await writeFile(resolve(out, '.nojekyll'), '');
console.log(`Build complete: ${files.length + 1} files. Ready for static hosting and GitHub Pages.`);
