import * as E from './engine.js';
import {period} from './visual-engine.js';

const token=v=>JSON.stringify(E.missing(v)?null:v);
export function studyFields(rows,cols=E.columns(rows)) {
 const profile=E.profile(rows,cols),numbers=profile.filter(p=>p.type==='number'),measures=numbers.filter(p=>!/(^id$|_id$|^year$|编号|年份)/i.test(p.key));
 return {numbers:(measures.length?measures:numbers).map(p=>p.key),categories:profile.filter(p=>p.type==='text'&&p.unique<=30&&p.unique>0).sort((a,b)=>Number(a.unique===1)-Number(b.unique===1)||a.unique-b.unique).map(p=>p.key),dates:profile.filter(p=>p.type==='date').map(p=>p.key),profile};
}
export function reconcileStudy(rows,cols,spec={},sample=false) {
 const f=studyFields(rows,cols),pick=(key,list,fallback)=>list.includes(key)?key:list.includes(fallback)?fallback:list[0]||'';
 const metric=pick(spec.metric,f.numbers,sample?'body_mass_g':''),dimension=pick(spec.dimension,[...f.categories,...f.dates],sample?'species':f.categories[0]||f.dates[0]);
 const relatives=f.numbers.filter(k=>k!==metric),splits=f.categories.filter(k=>k!==dimension);
 return {metric,dimension,related:spec.related===''?'':pick(spec.related,relatives,sample?'flipper_length_mm':''),split:spec.split===''?'':pick(spec.split,splits,sample?'sex':''),interval:['day','week','month','year'].includes(spec.interval)?spec.interval:'month'};
}
export function buildStudy(rows,cols,spec={},sample=false) {
 const fields=studyFields(rows,cols),config=reconcileStudy(rows,cols,spec,sample),{dimension,metric,related,split,interval}=config,time=fields.dates.includes(dimension),map=new Map();
 rows.forEach((row,index)=>{const key=dimension?(time?period(row[dimension],interval):row[dimension]??null):null,id=token(key);if(!map.has(id))map.set(id,{id,key,records:[]});map.get(id).records.push({row,index});});
 let groups=[...map.values()].map(g=>{const values=g.records.map(r=>r.row[metric]).filter(E.numeric),s=E.describe(values),iqr=(s.q3??0)-(s.q1??0),inside=values.filter(v=>v>=s.q1-1.5*iqr&&v<=s.q3+1.5*iqr);return {...g,...s,total:g.records.length,missing:g.records.length-s.count,low:inside.length?Math.min(...inside):null,high:inside.length?Math.max(...inside):null,correlation:related?E.correlation(g.records.map(r=>r.row),related,metric):null,pairs:g.records.filter(r=>E.numeric(r.row[related])&&E.numeric(r.row[metric])).length};});
 if(time)groups.sort((a,b)=>a.key===null?1:b.key===null?-1:String(a.key).localeCompare(String(b.key)));
 else groups.sort((a,b)=>b.total-a.total);
 groups.forEach((g,i)=>{g.colorIndex=i%8;});
 const shown=time?groups.filter(g=>g.key!==null).slice(0,48):groups.slice(0,8),paired=rows.map((row,index)=>({row,index})).filter(r=>E.numeric(r.row[related])&&E.numeric(r.row[metric]));
 const splitMap=new Map();if(split)for(const r of rows){const id=token(r[split]);if(!splitMap.has(id))splitMap.set(id,{id,key:r[split]??null,total:0});splitMap.get(id).total++;}
 const splitAll=[...splitMap.values()].sort((a,b)=>b.total-a.total),splitLevels=splitAll.slice(0,4);
 // Keep all rows in the denominators, including missing and unshown levels.
 const strata=shown.map(g=>({...g,cells:splitLevels.map(s=>{const members=g.records.filter(r=>token(r.row[split])===s.id);return {...s,...E.describe(members.map(r=>r.row[metric])),total:members.length};})}));
 const ranked=groups.filter(g=>g.count).toSorted((a,b)=>b.mean-a.mean),top=ranked[0],bottom=ranked.at(-1);
 const comparable=splitLevels.filter(s=>!E.missing(s.key)).map(s=>{const cells=groups.map(g=>{const records=g.records.filter(r=>token(r.row[split])===s.id);return {id:g.id,...E.describe(records.map(r=>r.row[metric]))};}).filter(g=>g.count);return {key:s.key,cells,leader:cells.toSorted((a,b)=>b.mean-a.mean)[0]};}).filter(s=>s.cells.length>=2);
 return {config,fields,time,groups,shown,stats:E.describe(rows.map(r=>r[metric])),total:rows.length,paired,correlation:related?E.correlation(rows,related,metric):null,splitLevels,splitAll,strata,top,bottom,comparable,retainedLead:top?comparable.filter(s=>s.cells.some(c=>c.id===top.id&&c.mean===s.leader.mean)).length:0,shownRows:shown.reduce((n,g)=>n+g.total,0)};
}

export function studyExport(study) {
 const s=study,{dimension,metric,related,split}=s.config;
 const summary=s.groups.map(g=>({scope:'group',dimension,group:g.key,metric,split:'',stratum:null,rows:g.total,valid:g.count,missing:g.missing,mean:g.mean,median:g.median,q1:g.q1,q3:g.q3,min:g.min,max:g.max,related,pearson_r:g.correlation,pairs:g.pairs}));
 const stratified=split?s.groups.flatMap(g=>s.splitAll.map(level=>{const records=g.records.filter(r=>token(r.row[split])===level.id),stats=E.describe(records.map(r=>r.row[metric]));return {scope:'stratum',dimension,group:g.key,metric,split,stratum:level.key,rows:records.length,valid:stats.count,missing:records.length-stats.count,mean:stats.mean,median:stats.median,q1:stats.q1,q3:stats.q3,min:stats.min,max:stats.max,related,pearson_r:related?E.correlation(records.map(r=>r.row),related,metric):null,pairs:records.filter(r=>E.numeric(r.row[metric])&&E.numeric(r.row[related])).length};})):[];
 return [...summary,...stratified];
}
