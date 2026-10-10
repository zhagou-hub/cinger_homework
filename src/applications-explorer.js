import {initSectionNavigation} from './section-navigation.js';
import {escapeHTML as esc} from './charts.js';
import {applicationImpacts} from './data/application-impacts.js';
const green='#0b786f',blue='#7b91b1',amber='#b6653e';
const number=value=>Number(value).toLocaleString('zh-CN',{maximumFractionDigits:1});
const signed=value=>`${value>0?'+':''}${number(value)}`;
const text=(x,y,value,attrs='')=>`<text x="${x}" y="${y}" ${attrs}>${esc(value)}</text>`;
const line=(x1,y1,x2,y2,attrs='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attrs}/>`;
const svg=(title,body,w=980,h=500)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${body}</svg>`;
const target=(detail,body)=>`<g class="result-mark" tabindex="0" data-chart-detail="${esc(detail)}" aria-label="${esc(detail)}"><title>${esc(detail)}</title>${body}</g>`;
const dot=(x,y,color,r=7)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const heading=data=>text(26,31,data.title,'class="result-title"')+text(26,60,data.subtitle,'class="result-tick"');

export function manufacturingChart(data=applicationImpacts.manufacturing){
 const left=224,right=829,x=v=>left+v/80*(right-left);
 let body=heading(data);
 for(let v=0;v<=80;v+=20)body+=line(x(v),94,x(v),347,'class="result-grid"')+text(x(v),374,`${v}%`,'class="result-tick" text-anchor="middle"');
 data.metrics.forEach((m,i)=>{const y=124+i*86,width=x(-m.changePct)-left,color=[green,blue,amber][i];
  body+=text(26,y+17,m.label,'class="result-label"')+target(`${m.label} ${signed(m.changePct)}%。${m.detail}`,`<rect x="${left}" y="${y-7}" width="${width}" height="46" rx="5" fill="${color}"/>`+text(x(-m.changePct)+14,y+22,`${signed(m.changePct)}%`,`class="impact-number" fill="${color}"`));
 });
 body+=text(right,405,'相对减少幅度','class="result-tick" text-anchor="end"')+text(26,463,data.conclusion,'class="result-conclusion"');
 return svg('工业质检：AI带来的质量、成本和产品开发改善',body);
}

export function agricultureChart(data=applicationImpacts.agriculture){
 const left=262,right=802,min=-15,max=25,x=v=>left+(v-min)/(max-min)*(right-left),zero=x(0);
 let body=heading(data);
 for(let v=-10;v<=20;v+=10)body+=line(x(v),101,x(v),383,v===0?'stroke="#9aafb8" stroke-width="1.5"':'class="result-grid"')+text(x(v),414,`${signed(v)}%`,'class="result-tick" text-anchor="middle"');
 body+=text(zero,93,'无变化','class="result-tick" text-anchor="middle"');
 data.metrics.forEach((m,i)=>{const y=137+i*66,endpoint=x(m.changePct),color=m.changePct>0?green:blue;
  body+=text(26,y+6,m.label,'class="result-label"')+target(`${m.label} ${signed(m.changePct)}%。${m.detail}`,`<rect x="${Math.min(zero,endpoint)}" y="${y-17}" width="${Math.abs(endpoint-zero)}" height="34" rx="4" fill="${color}"/>`+text(m.changePct>0?endpoint+12:endpoint-12,y+7,`${signed(m.changePct)}%`,`class="impact-number" fill="${color}" text-anchor="${m.changePct>0?'start':'end'}"`));
 });
 body+=text(26,466,data.conclusion,'class="result-conclusion"');
 return svg('农业监测：AI与数字农业项目带来的产量、售价和农资使用变化',body);
}

export function serviceChart(data=applicationImpacts.service){
 const left=200,right=846,top=103,bottom=337,y=v=>bottom-v/35*(bottom-top),centers=[389,679];
 let body=heading(data);
 for(let v=0;v<=30;v+=10)body+=line(left,y(v),right,y(v),'class="result-grid"')+text(left-17,y(v)+5,`${v}%`,'class="result-tick" text-anchor="end"');
 data.metrics.forEach((m,i)=>{const cx=centers[i],color=i?green:blue;
  body+=target(m.detail,`<rect x="${cx-69}" y="${y(m.changePct)}" width="138" height="${bottom-y(m.changePct)}" rx="5" fill="${color}"/>`+text(cx,y(m.changePct)-14,`约 +${m.changePct}%`,`class="impact-number" fill="${color}" text-anchor="middle"`))+text(cx,371,m.label,'class="result-label" text-anchor="middle"');
 });
 body+=text(26,426,'同样一小时能解决更多问题，新人和低技能员工的增幅更大。','class="result-label"')+text(26,470,data.conclusion,'class="result-conclusion"');
 return svg('知识服务：AI辅助下全体客服与新人及低技能员工的生产率提高',body);
}

export function scienceChart(data=applicationImpacts.science){
 const left=250,right=792,x=v=>left+Math.log10(v)/6*(right-left);
 let body=heading(data)+dot(520,88,blue,5)+text(533,93,'已有研究','class="result-label"')+dot(664,88,green,5)+text(677,93,'AI 研究之后','class="result-label"');
 for(const v of [1,10,100,1000,10000,100000,1000000])body+=line(x(v),115,x(v),365,'class="result-grid"')+text(x(v),394,v>=10000?`${number(v/10000)}万`:number(v),'class="result-tick" text-anchor="middle"');
 data.metrics.forEach((m,i)=>{const y=161+i*82,ratio=m.after/m.before;
  body+=text(26,y+5,m.label,'class="result-label"')+target(m.detail,line(x(m.before),y,x(m.after),y,'stroke="#c1dbd3" stroke-width="8" stroke-linecap="round"')+dot(x(m.before),y,blue)+dot(x(m.after),y,green)+text(x(m.before),y+28,number(m.before),'class="result-value" fill="#7b91b1" text-anchor="middle"')+text(x(m.after),y-17,number(m.after),'class="result-value" fill="#0b786f" text-anchor="middle"'))+text(917,y+7,`约 ${number(ratio)} 倍`,'class="impact-number" fill="#0b786f" text-anchor="end"');
 });
 body+=text(right,423,'数量 / 个 · 对数刻度（等距表示 10 倍）','class="result-tick" text-anchor="end"')+text(26,474,data.conclusion,'class="result-conclusion"');
 return svg('科学研究：AI对稳定晶体知识库和新材料研究候选空间的扩展',body,980,510);
}

export function initApplications(doc,data=applicationImpacts){
 const renderers={manufacturing:manufacturingChart,agriculture:agricultureChart,service:serviceChart,science:scienceChart};
 for(const [scene,render] of Object.entries(renderers)){
  const item=data[scene],mount=doc.querySelector(`#${scene}-mount`);
  mount.innerHTML=`<div class="result-chart" aria-label="成果图表，可横向滚动">${render(item)}</div><p class="result-selection" aria-live="polite">${esc(item.boundary)}</p><div class="result-source"><button class="source-link" data-source="${item.source}">案例数据与来源 ↗</button></div>`;
  mount.setAttribute('aria-busy','false');
 }
 const describe=mark=>{if(mark)mark.closest('.result-figure').querySelector('.result-selection').textContent=mark.dataset.chartDetail;};
 doc.addEventListener('pointerover',event=>describe(event.target.closest('[data-chart-detail]')));
 doc.addEventListener('focusin',event=>describe(event.target.closest('[data-chart-detail]')));
 const url=new URL(doc.defaultView.location.href),hashes={'#app-diffusion':'manufacturing','#app-structure':'agriculture','#app-effects':'service','#app-distribution':'service'};
 if(hashes[url.hash]){url.hash=`app-${hashes[url.hash]}`;doc.defaultView.history.replaceState(null,'',url);}
 doc.documentElement.dataset.applicationsReady='true';const navigation=initSectionNavigation(doc);
 doc.defaultView.addEventListener('hashchange',()=>{const scene=hashes[doc.defaultView.location.hash];if(scene)navigation?.navigate(scene);});
 if(url.searchParams.has('view')&&!Object.hasOwn(renderers,url.searchParams.get('view')))navigation?.navigate('manufacturing');
 return {data,navigation};
}
if(typeof document!=='undefined'&&document.body.dataset.page==='applications')initApplications(document);
