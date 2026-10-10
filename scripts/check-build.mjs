import assert from 'node:assert/strict';
import { readdir, stat, access } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { collectSiteFiles } from './site-files.mjs';
const root = resolve(import.meta.dirname, '..'), dist = resolve(root, 'dist');
const expected = (await collectSiteFiles(root)).map(file => file.replaceAll('\\', '/'));
const deployed = (await collectSiteFiles(dist)).map(file => file.replaceAll('\\', '/'));
assert.deepEqual(deployed, expected, 'Source and deployed resource graphs must match');
const walk = async dir => (await Promise.all((await readdir(dir, { withFileTypes: true })).map(entry =>
 entry.isDirectory() ? walk(resolve(dir, entry.name)) : [resolve(dir, entry.name)]))).flat();
const files = await walk(dist);
assert.deepEqual(files.map(file => relative(dist, file).replaceAll('\\', '/')).sort(), [...expected, '.nojekyll'].sort(), 'Build must not contain stale files');
await access(resolve(dist, '.nojekyll'));
const bytes = (await Promise.all(files.map(async file => (await stat(file)).size))).reduce((sum, value) => sum + value, 0);
console.log(`Build verified: ${files.length} files, ${(bytes / 1024 / 1024).toFixed(2)} MiB. All local dependencies exist and use relative paths.`);
