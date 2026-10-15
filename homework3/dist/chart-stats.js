import * as E from './engine.js';

const token=v=>JSON.stringify(E.missing(v)?null:v);
export function categories(rows,key){
 const groups=new Map();for(const row of rows){const id=token(row[key]);if(!groups.has(id))groups.set(id,{id,key:row[key]??null,count:0,rows:[]});const g=groups.get(id);g.count++;g.rows.push(row);}
 return [...groups.values()].sort((a,b)=>b.count-a.count);
}
export function groupedBoxes(rows,groupKey,valueKey,limit=8){
 return categories(rows,groupKey).slice(0,limit).map(g=>{const values=g.rows.map(r=>r[valueKey]).filter(E.numeric).sort((a,b)=>a-b),s=E.describe(values),iqr=(s.q3??0)-(s.q1??0),lower=s.q1===null?null:s.q1-1.5*iqr,upper=s.q3===null?null:s.q3+1.5*iqr,inside=values.filter(v=>v>=lower&&v<=upper);return {...g,...s,sourceCount:g.rows.length,low:inside[0]??null,high:inside.at(-1)??null,outliers:values.filter(v=>v<lower||v>upper)};});
}
export function contingency(rows,xKey,colorKey,xLimit=8,colorLimit=8){
 const x=categories(rows,xKey).slice(0,xLimit),colors=categories(rows,colorKey).slice(0,colorLimit),cells=x.map(g=>({key:g.key,values:colors.map(c=>g.rows.reduce((n,r)=>n+(token(r[colorKey])===c.id?1:0),0))}));
 const shown=cells.reduce((s,g)=>s+g.values.reduce((a,b)=>a+b,0),0);
 return {x,colors,cells,shown,total:rows.length,xTotal:categories(rows,xKey).length,colorTotal:categories(rows,colorKey).length};
}
export function missingTiles(rows,cols,bucketLimit=48){
 const size=Math.max(1,Math.ceil(rows.length/bucketLimit)),buckets=[];
 for(let start=0;start<rows.length;start+=size){const end=Math.min(rows.length,start+size);buckets.push({start,end,values:cols.map(k=>rows.slice(start,end).reduce((n,r)=>n+(E.missing(r[k])?1:0),0))});}
 return {buckets,cols};
}
export function missingComparison(before,after,beforeCols,afterCols){
 return afterCols.map(key=>({key,before:beforeCols.includes(key)?before.reduce((n,r)=>n+(E.missing(r[key])?1:0),0):null,after:after.reduce((n,r)=>n+(E.missing(r[key])?1:0),0)})).sort((a,b)=>Math.max(b.before??0,b.after)-Math.max(a.before??0,a.after));
}
export function numericFields(rows,cols,limit=5){
 const p=E.profile(rows,cols).filter(c=>c.type==='number'),measure=p.filter(c=>!/(^id$|_id$|^year$|编号|年份)/i.test(c.key));
 return (measure.length>=2?measure:p).slice(0,limit).map(c=>c.key);
}
export function evenlySample(rows,limit){if(rows.length<=limit)return rows;return Array.from({length:limit},(_,i)=>rows[Math.floor(i*(rows.length-1)/(limit-1))]);}
