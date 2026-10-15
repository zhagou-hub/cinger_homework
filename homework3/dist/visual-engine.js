import * as E from './engine.js';

// Visual selections replace conditions on their own fields; clicking the same selection toggles it off.
export function toggleVisualFilters(filters,selection){
 const entries=selection.filters||[selection],keys=new Set(entries.map(f=>f.key));
 const same=(a,b)=>a.key===b.key&&a.op===b.op&&JSON.stringify(a.value??null)===JSON.stringify(b.value??null)&&Boolean(a.inclusive)===Boolean(b.inclusive)&&(a.unit||'')===(b.unit||'');
 const repeated=entries.length>0&&filters.filter(f=>keys.has(f.key)).length===entries.length&&entries.every(f=>filters.some(g=>same(f,g)));
 return [...filters.filter(f=>!keys.has(f.key)),...(repeated?[]:entries)];
}

export function numericSelectionState(all,selected,key){
 const totalValid=all.reduce((n,r)=>n+(E.numeric(r[key])?1:0),0),valid=selected.reduce((n,r)=>n+(E.numeric(r[key])?1:0),0),missing=selected.reduce((n,r)=>n+(E.missing(r[key])?1:0),0);
 const reason=!all.length?'empty_dataset':!selected.length?'no_matches':!totalValid?'no_numeric_source':!valid?'no_numeric_selection':'ready';
 return {reason,total:all.length,matched:selected.length,totalValid,valid,missing};
}

export function selectRows(rows, filters) {
  return filters.reduce((list, f) => {
    if (f.op === 'range') return list.filter(r => E.numeric(r[f.key]) && r[f.key] >= f.value[0] && (f.inclusive ? r[f.key] <= f.value[1] : r[f.key] < f.value[1]));
    if (f.op === 'exact') return list.filter(r => E.missing(f.value) ? E.missing(r[f.key]) : r[f.key] === f.value);
    if (f.op === 'outlier') return list.filter(r => E.numeric(r[f.key]) && (r[f.key] < f.value[0] || r[f.key] > f.value[1]));
    if (f.op === 'period') return list.filter(r => period(r[f.key], f.unit) === f.value);
    return E.filterRows(list, f.key, f.op, f.value);
  }, rows);
}

// Shared boundaries and inclusive final bin make comparisons honest and selections exact.
export function binsFor(groups, key, count=10) {
  let min=Infinity,max=-Infinity;
  for(const rows of groups) for(const r of rows) if(E.numeric(r[key])) { min=Math.min(min,r[key]); max=Math.max(max,r[key]); }
  if(min===Infinity)return [];
  const size=min===max?1:count,width=min===max?1:(max-min)/size;
  return Array.from({length:size},(_,i)=>({start:min+i*width,end:min===max?max:min+(i+1)*width,inclusive:i===size-1}));
}
export function countBins(rows,key,bins) {
  const result=bins.map(b=>({...b,value:0}));
  for(const r of rows)if(E.numeric(r[key])){const i=result.findIndex(b=>r[key]>=b.start&&(b.inclusive?r[key]<=b.end:r[key]<b.end));if(i>=0)result[i].value++;}
  return result;
}
export function outliers(rows,key){const s=E.describe(rows.map(r=>r[key])),iqr=(s.q3??0)-(s.q1??0);return {...s,lower:s.q1===null?null:s.q1-1.5*iqr,upper:s.q3===null?null:s.q3+1.5*iqr};}
export function period(v,unit='month'){
  if(E.missing(v))return null;
  const d=new Date(String(v));if(!Number.isFinite(d.getTime()))return null;
  if(unit==='year')return d.toISOString().slice(0,4);
  if(unit==='month')return d.toISOString().slice(0,7);
  if(unit==='week'){d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);}
  return d.toISOString().slice(0,10);
}
export function timeGroups(rows,key,value,fn,unit){
  const groups=new Map();for(const r of rows){const k=period(r[key],unit);if(k===null)continue;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);}
  return [...groups].sort(([a],[b])=>a.localeCompare(b)).map(([key,rs])=>({key,value:E.aggregate(rs,value,fn),count:rs.length}));
}
export function join(left,right,leftKey,rightKey,how='left'){
  const lc=E.columns(left),rc=E.columns(right);if(!lc.includes(leftKey)||!rc.includes(rightKey))throw Error('VALUE');
  const used=new Set(lc),names=rc.filter(k=>k!==rightKey).map(k=>{let name=used.has(k)?k+'_right':k;while(used.has(name))name+='_right';used.add(name);return[k,name];});
  if(used.size>80)throw Error('LIMIT');
  const index=new Map();for(const r of right){if(E.missing(r[rightKey]))continue;const k=JSON.stringify(r[rightKey]);if(!index.has(k))index.set(k,[]);index.get(k).push(r);}
  const rows=[];let matched=0,unmatched=0;
  for(const l of left){const matches=E.missing(l[leftKey])?[]:index.get(JSON.stringify(l[leftKey]))||[];if(matches.length)matched++;else unmatched++;
    for(const r of matches.length?matches:how==='left'?[null]:[]){rows.push(Object.fromEntries([...lc.map(k=>[k,l[k]]),...names.map(([k,n])=>[n,r?.[k]??null])]));if(rows.length>20000)throw Error('LIMIT');}}
  return {rows,cols:[...used],matched,unmatched,extra:rows.length-(how==='left'?left.length:matched)};
}
