import * as E from './engine.js';

export function defaultPrepareDrafts(rows,cols=E.columns(rows)){
 const p=E.profile(rows,cols),nums=p.filter(c=>c.type==='number'),missing=p.find(c=>c.missing&&c.type==='number')||p.find(c=>c.missing)||p[0],first=nums[0]?.key||cols[0];
 let name='new_measure',i=2;while(cols.includes(name))name='new_measure_'+i++;
 return {missing:{column:missing?.key||cols[0],method:missing?.type==='number'?'mean':'drop',value:''},duplicates:{},rename:{column:cols[0],name:'',type:'keep'},calculate:{a:first,b:nums[1]?.key||'__constant',op:'/',constant:'100',name}};
}
export function reconcilePrepareDrafts(rows,cols,drafts){
 const defaults=defaultPrepareDrafts(rows,cols),d=structuredClone(drafts||defaults),p=E.profile(rows,cols),nums=p.filter(c=>c.type==='number').map(c=>c.key);
 for(const mode of Object.keys(defaults))d[mode]={...defaults[mode],...d[mode]};
 if(!cols.includes(d.missing.column))d.missing.column=defaults.missing.column;
 if(!nums.includes(d.missing.column)&&['mean','median'].includes(d.missing.method))d.missing.method='drop';
 if(!cols.includes(d.rename.column))d.rename.column=cols.includes(d.rename.name)?d.rename.name:cols[0];
 if(!nums.includes(d.calculate.a))d.calculate.a=defaults.calculate.a;
 if(d.calculate.b!=='__constant'&&!nums.includes(d.calculate.b))d.calculate.b=defaults.calculate.b;
 return d;
}
export function duplicateGroups(rows,cols){
 const groups=new Map(),kept=[],removed=[];
 rows.forEach((r,index)=>{const token=JSON.stringify(cols.map(k=>r[k]));if(groups.has(token)){const g=groups.get(token);g.indices.push(index);removed.push(index);}else{groups.set(token,{first:index,indices:[index]});kept.push(r);}});
 return {kept,removed,groups:[...groups.values()].filter(g=>g.indices.length>1)};
}
export function previewPrepare(rows,cols,mode,draft){
 let next,newCols=[...cols],key,afterKey,indices=[],changedCells=0,removedRows=0,renamed=false,code='';
 if(mode==='missing'){
  key=draft.column;if(!cols.includes(key))throw Error('VALUE');const m=draft.method;
  if(m==='custom'&&!String(draft.value).trim())throw Error('VALUE');
  if(!['mean','median','custom','drop'].includes(m))throw Error('VALUE');
  indices=rows.flatMap((r,i)=>E.missing(r[key])?[i]:[]);
  next=m==='drop'?rows.filter(r=>!E.missing(r[key])):E.fillMissing(rows,key,m,draft.value);
  removedRows=m==='drop'?indices.length:0;changedCells=m==='drop'?0:indices.length;
  code=m==='drop'?`df.dropna(subset=[${JSON.stringify(key)}])`:`df[${JSON.stringify(key)}].fillna(${m==='custom'?JSON.stringify(E.scalar(draft.value)):'df['+JSON.stringify(key)+'].'+m+'()'})`;
 }else if(mode==='duplicates'){
  const info=duplicateGroups(rows,cols);next=info.kept;indices=info.removed;removedRows=indices.length;key=cols[0];code='df.drop_duplicates(keep="first")';
 }else if(mode==='rename'){
  key=draft.column;if(!cols.includes(key))throw Error('VALUE');afterKey=String(draft.name||'').trim()||key;
  if(afterKey!==key&&cols.includes(afterKey))throw Error('COLUMN_NAME');if(!['keep','number','text'].includes(draft.type))throw Error('VALUE');
  renamed=afterKey!==key;newCols=cols.map(k=>k===key?afterKey:k);
  next=rows.map((r,i)=>Object.fromEntries(cols.map(k=>{let v=r[k];if(k===key&&!E.missing(v)){if(draft.type==='number')v=String(v).trim()!==''&&Number.isFinite(Number(v))?Number(v):null;if(draft.type==='text')v=String(v);}if(k===key&&!Object.is(v,r[k])){indices.push(i);changedCells++;}return [k===key?afterKey:k,v];})));
  code=(renamed?`df.rename(columns={${JSON.stringify(key)}: ${JSON.stringify(afterKey)}})`:'')+(draft.type==='keep'?'':(renamed?'\n':'')+(draft.type==='number'?`pd.to_numeric(df[${JSON.stringify(afterKey)}], errors="coerce")`:`df[${JSON.stringify(afterKey)}].astype("string")`));
 }else if(mode==='calculate'){
  if(cols.length>=80)throw Error('LIMIT');key=String(draft.name||'').trim();afterKey=key;
  if(!cols.includes(draft.a)||!['+','-','*','/'].includes(draft.op)||!(draft.b==='__constant'||cols.includes(draft.b)))throw Error('NUMERIC');
  const constant=draft.b==='__constant'?draft.constant:undefined;
  if(constant!==undefined&&(String(constant).trim()===''||!Number.isFinite(Number(constant))))throw Error('VALUE');
  if(E.profile(rows,cols).find(c=>c.key===draft.a)?.type!=='number')throw Error('NUMERIC');
  next=E.compute(rows,key,draft.a,draft.op,draft.b,constant);newCols=[...cols,key];indices=rows.map((_,i)=>i);changedCells=next.filter(r=>!E.missing(r[key])).length;
  code=`df[${JSON.stringify(key)}] = df[${JSON.stringify(draft.a)}] ${draft.op} ${constant===undefined?'df['+JSON.stringify(draft.b)+']':Number(constant)}`+(draft.op==='/'?'  # division by zero -> null':'');
 }else throw Error('VALUE');
 return {mode,before:rows,after:next,beforeCols:cols,afterCols:newCols,key,afterKey:afterKey||key,draft:structuredClone(draft),indices,changedCells,removedRows,renamed,addedColumns:newCols.length-cols.length,noChange:!renamed&&!changedCells&&!removedRows&&newCols.length===cols.length,code};
}
