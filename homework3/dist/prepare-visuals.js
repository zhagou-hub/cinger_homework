import * as E from './engine.js';
import * as V from './visual-engine.js';
import {duplicateGroups} from './prepare-engine.js';

export function createPrepareVisuals({t,esc,label,val,fmt,short,extras}){
 const cut=(v,n=22)=>{let out='',width=0;for(const c of String(v??'')){width+=c.codePointAt(0)>255?2:1;if(width>n)return out+'…';out+=c;}return out;};
 const txt=(x,y,s,attrs='')=>`<text x="${x}" y="${y}" ${attrs}>${esc(s)}</text>`;
 const svg=(w,h,body,name)=>`<svg xmlns="http://www.w3.org/2000/svg" class="prepare-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(name)}"><rect width="${w}" height="${h}" fill="white"/>${body}</svg>`;
 const cell=v=>esc(E.numeric(v)?fmt(v,3):val(v));
 const note=s=>`<p class="prepare-viz-note">${s}</p>`;
 const table=(heads,body)=>`<div class="prepare-examples table-scroll"><table><thead><tr>${heads.map(h=>'<th>'+esc(h)+'</th>').join('')}</tr></thead><tbody>${body.map(row=>'<tr>'+row.map(v=>'<td>'+cell(v)+'</td>').join('')+'</tr>').join('')}</tbody></table></div>`;
 const legend=()=>`<div class="viz-legend"><span><i style="background:#ea7c2d"></i>${t('处理前','Before')}</span><span><i style="background:#5b4de0"></i>${t('处理后','After')}</span></div>`;
 function overlay(result,onlyAfter=false){
  const before=result.before.map(r=>({v:r[result.key]})),after=result.after.map(r=>({v:r[result.afterKey]})),bins=V.binsFor([before,after],'v'),W=680,H=220,L=45,R=18,T=20,B=35;
  if(!bins.length){
   const a=new Map(),b=new Map();for(const r of before){const k=JSON.stringify(r.v??null);a.set(k,(a.get(k)||0)+1);}for(const r of after){const k=JSON.stringify(r.v??null);b.set(k,(b.get(k)||0)+1);}
   const keys=[...new Set([...a.keys(),...b.keys()])].sort((x,y)=>Math.max(a.get(y)||0,b.get(y)||0)-Math.max(a.get(x)||0,b.get(x)||0)).slice(0,6),max=Math.max(1,...a.values(),...b.values());
   const body=keys.map((k,i)=>{const y=28+i*45,aa=a.get(k)||0,bb=b.get(k)||0;return txt(120,y+15,cut(val(JSON.parse(k)),16),'text-anchor="end"')+`<rect x="140" y="${y}" width="${aa/max*450}" height="10" rx="3" fill="#ea7c2d"/><rect x="140" y="${y+13}" width="${bb/max*450}" height="10" rx="3" fill="#5b4de0"/>`+txt(610,y+16,`${aa} → ${bb}`);}).join('');
   return svg(W,Math.max(105,keys.length*45+25),body,t('类别数量前后对比','Before and after category counts'))+legend();
  }
  const a=V.countBins(before,'v',bins),b=V.countBins(after,'v',bins),peak=Math.max(1,...a.map(x=>x.value),...b.map(x=>x.value)),step=(W-L-R)/bins.length,y=n=>H-B-n/peak*(H-T-B);
  let body=[0,.5,1].map(f=>`<line x1="${L}" x2="${W-R}" y1="${y(peak*f)}" y2="${y(peak*f)}" stroke="#e8eaf4"/>${txt(L-10,y(peak*f)+4,fmt(peak*f,1),'text-anchor="end"')}`).join('');
  body+=bins.map((bin,i)=>`<g><rect x="${L+i*step+3}" y="${y(a[i].value)}" width="${Math.max(1,step-6)}" height="${H-B-y(a[i].value)}" rx="3" fill="#ea7c2d55" stroke="#ea7c2d"/><rect x="${L+i*step+step*.2}" y="${y(b[i].value)}" width="${Math.max(1,step*.6)}" height="${H-B-y(b[i].value)}" rx="2" fill="#5b4de0" opacity=".85"/><title>${fmt(bin.start,2)}–${fmt(bin.end,2)}: ${a[i].value} → ${b[i].value}</title></g>`).join('');
  body+=txt(L,H-10,fmt(bins[0].start,2))+txt(W-R,H-10,fmt(bins.at(-1).end,2),'text-anchor="end"');
  return svg(W,H,body,onlyAfter?t('新字段数值分布','New field distribution'):t('数值分布前后对比','Before and after distribution'))+(onlyAfter?'':legend())+note(onlyAfter?t('图中统计新字段的全部有效数值。','The chart counts all valid values in the new field.'):t('前后使用相同坐标、分箱与频数刻度，仅绘制数值。','Before and after share bin boundaries and axis scales; numeric values only.'));
 }
 function missing(r){
  const examples=r.indices.slice(0,6).map(i=>[i+1,r.before[i][r.key],r.removedRows?t('删除该行','Row removed'):r.after[i][r.afterKey]]);
  return `<div class="prepare-quality">${extras.qualityChange(r.before,r.after,r.beforeCols,r.afterCols)}</div><h3>${t('字段分布','Field distribution')} · ${esc(label(r.key))}</h3>${overlay(r)}${examples.length?table([t('原行号','Source row'),t('原值','Before'),t('处理后','After')],examples):note(t('该字段没有缺失值，当前设置无需修改数据。','This field has no missing values; no change is needed.'))}`;
 }
 function duplicates(r){
  const n=r.before.length,keep=r.after.length,removed=n-keep,W=680,H=260,top=45,scale=n?140/n:0,kh=keep*scale,dh=removed*scale;
  let body=txt(35,22,t('原始记录','Source rows'))+txt(445,22,t('保留 / 移除','Retained / Removed'));
  if(n){body+=`<rect x="35" y="${top}" width="24" height="140" rx="4" fill="#dfe3f1"/><path d="M59 ${top} C240 ${top},260 ${top},440 ${top} L440 ${top+kh} C260 ${top+kh},240 ${top+kh},59 ${top+kh} Z" fill="#7966e844"/><rect x="440" y="${top}" width="24" height="${kh}" rx="3" fill="#5b4de0"/>`;if(removed)body+=`<path d="M59 ${top+kh} C240 ${top+kh},260 ${top+kh+30},440 ${top+kh+30} L440 ${top+kh+30+dh} C260 ${top+kh+30+dh},240 ${top+140},59 ${top+140} Z" fill="#ea7c2d66"/><rect x="440" y="${top+kh+30}" width="24" height="${dh}" fill="#ea7c2d"/>`;}
  body+=txt(70,top+20,`${fmt(n)} ${t('行','rows')}`)+txt(482,top+Math.max(16,kh/2),`${t('保留','Retained')} ${fmt(keep)}`)+txt(482,top+kh+Math.max(30,dh/2+30),`${t('移除重复','Duplicates removed')} ${fmt(removed)}`);
  const mask=new Set(r.indices),chunks=64,size=Math.max(1,Math.ceil(n/chunks)),strips=[];for(let start=0;start<n;start+=size){const end=Math.min(n,start+size),count=Array.from({length:end-start},(_,j)=>start+j).filter(i=>mask.has(i)).length;strips.push({start,end,count});}
  const stripe=strips.map((b,i)=>`<rect x="${35+i*610/strips.length}" y="17" width="${Math.max(1,610/strips.length-2)}" height="20" rx="2" fill="${b.count?'#ea7c2d':'#dfe3f1'}"><title>${b.start+1}–${b.end}: ${b.count} ${t('条重复','duplicates')}</title></rect>`).join('');
  const groups=duplicateGroups(r.before,r.beforeCols).groups.slice(0,5),examples=groups.map(g=>[g.first+1,g.indices.slice(1).map(i=>i+1).join(', '),g.indices.length-1]);
  return `<h3>${t('记录去向','Record disposition')}</h3>${svg(W,H,body,t('重复记录去重流向','Deduplication flow'))}<h3>${t('重复记录位置','Duplicate positions')}</h3>${svg(W,65,stripe+txt(35,59,'1')+txt(645,59,n,'text-anchor="end"'),t('重复记录位置图','Duplicate position strip'))}${`<div class="viz-legend"><span><i style="background:#5b4de0"></i>${t('保留','Retained')}</span><span><i style="background:#ea7c2d"></i>${t('重复并移除','Duplicates removed')}</span></div>`}${examples.length?table([t('保留行号','Retained row'),t('重复行号','Duplicate rows'),t('移除数量','Removed')],examples):note(t('未发现重复记录。所有记录均保留。','No duplicate records found. All rows are retained.'))}`;
 }
 function rename(r){
  const focus=r.beforeCols.indexOf(r.key),indices=r.beforeCols.length<=12?r.beforeCols.map((_,i)=>i):[...new Set([...Array.from({length:10},(_,i)=>i),focus])].sort((a,b)=>a-b),W=680,rowH=35,H=indices.length*rowH+65,L=30,R=380;
  let body=txt(L,20,t('原字段','Original field'))+txt(R,20,t('处理后字段','Resulting field'));
  indices.forEach((i,j)=>{const y=38+j*rowH,active=i===focus,before=r.beforeCols[i],after=r.afterCols[i];body+=`<rect x="${L}" y="${y}" width="245" height="26" rx="5" fill="${active?'#eeebff':'#f8fafb'}" stroke="${active?'#b4a3eb':'#e8eaf4'}"/><path d="M285 ${y+13}H365m-7-5 7 5-7 5" fill="none" stroke="${active?'#5b4de0':'#d9deed'}" stroke-width="${active?2:1}"/><rect x="${R}" y="${y}" width="260" height="26" rx="5" fill="${active?'#e7e0ff':'#f8fafb'}" stroke="${active?'#a493e8':'#e8eaf4'}"/>${txt(L+10,y+18,cut(before,31))}${txt(R+10,y+18,cut(after,32))}`;});
  const p=E.profile(r.before,r.beforeCols).find(c=>c.key===r.key),q=E.profile(r.after,r.afterCols).find(c=>c.key===r.afterKey),type=c=>c?.type==='number'?t('数值','Number'):c?.type==='date'?t('日期','Date'):t('文本','Text');
  return svg(W,H,body,t('字段名称前后映射','Column rename mapping'))+`<div class="prepare-type-summary"><span>${t('字段类型','Column type')} <b>${type(p)} → ${type(q)}</b></span><span>${t('数据值变化','Changed values')} <b>${fmt(r.changedCells)}</b></span></div>`+note(r.renamed?t('字段名称已在预览中替换，原始值保持对应。','The preview maps the renamed column to its original values.'):t('输入新名称可查看映射；也可以在左侧转换字段类型。','Enter a new name to preview its mapping, or convert the type at left.'))+(r.indices.length?table([t('原行号','Source row'),t('原值','Before'),t('处理后','After')],r.indices.slice(0,6).map(i=>[i+1,r.before[i][r.key],r.after[i][r.afterKey]])):'')+(r.beforeCols.length>12?note(t('仅展示前 10 个字段与当前选中字段；应用会保留全部字段。','Showing the first 10 fields and the selected field; all fields are retained.')):'');
 }
 function calculate(r){
  const d=r.draft,s=E.describe(r.after.map(row=>row[r.key])),formula=`<div class="formula-flow"><span>${esc(label(d.a))}</span><b>${esc(d.op==='/'?'÷':d.op==='*'?'×':d.op)}</b><span>${d.b==='__constant'?esc(d.constant):esc(label(d.b))}</span><b>=</b><strong>${esc(r.key)}</strong></div>`;
  const outputSeries={...r,before:[],key:r.key,afterKey:r.key};
  return formula+`<div class="prepare-type-summary"><span>${t('有效结果','Valid results')} <b>${fmt(s.count)} / ${fmt(r.after.length)}</b></span><span>${t('均值','Mean')} <b>${fmt(s.mean,3)}</b></span><span>${t('范围','Range')} <b>${fmt(s.min,3)} — ${fmt(s.max,3)}</b></span></div><h3>${t('新字段分布','New field distribution')}</h3>`+(s.count?overlay(outputSeries,true):note(t('当前运算没有产生有效数值；请检查缺失输入和除零情况。','This calculation produces no valid numbers. Check missing inputs and division by zero.')))+table([t('行号','Row'),label(d.a),d.b==='__constant'?t('常数','Constant'):label(d.b),r.key],r.after.slice(0,6).map((row,i)=>[i+1,row[d.a],d.b==='__constant'?Number(d.constant):row[d.b],row[r.key]]))+note(t('结果由当前数据逐行计算；缺失输入、除零和非有限结果显示为空值。','Each result is computed from the current row. Missing inputs, division by zero and non-finite results become null.'));
 }
 return {render:r=>({missing,duplicates,rename,calculate}[r.mode](r))};
}
