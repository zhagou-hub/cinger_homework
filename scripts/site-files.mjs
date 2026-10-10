import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative, dirname, extname, sep } from 'node:path';

// Follow actual page resources, including locally fetched data and download links.
// Tests, preparation files and old unreferenced assets never enter the website.
export async function collectSiteFiles(root) {
 root = resolve(root);
 const queue = (await readdir(root)).filter(file => file.endsWith('.html')).map(file => resolve(root, file));
 const seen = new Set();
 while (queue.length) {
  const file = queue.pop();
  if (seen.has(file)) continue;
  if (!(await stat(file)).isFile()) throw Error(`Expected a file: ${file}`);
  seen.add(file);
  const extension = extname(file);
  if (!['.html', '.js', '.css'].includes(extension)) continue;
  const source = await readFile(file, 'utf8');
  const references = [];
  if (extension === '.html') {
   references.push(...[...source.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(match => match[1]));
  } else if (extension === '.js') {
   references.push(...[...source.matchAll(/["']((?:\.\/|\.\.\/)[^"'\n]+\.(?:js|json|csv|css|html|md))["']/g)].map(match => match[1]));
  } else {
   references.push(...[...source.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)].map(match => match[1]));
   references.push(...[...source.matchAll(/@import\s+["']([^"']+)["']/g)].map(match => match[1]));
  }
  for (const ref of references) {
   if (/^(?:\w+:|#|\/\/)/.test(ref) || ref.includes('${')) continue;
   // Inline HTML in a JS module resolves ./src/ links from the page root.
   const base = extension === '.js' && ref.startsWith('./src/') ? root : dirname(file);
   if (ref.startsWith('/')) throw Error(`Use a relative URL for GitHub project sites: ${ref}`);
   const target = resolve(base, decodeURIComponent(ref.split(/[?#]/)[0]));
   if (!target.startsWith(root + sep)) throw Error(`Resource leaves the site: ${ref}`);
   try { await stat(target); }
   catch { throw Error(`Missing resource in ${relative(root, file)}: ${ref}`); }
   queue.push(target);
  }
 }
 return [...seen].map(file => relative(root, file)).sort();
}
