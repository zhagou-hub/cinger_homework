import {profile,columns} from './engine.js';

// Each dataset owns its complete analysis state. Never key by filename: imports may share names.
export class DatasetWorkspace {
  #entries = new Map();
  #next = 0;
  add(state) { const id=String(++this.#next); this.save(id,state); return id; }
  save(id,state) { this.#entries.set(id,structuredClone(state)); }
  get(id) { const state=this.#entries.get(id); if(!state)throw Error('DATASET'); return structuredClone(state); }
  list() { return [...this.#entries].map(([id,s])=>({id,name:s.dataset,rows:s.rows.length,isSample:s.isSample})); }
}

// Determine useful starting fields from the schema, for any imported dataset.
export function initialConfig(rows) {
  const p=profile(rows),cols=columns(rows);
  const allNums=p.filter(c=>c.type==='number');
  const measures=allNums.filter(c=>!/(^id$|_id$|^year$|编号|年份)/i.test(c.key));
  const nums=measures.length?measures:allNums;
  const categories=p.filter(c=>c.type==='text').sort((a,b)=>a.unique-b.unique);
  const category=categories.find(c=>c.unique>1&&c.unique<=30)||categories[0];
  const date=p.find(c=>c.type==='date');
  const x=date&&nums.length?date.key:nums.length>=2?nums[0].key:category?.key||cols[0];
  const y=nums.length>=2&&!date?nums[1].key:nums[0]?.key||category?.key||cols[0];
  return {chartType:date&&nums.length?'line':nums.length>=2?'scatter':nums.length?'bar':'bar',chartX:x,chartY:y,chartAgg:nums.length?'mean':'count',chartColor:category?.key||'',profileKey:nums[0]?.key||category?.key||cols[0],groupSpec:{r:category?.key||date?.key||cols[0],c:'',v:nums[0]?.key||cols[0],fn:nums.length?'mean':'count'},timeKey:date?.key||'',timeMetric:nums[0]?.key||'',timeUnit:'month'};
}
