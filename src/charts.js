export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const fmt = (n,d=2) => n==null?'无数据':Number(n).toFixed(d);
export const signed = (n,d=2) => `${n>0?'+':''}${fmt(n,d)}`;
export const levels = {
 'Not Exposed':{name:'未暴露',color:'#b5bfb0'},
 'Minimal Exposure':{name:'最低暴露',color:'#8eb398'},
 'Exposed: Gradient 1':{name:'梯度 1',color:'#64a692'},
 'Exposed: Gradient 2':{name:'梯度 2',color:'#317e77'},
 'Exposed: Gradient 3':{name:'梯度 3',color:'#587eae'},
 'Exposed: Gradient 4':{name:'梯度 4',color:'#c47847'}
};
export const methods = [
 ['f_AnoGAN','f-AnoGAN','f-AnoGAN'],['Feature_dictionary','特征字典','特征<br>字典'],['Student_teacher','学生–教师','学生<br>教师'],['L2_autoencoder','L2 自编码器','L2<br>自编码器'],['SSIM_autoencoder','SSIM 自编码器','SSIM<br>自编码器'],['Texture_inspection','纹理检测','纹理<br>检测'],['Variation_model','变化模型','变化<br>模型']
];
export const categories={Carpet:'地毯',Grid:'网格',Leather:'皮革',Tile:'瓷砖',Wood:'木材',Bottle:'瓶子',Cable:'电缆',Capsule:'胶囊',Hazelnut:'榛子',Metal_nut:'金属螺母',Pill:'药片',Screw:'螺钉',Toothbrush:'牙刷',Transistor:'晶体管',Zipper:'拉链'};
export const series=[{key:'Base',name:'基准',color:'#136e64'},{key:'Lift-Off',name:'更快增长',color:'#c57847'},{key:'High Efficiency',name:'更高效率',color:'#5b83ad'},{key:'Headwinds',name:'发展受阻',color:'#82956c'}];
export function heatColor(n){const a=[237,243,229],b=[19,110,100];return `rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*n)).join(',')})`;}
export function table(headers,rows){return `<table class="plain-table"><thead><tr>${headers.map(h=>`<th scope="col">${escapeHTML(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${escapeHTML(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}
const svg=(title,body,w,h,desc='')=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeHTML(title)}"><title>${escapeHTML(title)}</title><desc>${escapeHTML(desc)}</desc>${body}</svg>`;
const line=(x1,y1,x2,y2,attr='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attr}/>`;
const text=(x,y,s,attr='')=>`<text x="${x}" y="${y}" ${attr}>${escapeHTML(s)}</text>`;
export function scatterChart(occupations,selected,narrow=false){
 const w=narrow?430:660,h=narrow?335:385,m={l:45,r:20,t:33,b:52},x=v=>m.l+v/.8*(w-m.l-m.r),y=v=>h-m.b-v/.4*(h-m.t-m.b);
 let body=text(m.l,15,'任务分数标准差','class="svg-axis"');
 for(let i=0;i<=4;i++){let v=i*.1;body+=line(m.l,y(v),w-m.r,y(v),'class="svg-grid"')+text(m.l-11,y(v)+3,fmt(v,1),'text-anchor="end" class="svg-number"');}
 for(let i=0;i<=8;i++){let v=i*.1;body+=line(x(v),m.t,x(v),h-m.b,'class="svg-grid" opacity=".45"')+text(x(v),h-m.b+23,fmt(v,1),'text-anchor="middle" class="svg-number"');}
 body+=text(w-m.r,h-5,'职业平均暴露分 →','text-anchor="end" class="svg-axis"');
 const sorted=[...occupations].filter(o=>o.mean!=null&&o.sd!=null).sort((a,b)=>(a.code===selected?1:0)-(b.code===selected?1:0));
 body+=sorted.map(o=>`<g role="button" tabindex="0" class="scatter-hit ${o.code===selected?'selected':''}" data-occupation="${o.code}" aria-label="${escapeHTML(o.title_zh||o.title)}，${o.code}，均值 ${fmt(o.mean)}，标准差 ${fmt(o.sd)}"><title>${escapeHTML(o.title_zh||o.title)} / ${o.code} / ${levels[o.level].name}</title><circle cx="${x(o.mean)}" cy="${y(o.sd)}" r="9" fill="transparent"/><circle class="scatter-point" cx="${x(o.mean)}" cy="${y(o.sd)}" r="4" fill="${levels[o.level].color}" opacity=".76"/></g>`).join('');
 if(!sorted.length)body+=text(w/2,h/2,'没有匹配职业，请调整搜索或大类筛选。','text-anchor="middle" class="svg-axis"');
 return svg('职业平均暴露分与任务差异散点图',body,w,h,'每点一种职业，点大小统一。等级保留 ILO 2025 原分类。');
}
export function agricultureChart(rows,metric,stage,narrow=false){
 const w=narrow?440:620,h=300,m={l:narrow?68:90,r:40,t:38,b:49},max=metric==='wdi'?.5:1,x=v=>m.l+v/max*(w-m.l-m.r),stages=['V8-V11','VT-R4'];
 let body='';
 for(let i=0;i<=5;i++){const v=i*max/5;body+=line(x(v),m.t,x(v),h-m.b,'class="svg-grid"')+text(x(v),h-m.b+24,fmt(v,1),'class="svg-number" text-anchor="middle"');}
 stages.forEach((s,i)=>{
  const pair=rows.filter(r=>r.growth_stage===s),cy=95+i*103,a=pair.find(r=>r.field==='A'),b=pair.find(r=>r.field==='B'),opacity=stage===s?1:.3;
  body+=`<g opacity="${opacity}">`+text(m.l-12,cy+4,s,'text-anchor="end" class="svg-axis"')+line(x(a[metric]),cy,x(b[metric]),cy,'stroke="#b7c9b2" stroke-width="2"');
  for(const row of [a,b]){const py=cy+(row.field==='A'?-14:14),color=row.field==='A'?'#136e64':'#a78862';
   if(metric==='wdi'){const lo=row.wdi-row.wdi_sd,hi=row.wdi+row.wdi_sd;body+=line(x(lo),py,x(hi),py,`stroke="${color}" stroke-width="1.2"`)+line(x(lo),py-5,x(lo),py+5,`stroke="${color}"`)+line(x(hi),py-5,x(hi),py+5,`stroke="${color}"`);}
   body+=`<circle cx="${x(row[metric])}" cy="${py}" r="5.5" fill="${color}"/><title>${row.field}: ${fmt(row[metric])}</title>`+text(x(row[metric])+9,py-7,`${row.field} ${fmt(row[metric])}`,`fill="${color}" font-size="11" font-family="monospace"`);
  }body+='</g>';
 });
 body+=text(w-m.r,h-2,metric==='wdi'?'WDI（越低，水分胁迫越小）':'NDVI（植被指数，无量纲）','text-anchor="end" class="svg-axis"');
 return svg(`${rows[0].year} 年农业${metric.toUpperCase()}配对图`,body,w,h,metric==='wdi'?'误差线为 WDI 标准差，不是置信区间。':'未提供 NDVI 标准差，未绘制误差线。');
}
export function effectInterval(effect,se,unit){
 const lo=effect-1.96*se,hi=effect+1.96*se,abs=Math.max(Math.abs(lo),Math.abs(hi))||1,limit=abs*1.25;
 const w=610,h=175,m={l:55,r:30},x=v=>m.l+(v+limit)/(limit*2)*(w-m.l-m.r),cy=80;
 let body=line(m.l,cy,w-m.r,cy,'stroke="#cfdccd"')+line(x(0),27,x(0),126,'stroke="#8b9d8c" stroke-dasharray="3 4"');
 body+=line(x(lo),cy,x(hi),cy,'stroke="#136e64" stroke-width="4"')+line(x(lo),cy-8,x(lo),cy+8,'stroke="#136e64" stroke-width="2"')+line(x(hi),cy-8,x(hi),cy+8,'stroke="#136e64" stroke-width="2"')+`<circle cx="${x(effect)}" cy="${cy}" r="7" fill="#136e64"/>`;
 for(const v of [-limit,0,limit])body+=text(x(v),cy+37,fmt(v,2),'class="svg-number" text-anchor="middle"');
 body+=text(x(effect),38,signed(effect,3),'fill="#136e64" text-anchor="middle" font-size="16"')+text(w-m.r,h-7,`${unit} / 效果估计与近似 95% 区间`,'class="svg-axis" text-anchor="end"');
 return {html:svg('客服回归效果估计与正态近似95%区间',body,w,h,'竖虚线表示零效应。区间根据论文系数与标准误计算。'),lo,hi};
}
export function energyChart(data,year,enabled,narrow=false){
 const w=narrow?460:760,h=narrow?320:360,m={l:42,r:23,t:35,b:45},x=v=>m.l+(v-2020)/15*(w-m.l-m.r),y=v=>h-m.b-v/1800*(h-m.t-m.b);
 let body=`<rect x="${x(2024)}" y="${m.t}" width="${w-m.r-x(2024)}" height="${h-m.t-m.b}" fill="#edf3e8"/>`;
 body+=text(m.l,15,'TWh','class="svg-axis"')+text(x(2021.5),m.t+15,'历史估计','font-size="9" fill="#738477" text-anchor="middle"')+text(x(2029),m.t+15,'2025 年研究情景','font-size="9" fill="#738477" text-anchor="middle"');
 for(let v=0;v<=1800;v+=300)body+=line(m.l,y(v),w-m.r,y(v),'class="svg-grid"')+text(m.l-10,y(v)+3,v,'class="svg-number" text-anchor="end"');
 for(const v of (narrow?[2020,2025,2030,2035]:[2020,2024,2025,2030,2035]))body+=text(x(v),h-m.b+25,v,'class="svg-number" text-anchor="middle"');
 const path=key=>data.filter(r=>r[key]!=null).map((r,i)=>`${i?'L':'M'}${x(r.year)},${y(r[key])}`).join(' ');
 body+=`<path d="${path('Historical')}" stroke="#687c69" stroke-width="2.5" fill="none"/>`;
 for(const s of series)if(enabled.has(s.key))body+=`<path data-series="${escapeHTML(s.key)}" d="${path(s.key)}" stroke="${s.color}" stroke-width="2.5" stroke-dasharray="5 4" fill="none"/>`;
 body+=line(x(year),m.t,x(year),h-m.b,'stroke="#94aa98" stroke-dasharray="3 4"');
 const row=data.find(r=>r.year===year);
 const active=year<=2024?[{key:'Historical',color:'#687c69'}]:series.filter(s=>enabled.has(s.key));
 for(const s of active)if(row[s.key]!=null)body+=`<circle cx="${x(year)}" cy="${y(row[s.key])}" r="4.5" fill="${s.color}" stroke="#fff" stroke-width="2"/>`;
 body+=text(Math.min(w-38,Math.max(45,x(year))),h-4,year,'text-anchor="middle" fill="#136e64" font-size="11" font-family="monospace"');
 return svg(`全球数据中心电力需求，选中 ${year} 年`,body,w,h,'固定0至1800 TWh刻度。实线为历史估计；虚线为四个互斥情景，不堆叠。');
}
