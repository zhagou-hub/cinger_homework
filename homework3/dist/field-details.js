import {missing,numeric,describe} from './engine.js';

// Keep original row positions when the inspected field or its ordering changes.
export function fieldDetails(rows,key,{order='original',page=0,pageSize=8}={}){
 const records=rows.map((row,index)=>({row,index,value:row[key]}));
 if(order!=='original')records.sort((a,b)=>{
  const am=missing(a.value),bm=missing(b.value);
  if(am||bm)return am===bm?a.index-b.index:order==='missingFirst'?(am?-1:1):(am?1:-1);
  if(order==='missingFirst')return a.index-b.index;
  const cmp=numeric(a.value)&&numeric(b.value)?a.value-b.value:String(a.value).localeCompare(String(b.value),undefined,{numeric:true});
  return (order==='desc'?-cmp:cmp)||a.index-b.index;
 });
 const lastPage=Math.max(0,Math.ceil(records.length/pageSize)-1),currentPage=Math.max(0,Math.min(lastPage,page));
 return {key,total:records.length,missing:records.filter(r=>missing(r.value)).length,stats:describe(records.map(r=>r.value)),page:currentPage,lastPage,records:records.slice(currentPage*pageSize,(currentPage+1)*pageSize)};
}
