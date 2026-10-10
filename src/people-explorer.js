import {escapeHTML as esc} from './charts.js';

const colors=['#dcefe7','#b8ddd0','#88c5b3','#55a88e','#328b73','#17644f'];
const topicColors=['#b9ded1','#d6dfa9','#94b5cb','#d3b4bf','#dcd4c5','#b2c4a2','#c8d6d5','#b1c5dd','#cfbd9e','#ccc6dc'];
export const provinces=[
 ['黑龙江',8,0],['新疆',0,1],['内蒙古',4,1],['北京',6,1],['辽宁',7,1],['吉林',8,1],
 ['西藏',0,2],['青海',1,2],['甘肃',2,2],['宁夏',3,2],['山西',4,2],['河北',5,2],['天津',6,2],['山东',7,2],
 ['四川',2,3],['陕西',3,3],['河南',4,3],['湖北',5,3],['安徽',6,3],['江苏',7,3],['上海',8,3],
 ['云南',1,4],['重庆',2,4],['贵州',3,4],['湖南',4,4],['江西',5,4],['浙江',7,4],
 ['广西',3,5],['广东',4,5],['福建',6,5],['台湾',8,5],['海南',4,6],['澳门',5,6],['香港',6,6]
];
export const usageColor=value=>value==null?'#dedfda':colors[Math.min(5,Math.floor(value/10))];

/** Squarified treemap. The public percentage labels retain their original denominator. */
export function treemapLayout(items,width,height){
 const total=items.reduce((sum,item)=>sum+item.value,0);
 if(!total||width<=0||height<=0)return [];
 const pending=items.map(item=>({...item,area:item.value/total*width*height})).sort((a,b)=>b.area-a.area);
 const boxes=[];let x=0,y=0,w=width,h=height,row=[];
 const worst=(r,side)=>{if(!r.length)return Infinity;const s=r.reduce((n,i)=>n+i.area,0),areas=r.map(i=>i.area);return Math.max(side*side*Math.max(...areas)/(s*s),s*s/(side*side*Math.min(...areas)));};
 const place=()=>{const sum=row.reduce((n,i)=>n+i.area,0);if(w>=h){const strip=sum/h;let pos=y;for(const item of row){const extent=item.area/strip;boxes.push({...item,x,y:pos,w:strip,h:extent});pos+=extent;}x+=strip;w-=strip;}else{const strip=sum/w;let pos=x;for(const item of row){const extent=item.area/strip;boxes.push({...item,x:pos,y,w:extent,h:strip});pos+=extent;}y+=strip;h-=strip;}row=[];};
 while(pending.length){const next=pending[0],side=Math.min(w,h);if(!row.length||worst([...row,next],side)<=worst(row,side)){row.push(pending.shift());}else place();}
 if(row.length)place();return boxes;
}

