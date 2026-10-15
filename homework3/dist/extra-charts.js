import * as E from './engine.js';
import * as V from './visual-engine.js';
import * as S from './chart-stats.js';

export function createVisuals({t,esc,label,val,fmt,short,color,getRows}){
 const shortLabel=(value,limit=22)=>{let width=0,out='';for(const c of String(value??'')){width+=c.codePointAt(0)>255?2:1;if(width>limit)return out+'…';out+=c;}return out;};
 const categoryValue=c=>c&&typeof c==='object'&&Object.hasOwn(c,'key')?c.key:c;
 const svg=(w,h,body,title)=>`<svg xmlns="http://www.w3.org/2000/svg" class="analytic-svg" viewBox="0 0 ${w} ${h}" role="group" aria-label="${esc(title)}"><rect width="${w}" height="${h}" fill="white"/>${body}</svg>`;
 const text=(x,y,s,attrs='')=>`<text x="${x}" y="${y}" ${attrs}>${esc(s)}</text>`;
 const note=s=>`<p class="viz-note">${s}</p>`;
 const empty=s=>`<div class="viz-empty">${s}</div>`;
 const dotLegend=(cats,offset=0)=>cats.map((c,i)=>`<span><i style="background:${color[(i+offset)%color.length]}"></i>${esc(val(categoryValue(c)))}</span>`).join('');
 const legend=cats=>`<div class="viz-legend">${dotLegend(cats)}</div>`;
 const inlineLegend=(cats,y,w)=>cats.map((c,i)=>`<circle cx="${24+i%4*(w/4)}" cy="${y+Math.floor(i/4)*20}" r="4" fill="${color[i%color.length]}"/>${text(34+i%4*(w/4),y+4+Math.floor(i/4)*20,shortLabel(val(categoryValue(c))))}`).join('');
 const hue=(r,key,cats)=>color[Math.max(0,cats.findIndex(c=>E.missing(c.key)?E.missing(r[key]):c.key===r[key]))%color.length];

 function qualityMap(data,cols){
  const {buckets}=S.missingTiles(data,cols),W=900,L=175,R=55,T=28,rowH=25,H=T+cols.length*rowH+42;
  if(!data.length)return empty(t('当前没有记录。','No records.'));
  const width=(W-L-R)/buckets.length;
  let body=text(L,15,t('工作表行序','Worksheet row order'))+text(W-R,15,`${data.length} ${t('行','rows')}`,'text-anchor="end"');
  cols.forEach((key,j)=>{const y=T+j*rowH,total=data.filter(r=>E.missing(r[key])).length;body+=`<g  aria-label="${esc(label(key))}: ${total} ${t('缺失','missing')}">${text(L-12,y+14,shortLabel(label(key)),'text-anchor="end"')}<title>${esc(label(key))}: ${total} ${t('个缺失','missing')}</title></g>${text(W-R+10,y+14,total)}`;
   buckets.forEach((b,i)=>{const count=b.values[j],rate=count/(b.end-b.start);body+=`<rect  aria-hidden="${!count}" aria-label="${esc(label(key))} ${b.start+1}–${b.end}: ${count} ${t('缺失','missing')}" x="${L+i*width}" y="${y}" width="${Math.max(.8,width-1.5)}" height="18" rx="2" fill="${count?'#e78a32':'#e7eaf5'}" opacity="${count?.45+.55*rate:1}"><title>${esc(label(key))} · ${t('行','Rows')} ${b.start+1}–${b.end}: ${count}/${b.end-b.start} ${t('缺失','missing')}</title></rect>`;});
  });
  body+=text(L,H-12,'1')+text(W-R,H-12,data.length,'text-anchor="end"');
  return svg(W,H,body,t('缺失值分布热力图','Missing-value map'))+`<div class="viz-legend"><span><i style="background:#e7eaf5"></i>${t('完整','Complete')}</span><span><i style="background:#e78a32"></i>${t('含缺失，颜色深浅表示比例','Missing; shade indicates rate')}</span></div>`+note(t('按工作表行序分段汇总，覆盖全部记录；右侧为各字段缺失总数。橙色深浅表示缺失比例。','Rows are bucketed in worksheet order; every record is included. Totals appear at right. Orange intensity shows the missing rate.'));
 }

 function qualityChange(before,after,beforeCols,afterCols){
  const all=S.missingComparison(before,after,beforeCols,afterCols),changed=all.filter(d=>(d.before??0)||d.after),list=(changed.length?changed:all).slice(0,10),W=780,L=170,R=65,T=30,step=34,H=T+step*list.length+32,max=Math.max(1,...list.flatMap(d=>[d.before??0,d.after])),x=v=>L+v/max*(W-L-R);
  let body=[0,.5,1].map(f=>`<line x1="${x(max*f)}" x2="${x(max*f)}" y1="20" y2="${H-28}" stroke="#e8eaf4"/>${text(x(max*f),H-8,fmt(max*f,1),'text-anchor="middle"')}`).join('');
  list.forEach((d,i)=>{const y=T+i*step;body+=text(L-12,y+4,shortLabel(label(d.key)),'text-anchor="end"')+(d.before!==null?`<line x1="${x(d.before)}" x2="${x(d.after)}" y1="${y}" y2="${y}" stroke="#bbb4e6" stroke-width="4"/><circle cx="${x(d.before)}" cy="${y}" r="6" fill="white" stroke="#ea7c2d" stroke-width="2"/>`:'')+`<circle cx="${x(d.after)}" cy="${y}" r="3.7" fill="#4f46e5"/>`+text(W-R+12,y+4,`${d.before===null?'—':d.before} → ${d.after}`);});
  return `<div class="change-counts"><span>${t('记录数','Rows')} <b>${fmt(before.length)} → ${fmt(after.length)}</b></span><span>${t('缺失单元格','Missing cells')} <b>${fmt(E.profile(before,beforeCols).reduce((s,c)=>s+c.missing,0))} → ${fmt(E.profile(after,afterCols).reduce((s,c)=>s+c.missing,0))}</b></span></div>`+svg(W,H,body,t('字段缺失数量变化','Changes in missing counts'))+`<div class="viz-legend"><span><i class="ring" style="border-color:#ea7c2d"></i>${t('处理前','Before')}</span><span><i style="background:#4f46e5"></i>${t('处理后','After')}</span></div>`+note(t('横轴为缺失数量；新增字段的处理前状态显示为 —。最多展示缺失较多的 10 列。','The axis shows missing counts. New fields have no before value (—). Up to 10 fields with the most missing values are shown.'));
 }

 function groupBoxes(data,groupKey,valueKey){
  const groups=S.groupedBoxes(data,groupKey,valueKey).filter(g=>g.count),values=groups.flatMap(g=>[g.min,g.max]);if(!groups.length)return empty(t('当前字段没有有效数值。请选择其他数值字段。','This field has no valid numbers. Choose another numeric field.'));
  const min=Math.min(...values),max=Math.max(...values),W=760,H=365,L=62,R=25,T=30,B=70,y=v=>H-B-(v-min)/(max-min||1)*(H-T-B),step=(W-L-R)/groups.length,index=new Map(getRows().map((r,i)=>[r,i]));
  let body=[0,.25,.5,.75,1].map(f=>{const v=min+(max-min)*f;return `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="#e8eaf4"/>${text(L-10,y(v)+4,short(v),'text-anchor="end"')}`;}).join('');
  groups.forEach((g,i)=>{const x=L+step*(i+.5),width=Math.min(58,step*.46),c=color[i%color.length];body+=`<g  aria-label="${esc(val(g.key))}: ${t('中位数','median')} ${fmt(g.median,2)}, n=${g.count}"><line x1="${x}" x2="${x}" y1="${y(g.low)}" y2="${y(g.high)}" stroke="${c}" stroke-width="2"/><path d="M${x-width*.3} ${y(g.low)}h${width*.6}M${x-width*.3} ${y(g.high)}h${width*.6}" stroke="${c}" stroke-width="2"/><rect x="${x-width/2}" y="${y(g.q3)}" width="${width}" height="${Math.max(2,y(g.q1)-y(g.q3))}" fill="${c}28" stroke="${c}" stroke-width="1.7"/><path d="M${x-width/2} ${y(g.median)}h${width}" stroke="${c}" stroke-width="3"/><title>${esc(val(g.key))} · n=${g.count}/${g.sourceCount} · Q1=${fmt(g.q1,2)} · ${t('中位数','Median')}=${fmt(g.median,2)} · Q3=${fmt(g.q3,2)}</title>${text(x,H-42,shortLabel(val(g.key),Math.max(6,Math.floor(step/7))),'text-anchor="middle"')}${text(x,H-23,'n='+g.count,'text-anchor="middle"')}</g>`;
   S.evenlySample(g.rows.filter(r=>E.numeric(r[valueKey])),80).forEach((r,j)=>{const jitter=(Math.sin((j+1)*127.1+i*53.3)*.5)*width*1.4;body+=`<circle data-act="inspectRow" data-row="${index.get(r)}" role="button" tabindex="0" aria-label="${esc(val(g.key))}: ${fmt(r[valueKey],2)}" cx="${x+jitter}" cy="${y(r[valueKey])}" r="2.7" fill="${c}" opacity=".5"><title>${esc(val(g.key))}: ${fmt(r[valueKey],2)}</title></circle>`;});
  });
  body+=text(L,15,shortLabel(label(valueKey)));
  return svg(W,H,body,t('分组箱线与观测点','Grouped box and strip plot'))+note(t('箱体为 Q1—Q3，粗线为中位数，须线为 1.5 × IQR 范围内的观测极值。每组最多显示 80 个原始点，统计使用全部有效值；最多 8 组。点击观测点查看记录详情。','Boxes show Q1–Q3, with a median line and whiskers to observed values within 1.5 × IQR. Up to 80 raw points per group, 8 groups; statistics use all valid values. Click a point to inspect its details.'));
 }

 function composition(data,xKey,colorKey,heat=false){
  if(!xKey||!colorKey||xKey===colorKey)return empty(t('请选择两个不同的类别字段。','Choose two different category fields.'));
  const a=S.contingency(data,xKey,colorKey),W=780,L=160,R=60,T=40,rowH=38,H=T+a.x.length*rowH+70+Math.ceil(a.colors.length/4)*20;
  if(!a.x.length)return empty(t('没有匹配记录。','No matching records.'));
  const peak=Math.max(1,...a.cells.flatMap(g=>g.values)),plotW=W-L-R,cellW=plotW/Math.max(1,a.colors.length);
  let body='';
  a.cells.forEach((g,i)=>{const y=T+i*rowH,total=g.values.reduce((s,v)=>s+v,0);body+=text(L-14,y+19,shortLabel(val(g.key)),'text-anchor="end"');let offset=0;
   g.values.forEach((n,j)=>{const x=heat?L+j*cellW:L+(total?offset/total:0)*plotW,width=heat?cellW-4:total?n/total*plotW:0;offset+=n;body+=`<g  aria-label="${esc(val(g.key)+' / '+val(a.colors[j].key))}: ${n}"><rect x="${x}" y="${y}" width="${Math.max(0,width)}" height="28" rx="${heat?4:0}" fill="${heat?'#4f46e5':color[j%color.length]}" opacity="${heat?.07+.93*n/peak:1}"/><title>${esc(val(g.key)+' / '+val(a.colors[j].key))}: ${n}${total?' ('+fmt(n/total*100,1)+'%)':''}</title>${heat?text(x+width/2,y+19,n,`text-anchor="middle" fill="${n/peak>.55?'white':'#3e3974'}"`):width>47?text(x+width/2,y+19,fmt(n/total*100,0)+'%','text-anchor="middle" fill="white"'):''}</g>`;});
   body+=text(W-R+10,y+19,total);
  });
  if(heat)a.colors.forEach((c,i)=>{body+=text(L+(i+.5)*cellW,23,shortLabel(val(c.key),Math.max(6,Math.floor(cellW/7))),'text-anchor="middle"');});
  else body+=text(L,T+a.x.length*rowH+13,'0%')+text(W-R,T+a.x.length*rowH+13,'100%','text-anchor="end"');
  if(heat){const yy=T+a.x.length*rowH+35;body+='<defs><linearGradient id="countScale"><stop stop-color="#ece9fc"/><stop offset="1" stop-color="#4f46e5"/></linearGradient></defs><rect x="'+L+'" y="'+yy+'" width="180" height="9" rx="4" fill="url(#countScale)"/>'+text(L,yy+26,'0')+text(L+180,yy+26,peak,'text-anchor="end"')+text(L+200,yy+9,t('记录数','Records'));}else body+=inlineLegend(a.colors,T+a.x.length*rowH+40,W);
  return svg(W,H,body,heat?t('类别交叉频数热力图','Category count heatmap'):t('百分比堆叠图','100% stacked composition'))+note(t('当前展示','Shown')+' '+fmt(a.shown)+' / '+fmt(a.total)+' '+(heat?t('条记录；每个维度最多 8 类，颜色表示频数。','rows; up to 8 categories per dimension. Color encodes counts.'):t('条记录；每个维度最多 8 类，占比按展示类别计算。','rows; up to 8 categories per dimension. Percentages use displayed categories.')));
 }

 function parallel(full,selected,keys,colorKey){
  if(keys.length<2)return empty(t('平行坐标需要至少两个数值字段。','Parallel coordinates need at least two numeric fields.'));
  const W=800,H=370,L=55,R=50,T=44,B=65,step=(W-L-R)/(keys.length-1),stats=keys.map(k=>E.describe(full.map(r=>r[k]))),complete=full.filter(r=>keys.every(k=>E.numeric(r[k]))),selection=new Set(selected),cats=colorKey?S.categories(full,colorKey):[{key:null}],index=new Map(full.map((r,i)=>[r,i])),sample=S.evenlySample(complete,300),y=(v,j)=>stats[j].min===stats[j].max?(T+H-B)/2:H-B-(v-stats[j].min)/(stats[j].max-stats[j].min)*(H-T-B);
  if(!complete.length)return empty(t('这些字段没有完整的成对记录。','No complete rows across these fields.'));
  let body=sample.sort((a,b)=>Number(selection.has(a))-Number(selection.has(b))).map(r=>`<path data-act="inspectRow" data-row="${index.get(r)}" role="button" tabindex="0" aria-label="${t('查看记录','Inspect record')} ${index.get(r)+1}" d="${keys.map((k,j)=>(j?'L':'M')+(L+j*step)+','+y(r[k],j)).join(' ')}" fill="none" stroke="${selection.has(r)?hue(r,colorKey,cats):'#dce1ef'}" stroke-width="${selection.has(r)?1.7:1}" opacity="${selection.has(r)?.35:.2}"><title>${keys.map(k=>esc(label(k))+': '+fmt(r[k],2)).join(' · ')}</title></path>`).join('');
  keys.forEach((k,j)=>{const x=L+j*step;body+=`<line x1="${x}" x2="${x}" y1="${T}" y2="${H-B}" stroke="#b4b0cf"/>${text(x,19,shortLabel(label(k)),j===0?'text-anchor="start"':j===keys.length-1?'text-anchor="end"':'text-anchor="middle"')}${text(x,T-8,short(stats[j].max),'text-anchor="middle"')}${text(x,H-B+20,short(stats[j].min),'text-anchor="middle"')}`;});
  body+=colorKey?inlineLegend(cats,H-25,W):'';
  return svg(W,H+(colorKey?Math.ceil(cats.length/4)*20:0),body,t('平行坐标','Parallel coordinates'))+note(t('每条线是一条记录，各轴按完整数据的最小值—最大值独立缩放。','Each line is one record. Axes use separate full-data min–max scales.')+' '+t('绘制','Drawing')+' '+sample.length+' / '+complete.length+' '+t('条完整记录；最多 5 个数值字段、300 条线。点击线查看记录。','complete rows; up to 5 numeric fields and 300 lines. Click a line to inspect.'));
 }

 function scatterMatrix(data,keys,colorKey){
  keys=keys.slice(0,4);if(keys.length<2)return empty(t('散点矩阵需要至少两个数值字段。','A scatterplot matrix needs at least two numeric fields.'));
  const size=170,L=105,T=35,W=L+keys.length*size+20,H=T+keys.length*size+55,cats=colorKey?S.categories(getRows(),colorKey):[{key:null}],stats=keys.map(k=>E.describe(getRows().map(r=>r[k]))),scale=(v,j)=>stats[j].max===stats[j].min?.5:(v-stats[j].min)/(stats[j].max-stats[j].min),sample=S.evenlySample(data,200);
  let body='';
  keys.forEach((ky,i)=>{body+=text(L-10,T+i*size+size/2,shortLabel(label(ky),13),'text-anchor="end"');keys.forEach((kx,j)=>{const x=L+j*size,y=T+i*size;if(i===0)body+=text(x+size/2,20,shortLabel(label(kx),18),'text-anchor="middle"');body+=`<g data-act="correlationPair" data-x="${esc(kx)}" data-y="${esc(ky)}" role="button" tabindex="0" aria-label="${esc(label(kx)+' / '+label(ky))}"><rect x="${x+2}" y="${y+2}" width="${size-6}" height="${size-6}" fill="${i===j?'#f0eefb':'#fcfcff'}" stroke="#e6e5f5"/>`;
    if(i===j){const bins=V.binsFor([getRows()],kx,10),counts=V.countBins(data,kx,bins),max=Math.max(1,...counts.map(b=>b.value));body+=counts.map((b,n)=>`<rect x="${x+12+n*(size-25)/10}" y="${y+size-18-b.value/max*(size-50)}" width="${(size-25)/10-2}" height="${b.value/max*(size-50)}" rx="2" fill="#7060dd"/>`).join('');}
    else{body+=sample.filter(r=>E.numeric(r[kx])&&E.numeric(r[ky])).map(r=>`<circle cx="${x+12+scale(r[kx],j)*(size-30)}" cy="${y+size-18-scale(r[ky],i)*(size-30)}" r="2.4" fill="${hue(r,colorKey,cats)}" opacity=".55"/>`).join('');const r=E.correlation(data,kx,ky);body+=text(x+12,y+22,'r = '+fmt(r,2));}
    body+='</g>';});});
  body+=colorKey?inlineLegend(cats,H-23,W):'';
  return svg(W,H+Math.ceil(Math.min(8,cats.length)/4)*20,body,t('散点矩阵','Scatterplot matrix'))+note(t('对角线为频数分布，其余单元格为字段对的散点。最多 4 个数值字段、每格 200 条抽样记录；相关系数使用全部有效配对。点击单元格打开该字段对。','Diagonals show histograms; other cells show field pairs. Up to 4 numeric fields and 200 sampled rows per cell; correlations use all valid pairs. Click a cell to open that pair.'));
 }
 return {qualityMap,qualityChange,groupBoxes,stacked:(d,x,c)=>composition(d,x,c,false),categoryHeatmap:(d,x,c)=>composition(d,x,c,true),parallel,scatterMatrix};
}
