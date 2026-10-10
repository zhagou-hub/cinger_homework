import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root=resolve(import.meta.dirname,'..',process.argv.includes('--dist')?'dist':'.');
const port=Number(process.argv.find(arg=>arg.startsWith('--port='))?.split('=')[1]||5173);
const base=(process.argv.find(arg=>arg.startsWith('--base='))?.slice(7)||'').replace(/\/$/,'');
if(base&&(!base.startsWith('/')||base.includes('..')))throw Error('Invalid preview base path');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.csv':'text/csv; charset=utf-8','.md':'text/plain; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.bin':'application/octet-stream'};
createServer(async(req,res)=>{
  try{
    let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(base&&pathname===base){res.writeHead(302,{Location:base+'/'}).end();return;}
    if(base&&!pathname.startsWith(base+'/')){res.writeHead(404).end();return;}
    pathname=base?pathname.slice(base.length):pathname;
    const path=resolve(root,'.'+pathname);
    if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
    const file=(await stat(path)).isDirectory()?resolve(path,'index.html'):path;
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(await readFile(file));
  }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}).end('未找到文件');}
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}${base}/`));