export function initPeopleExplorer(doc,data,onTasks=()=>{}){
 if(!doc.querySelector('#world-map')||!data)return null;
 const $=selector=>doc.querySelector(selector),$$=selector=>[...doc.querySelectorAll(selector)],win=doc.defaultView;
 const state={view:'world',period:'q2_2026',country:'CHN',topic:data.usage.topics[0].id,group:'target',province:'广东',query:''};
 const rankedCountries=()=>[...data.world.countries].sort((a,b)=>b[state.period]-a[state.period]||a.name.localeCompare(b.name));
 const countryById=new Map(data.world.countries.map(c=>[c.id,c]));
 const renderWorldDetail=()=>{
  const c=countryById.get(state.country),rank=rankedCountries().findIndex(r=>r.id===c.id)+1;
  $('#world-detail').innerHTML=`<p class="detail-kicker">当前选择 · ${esc(data.world.periods.find(p=>p.id===state.period).label)}</p><h3>${esc(c.name)}</h3><p class="original-name">${esc(c.original)}</p><div class="detail-number">${c[state.period].toFixed(1)}<small>% 估计使用率</small></div><p>在 147 个已公布经济体中位列第 ${rank}。<br>使用率描述普及程度，不能解释为 AI 产业实力。</p>`;
  $$('#world-map [data-country]').forEach(n=>n.classList.toggle('selected',n.dataset.country===state.country));
  $$('#world-ranking [data-country]').forEach(n=>n.classList.toggle('selected',n.dataset.country===state.country));
 };
 const renderWorldRanking=()=>{
  const all=rankedCountries(),query=state.query.trim().toLocaleLowerCase();
  const filtered=all.filter(c=>`${c.name} ${c.original} ${c.id}`.toLocaleLowerCase().includes(query));
  $('#world-count').textContent=`${filtered.length} / 147`;
  $('#world-ranking').innerHTML=filtered.length?filtered.map(c=>`<button class="insight-rank${c.id===state.country?' selected':''}" data-country="${c.id}" aria-label="${esc(c.name)}，估计使用率 ${c[state.period]}%"><span>${all.indexOf(c)+1}</span><span>${esc(c.name)}</span><strong>${c[state.period].toFixed(1)}%</strong></button>`).join(''):'<p class="chart-note">没有匹配的国家或地区。</p>';
 };
 const renderWorld=()=>{
  $('#world-map').innerHTML=`<svg viewBox="0 0 1000 520" role="group" aria-label="全球生成式 AI 估计使用率地图">${data.world.geometry.map(g=>{
   const c=countryById.get(g.id),v=c?.[state.period],label=`${c?.name||g.name}：${v==null?'没有公开数据':v+'% 估计使用率'}`;
   return `<path class="world-region${g.id===state.country?' selected':''}" d="${g.path}" fill="${usageColor(v)}" fill-rule="evenodd" data-country="${g.id}" role="button" tabindex="${c?'0':'-1'}" aria-disabled="${!c}" aria-label="${esc(label)}"><title>${esc(label)}</title></path>${g.tiny&&c?`<circle class="world-region" cx="${g.center[0]}" cy="${g.center[1]}" r="3.6" fill="${usageColor(v)}" data-country="${g.id}" aria-label="${esc(label)}"><title>${esc(label)}</title></circle>`:''}`;
  }).join('')}</svg><div class="map-tooltip" hidden></div>`;
  const top=rankedCountries().slice(0,3);
  $('#world-analysis').innerHTML=`这一时期，${top.map(c=>`<strong>${esc(c.name)} ${c[state.period].toFixed(1)}%</strong>`).join('、')}的估计使用率最高。颜色显示同一口径下的普及差异；用户总数还取决于人口规模，不能只看颜色判断。`;
  renderWorldRanking();renderWorldDetail();
 };
 const renderUsageDetail=()=>{
  const item=data.usage.topics.find(t=>t.id===state.topic);
  $('#usage-detail').innerHTML=`<p class="detail-kicker">当前请求类别 · 2026 年 5 月</p><h3>${esc(item.name)}</h3><p class="original-name">${esc(item.original)}</p><div class="detail-number">${item.value.toFixed(2)}<small>% 请求比例</small></div><p>${esc(item.analysis)}</p><p>该数值描述样本用途，未测量节省时间或生产率提升。</p>`;
  $$('[data-topic]').forEach(n=>n.classList.toggle('selected',n.dataset.topic===state.topic));
 };
 const renderTreemap=()=>{
  const target=$('#usage-treemap'),width=target.clientWidth||860,height=target.clientHeight||470;
  target.innerHTML=treemapLayout(data.usage.topics,width,height).map((item,i)=>{
   const compact=item.w<155||item.h<92,tiny=item.w<55||item.h<42;
   return `<button class="treemap-block${compact?' compact':''}${tiny?' tiny':''}" data-topic="${item.id}" style="left:${item.x/width*100}%;top:${item.y/height*100}%;width:${item.w/width*100}%;height:${item.h/height*100}%;background:${topicColors[i%topicColors.length]}" aria-label="${esc(item.name)}，请求比例 ${item.value}%" title="${esc(item.name)} · ${item.value}%"><strong>${esc(item.name)}</strong><span>${item.value.toFixed(2)}%</span></button>`;
  }).join('');
  renderUsageDetail();
 };
 const renderUsage=()=>{
  $('#usage-ranking').innerHTML=data.usage.topics.map((t,i)=>`<button class="insight-rank" data-topic="${t.id}"><span>${i+1}</span><span>${esc(t.name)}</span><strong>${t.value.toFixed(2)}%</strong></button>`).join('');
  renderTreemap();
 };
 const currentGroup=()=>data.china.groups.find(g=>g.id===state.group);
 const renderChinaDetail=()=>{
  const group=currentGroup(),rank=group.ranking.indexOf(state.province)+1;
  $('#china-detail').innerHTML=`<p class="detail-kicker">当前选择 · ${esc(group.name)}</p><h3>${esc(state.province)}</h3><div class="detail-number">${rank?'#'+rank:'—'}<small>${rank?'样本省份位次':'未公布位次'}</small></div><p>${rank?`在这类受访用户的省份分布中位列第 ${rank}。报告未给出该省的用户比例。`:'该地区没有公开 Top10 位次，不能解释为没有 AI 用户，也不能补成零。'}</p>`;
  $$('[data-province]').forEach(n=>n.classList.toggle('selected',n.dataset.province===state.province));
 };
 const renderChina=()=>{
  const group=currentGroup();
  $('#china-groups').innerHTML=data.china.groups.map(g=>`<button data-china-group="${g.id}" aria-pressed="${g.id===state.group}">${esc(g.name)}</button>`).join('');
  $('#china-grid').innerHTML=provinces.map(([name,col,row])=>{
   const rank=group.ranking.indexOf(name)+1,color=!rank?'#e5e6e1':rank<=3?'#328b73':rank<=6?'#88c5b3':'#c2e3d6';
   return `<button class="province-tile" data-province="${name}" data-rank="${rank}" style="grid-column:${col+1};grid-row:${row+1};background:${color}" aria-label="${name}，${rank?'样本位列第 '+rank:'未公布位次'}">${name}<span>${rank?'#'+rank:'未公布'}</span></button>`;
  }).join('');
  $('#china-ranking').innerHTML=group.ranking.map((name,i)=>`<button class="insight-rank" data-province="${name}"><span>${i+1}</span><span>${name}</span><strong>Top ${i+1}</strong></button>`).join('');
  $('#china-sample').innerHTML=`<strong>${group.n} 人</strong> · 当前人群样本<br>${esc(group.definition)}<br>完整问卷有效样本 633 人；目标用户 608 人。`;
  $('#china-analysis').innerHTML=`在<strong>${esc(group.name)}</strong>样本中，<strong>${group.ranking.slice(0,3).join('、')}</strong>位列前三。切换人群后，省份排序会改变，说明使用方式不同的人群，其样本地域分布也不同。这里衡量样本构成，未对各省人口进行校正。`;
  renderChinaDetail();
 };
 const showView=id=>{
  state.view=id;
  if(doc.body.dataset.scrollSections==='true'){
   $$('.people-view').forEach(n=>n.hidden=false);
   if(id==='usage')renderTreemap();if(id==='tasks')onTasks();return;
  }
  $$('[data-insight]').forEach(n=>{const active=n.dataset.insight===id;n.setAttribute('aria-selected',String(active));n.tabIndex=active?0:-1;});
  $$('.people-view').forEach(n=>{n.hidden=n.id!==`people-${id}`;});
  if(id==='usage')renderTreemap();
  if(id==='tasks')onTasks();
 };
 $('#world-period').innerHTML=data.world.periods.map(p=>`<option value="${p.id}">${esc(p.label)}</option>`).join('');
 $('#world-period').value=state.period;
 $('#world-period').addEventListener('change',e=>{state.period=e.target.value;renderWorld();});
 $('#world-search').addEventListener('input',e=>{state.query=e.target.value;renderWorldRanking();});
 doc.addEventListener('click',e=>{
  const t=e.target.closest('[data-insight],[data-country],[data-topic],[data-china-group],[data-province]');if(!t)return;
  if(t.dataset.insight)showView(t.dataset.insight);
  else if(t.dataset.country&&countryById.has(t.dataset.country)){state.country=t.dataset.country;renderWorldDetail();}
  else if(t.dataset.topic){state.topic=t.dataset.topic;renderUsageDetail();}
  else if(t.dataset.chinaGroup){state.group=t.dataset.chinaGroup;renderChina();$('#china-groups [aria-pressed=true]').focus({preventScroll:true});}
  else if(t.dataset.province){state.province=t.dataset.province;renderChinaDetail();}
 });
 doc.addEventListener('keydown',e=>{
  if(e.target.matches('.world-region')&&['Enter',' '].includes(e.key)){e.preventDefault();e.target.dispatchEvent(new win.MouseEvent('click',{bubbles:true}));}
  if(e.target.matches('[data-insight]')&&['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){
   e.preventDefault();const tabs=$$('[data-insight]'),index=tabs.indexOf(e.target),next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length;tabs[next].click();tabs[next].focus({preventScroll:true});
  }
 });
 const showTooltip=e=>{
  const path=e.target.closest('[data-country]');if(!path)return;
  const g=data.world.geometry.find(g=>g.id===path.dataset.country),c=countryById.get(path.dataset.country),tip=$('#world-map .map-tooltip'),bounds=$('#world-map').getBoundingClientRect();
  tip.innerHTML=`${esc(c?.name||g?.name||path.dataset.country)}<strong>${c?c[state.period].toFixed(1)+'%':'没有公开数据'}</strong>`;tip.hidden=false;
  const x=e.type==='focusin'?g.center[0]/1000*bounds.width:e.clientX-bounds.left+12;
  const y=e.type==='focusin'?g.center[1]/520*bounds.height:e.clientY-bounds.top+12;
  tip.style.left=`${Math.max(4,Math.min(x,bounds.width-tip.offsetWidth-5))}px`;tip.style.top=`${Math.max(4,Math.min(y,bounds.height-tip.offsetHeight-5))}px`;
 };
 $('#world-map').addEventListener('pointermove',showTooltip);$('#world-map').addEventListener('focusin',showTooltip);
 $('#world-map').addEventListener('pointerleave',()=>{$('#world-map .map-tooltip').hidden=true;});$('#world-map').addEventListener('focusout',()=>{$('#world-map .map-tooltip').hidden=true;});
 let resizeTimer;win.addEventListener('resize',()=>{win.clearTimeout(resizeTimer);resizeTimer=win.setTimeout(()=>{if(doc.body.dataset.scrollSections==='true'||state.view==='usage')renderTreemap();},80);});
 renderWorld();renderUsage();renderChina();showView('world');
 return {state,showView,renderWorld,renderTreemap,renderChina};
}
