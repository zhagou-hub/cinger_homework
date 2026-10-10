import {sources} from './data/sources.js';
import {initPeopleExplorer} from './people-explorer.js';
import {initSectionNavigation} from './section-navigation.js';
import {legacyApplicationView} from './applications/routes.js';
import {escapeHTML as esc,fmt,signed,levels,methods,categories,series,heatColor,table,scatterChart,agricultureChart,effectInterval,energyChart} from './charts.js';

const mechanism=[
 ['采集','设备数据','从设备记录，发现变化','传感器采集温度、振动、电流等状态信号。持续且可靠的数据，让异常有机会在停线之前被看见。'],
 ['识别','模型分析','把信号转成维护线索','模型比较状态变化并识别异常模式。输出只是风险线索，需要与设备知识和工作条件一起判断。'],
 ['判断','人员核验','结合现场经验，判断是否行动','工程人员核验异常原因、风险和误报。人负责解释情境并决定行动，让模型输出进入可负责的决策。'],
 ['行动','维护安排','把判断接入生产流程','结合生产排程、备件与维修人员，安排检查或维护。信息必须转化成实际行动，才可能改善运行。'],
 ['结果','生产运行','用真实结果检验价值','关注停线时间、质量和资源使用，而非仅看模型分数。BMW 的披露说明了一个应用案例，未提供可独立验证的反事实。'],
 ['反馈','持续改进','让行动结果成为下一轮数据','记录维修结果和误报，更新数据与流程。改进同时涉及技术和组织，单靠上线一个模型无法保证收益。']
];
const groupNames={'1':'管理人员','2':'专业人员','3':'技术与辅助专业人员','4':'文职支持人员','5':'服务与销售人员','6':'农林渔业熟练劳动者','7':'工艺及相关行业工人','8':'设备操作与装配人员','9':'基础职业'};
const serviceMeta={
 resolutions_per_hour:{name:'每小时解决问题数',unit:'件 / 小时',digits:3,focus:'单位时间内，解决更多问题',interpretation:'估计效果为正，近似区间未跨零；支持这家企业中该岗位的效率改善。'},
 average_handle_time:{name:'平均处理时长',unit:'分钟',digits:3,focus:'处理一个问题，需要更少时间',interpretation:'估计效果为负，近似区间未跨零。处理时长下降表示速度改善。'},
 chats_per_hour:{name:'每小时聊天数',unit:'次 / 小时',digits:3,focus:'单位时间内，处理更多对话',interpretation:'估计效果为正，近似区间未跨零；它衡量处理量，与解决率不同。'},
 resolution_rate:{name:'问题解决率',unit:'个百分点',digits:2,focus:'效率提高，是否也提升解决率？',interpretation:'近似区间跨零，不能据此声称解决率明确提高。比例差与标准误均乘以 100 转为百分点。'},
 net_promoter_score:{name:'净推荐值 NPS',unit:'NPS 分',digits:3,focus:'服务质量，还需要单独评价',interpretation:'近似区间跨零，不能据此声称净推荐值明确改善或下降。'}
};
const viewpoint={
 manufacturing:{enterprise:'企业关注不同物品类别的适用性。热力图说明方法表现依赖场景，导入工厂前仍需用现场样本核验质量与成本。',worker:'劳动者关注异常识别如何辅助检查。基准得分衡量算法表现，现场判断、复核与维护经验仍参与流程。',user:'使用者关注最终产品的可靠性。PR-AUC 是识别能力的一种评价，不能直接换算为产品不良率或用户体验提升。',society:'社会关注技术与产业升级的联系。异常识别可以成为改进生产环节的工具，其普遍价值需要更广泛的应用证据。'},
 agriculture:{enterprise:'经营者关注水分状态与精准管理。两个田块和完整系统的比较提供线索，但现有数据不足以核算增产、利润或回收期。',worker:'农业劳动者关注监测结果如何支持灌溉判断。不同年份与阶段出现差异，需要结合天气、土壤和现场经验。',user:'使用者关注农产品与资源使用。这项研究测量水分状态，尚不能据此推出最终产量、品质或价格变化。',society:'社会关注资源利用的改进。研究支持讨论精准管理的可能，但两个美国田块不能代表中国农业平均效果。'},
 service:{enterprise:'企业可以同时关注处理速度、处理量和质量。效果估计中，速度与效率的证据较明确；解决率与 NPS 的区间跨零。',worker:'劳动者关注知识辅助如何改变任务。AI 可以支持查询与回答，复杂沟通、结果核验和承担责任仍是人的工作。',user:'服务使用者关注问题是否被解决。更多对话或更短时长不自动等于更好服务，解决率与 NPS 要独立检验。',society:'社会关注知识能否更广泛地用于服务。该研究提供特定企业的效果证据，不能直接换算为全国劳动生产率增长。'}
};

export function filterOccupations(occupations,query='',group=''){
 const q=query.trim().toLocaleLowerCase();
 return occupations.filter(o=>(!group||o.group===group)&&(!q||`${o.code} ${o.title} ${o.title_zh||''}`.toLocaleLowerCase().includes(q)));
}
export function initApp(doc,data,peopleData=null){
 const $=s=>doc.querySelector(s),$$=s=>[...doc.querySelectorAll(s)],win=doc.defaultView;
 const page=doc.body.dataset.page||'understand';
 $$('#main-nav a').forEach(a=>{
  const active=a.dataset.page===page;
  a.classList.toggle('active',active);
  if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
 });
 const state={industry:'manufacturing',category:'Metal_nut',year:2023,stage:'VT-R4',agriMetric:'wdi',serviceMetric:'resolutions_per_hour',perspective:'enterprise',selected:'4132',query:'',group:'',visibleCount:12,compare:['4132','2512'],energyYear:2030,enabled:new Set(series.map(s=>s.key)),step:0};
 const name=o=>o.title_zh||o.title;
 const sourceButton=id=>`<button class="source-link" data-source="${id}">来源与计算方法 ${id} ↗</button>`;
 const infoError='<div class="empty-state"><strong>没有匹配职业</strong>请尝试英文名称、职业代码，或清除筛选。</div>';
 function notify(message){const node=$('.toast');node.textContent=message;node.hidden=false;win.clearTimeout(node._timer);node._timer=win.setTimeout(()=>node.hidden=true,3500);}
 function renderMechanism(){
  $('#mechanism-track').innerHTML=mechanism.map((n,i)=>`<button class="mechanism-node" data-mechanism="${i}" aria-pressed="${i===state.step}"><span>0${i+1}</span><strong>${n[0]}</strong><small>${n[1]}</small></button>`).join('');
  $('#mechanism-step').textContent=`STEP 0${state.step+1} / 06`;
  $('#mechanism-title').textContent=mechanism[state.step][2];$('#mechanism-description').textContent=mechanism[state.step][3];
 }
 function renderPerspective(){
  if(doc.body.dataset.scrollSections==='true'){
   $$('[data-perspective]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.perspective===state.perspective));
   $$('[data-perspective-case]').forEach(p=>p.textContent=viewpoint[p.dataset.perspectiveCase][state.perspective]);return;
  }
  $$('#perspectives button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.perspective===state.perspective));
  $('#perspective-text').textContent=viewpoint[state.industry][state.perspective];
 }
 function renderManufacturing(){
  const row=data.manufacturing.find(r=>r.category===state.category),ranking=methods.map(m=>({key:m[0],label:m[1],value:row[m[0]]})).sort((a,b)=>b.value-a.value),best=ranking[0];
  return `<div class="industry-panel-head"><div><h3>工业质检 · 方法对比</h3><p>2021 年 MVTec AD 研究基准，15 类物品与纹理、7 种方法。点击一行，比较该类别的方法表现。</p></div><span class="pill">算法评价 / PR-AUC</span></div>
  <div class="industry-grid"><article class="chart-box"><div class="chart-heading"><h3>类别 × 方法热力图</h3><span class="unit">像素级 PR-AUC · 0—1</span></div><div class="matrix-scroll"><table class="heatmap" aria-label="MVTec 2021 像素级PR-AUC热力图"><thead><tr><th scope="col">类别</th>${methods.map(m=>`<th scope="col" title="${esc(m[1])}">${m[2]}</th>`).join('')}</tr></thead><tbody>${data.manufacturing.map(r=>`<tr class="${r.category===state.category?'selected':''}"><td class="row-label"><button data-category="${r.category}" aria-pressed="${r.category===state.category}">${categories[r.category]}</button></td>${methods.map(m=>`<td><button data-category="${r.category}" style="background:${heatColor(r[m[0]])};color:${r[m[0]]>.55?'#fff':'#365749'}" aria-label="${categories[r.category]}，${esc(m[1])}，${fmt(r[m[0]],3)}">${fmt(r[m[0]],3)}</button></td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="heat-legend"><span>较低</span><span>0</span><span class="gradient-bar"></span><span>1</span><span>较高</span></div><p class="chart-note">色标固定为 0—1。手机可左右滑动表格；所有数值可以直接读取。</p>${sourceButton('S05')}</article>
  <div class="industry-detail"><article class="chart-box"><div class="category-chooser"><h3 class="chart-detail-title">${categories[row.category]} <small>/ ${row.category}</small></h3><select id="category-select" aria-label="工业物品类别">${data.manufacturing.map(r=>`<option value="${r.category}" ${r.category===state.category?'selected':''}>${categories[r.category]}</option>`).join('')}</select></div><p class="chart-note" style="margin-bottom:20px">当前类别的 7 种方法，按 PR-AUC 从高到低排列。</p><div class="ranking">${ranking.map(r=>`<div class="rank-row"><span>${esc(r.label)}</span><span class="bar-track"><span class="bar-fill" style="--bar:${r.value*100}%;display:block"></span></span><span class="number">${fmt(r.value,3)}</span></div>`).join('')}</div></article><div class="insight-box"><strong>${best.label} / ${fmt(best.value,3)}</strong><p>在所选类别中得分最高。切换类别，观察排序是否改变，避免将单一场景的表现推广到所有物品。</p></div><p class="industry-caveat">PR-AUC 为精确率—召回率曲线下面积，数值越高通常越好。它不是准确率、不良率或工厂生产率；这里展示的是 2021 年的方法比较。</p></div></div>`;
 }
 function renderAgriculture(){
  const rows=data.agriculture.filter(r=>r.year===state.year),pair=rows.filter(r=>r.growth_stage===state.stage),a=pair.find(r=>r.field==='A'),b=pair.find(r=>r.field==='B'),metric=state.agriMetric,diff=a[metric]-b[metric];
  const desc=metric==='wdi'?(diff<0?'A 田块水分胁迫较小。':diff>0?'A 田块水分胁迫较大，方向与部分其他阶段不同。':'两个田块的 WDI 相同。'):(diff>0?'A 田块 NDVI 较高。':diff<0?'A 田块 NDVI 较低。':'两个田块的 NDVI 相同。');
  return `<div class="industry-panel-head"><div><h3>农业灌溉 · 田块对照</h3><p>美国堪萨斯州相邻两个玉米田块：A 为 AI 与探地雷达灌溉系统，B 为地下滴灌对照。</p></div><span class="pill">两季 / 田间系统比较</span></div><div class="industry-grid"><article class="chart-box"><div class="control-row"><label>年份<select id="agri-year"><option ${state.year===2021?'selected':''}>2021</option><option ${state.year===2023?'selected':''}>2023</option></select></label><label>生育阶段<select id="agri-stage"><option ${state.stage==='V8-V11'?'selected':''}>V8-V11</option><option ${state.stage==='VT-R4'?'selected':''}>VT-R4</option></select></label><label>指标<select id="agri-metric"><option value="wdi" ${metric==='wdi'?'selected':''}>WDI 水分胁迫</option><option value="ndvi" ${metric==='ndvi'?'selected':''}>NDVI 植被指数</option></select></label></div><div class="chart-heading"><h3>${state.year} 年同阶段田块对照</h3><span class="unit">${metric.toUpperCase()} · 无量纲</span></div><div class="agriculture-svg">${agricultureChart(rows,metric,state.stage,win.innerWidth<600)}</div><div class="chart-legend"><span class="legend-item"><i class="legend-dot" style="--dot:#136e64"></i>A · AI-Radar</span><span class="legend-item"><i class="legend-dot" style="--dot:#a78862"></i>B · SSDI</span></div><p class="chart-note">${metric==='wdi'?'误差线为 WDI 标准差，并非置信区间；WDI 越低，水分胁迫越小。':'NDVI 使用独立 0—1 刻度。原表没有提供 NDVI 标准差，未绘制误差线。'}浅色为未选中阶段，点选控件查看对照。</p>${sourceButton('S07')}<details class="data-table"><summary>查看原表数值</summary><div class="table-scroll">${table(['年份','阶段','田块','NDVI','WDI','WDI 标准差'],data.agriculture.map(r=>[r.year,r.growth_stage,r.field,fmt(r.ndvi),fmt(r.wdi),fmt(r.wdi_sd)]))}</div></details></article><div class="industry-detail"><article class="chart-box"><span class="eyebrow">${state.year} / ${state.stage}</span><h3 style="margin:12px 0 18px">${metric.toUpperCase()} · A 相对 B 的差值</h3><div class="pair-focus">${signed(diff)}<small> 无量纲</small></div><p class="chart-note">A：${fmt(a[metric])} / B：${fmt(b[metric])}</p><p class="chart-note">${desc}</p></article><div class="insight-box"><strong>保留阶段差异，理解适用条件。</strong><p>2023 年 V8–V11 的 WDI：A 为 0.11，B 为 0.09。数据中存在不同方向，不能概括为所有阶段均改善。</p></div><p class="industry-caveat">2021、2023 年两季研究，2025 年发表。完整系统及田块的比较不能单独识别 AI 算法净贡献；本页不推算增产、利润或回收期。</p></div></div>`;
 }
 function renderService(){
  const row=data.service.find(r=>r.metric===state.serviceMetric),meta=serviceMeta[row.metric],factor=row.metric==='resolution_rate'?100:1,effect=row.effect*factor,se=row.standard_error*factor,interval=effectInterval(effect,se,meta.unit);
  return `<div class="industry-panel-head"><div><h3>知识服务 · 客服效果</h3><p>研究中的 AI 辅助为客服提供建议。这里展示论文的回归效果估计及标准误，点击指标查看结果与不确定性。</p></div><span class="pill">QJE 2025 / 特定企业</span></div><div class="service-list">${data.service.map(r=>{const m=serviceMeta[r.metric],f=r.metric==='resolution_rate'?100:1;return `<button data-service="${r.metric}" aria-pressed="${r.metric===state.serviceMetric}">${m.name}<strong>${signed(r.effect*f,m.digits)}</strong><small>${m.unit}</small></button>`;}).join('')}</div><div class="service-grid"><article class="chart-box"><div class="chart-heading"><h3>${meta.name}</h3><span class="unit">回归系数 · ${meta.unit}</span></div>${interval.html}<div class="chart-legend"><span class="legend-item"><i class="legend-dot" style="--dot:#136e64"></i>点：效果估计</span><span class="legend-item">横线：近似 95% 区间</span><span class="legend-item">竖虚线：零效应</span></div><p class="chart-note">标准误 ${fmt(se,5)}；正态近似 95% 区间 [${fmt(interval.lo,3)}, ${fmt(interval.hi,3)}]。不同单位使用独立坐标轴。</p>${sourceButton('S04')}<details class="data-table"><summary>查看原始系数与标准误</summary><div class="table-scroll">${table(['指标','原始系数','标准误','原始单位'],data.service.map(r=>[serviceMeta[r.metric].name,r.effect,r.standard_error,r.unit]))}</div></details></article><div class="industry-detail"><div><h3 style="margin-bottom:17px">${meta.focus}</h3><div class="effect-value">${signed(effect,meta.digits)} <small>${meta.unit}</small></div><div class="insight-box"><strong>${interval.lo<=0&&interval.hi>=0?'区间跨零 / 证据存在不确定性':'区间未跨零 / 有方向性证据'}</strong><p>${meta.interpretation}</p></div></div><p class="industry-caveat">这里的数字是估计效果，不是“上线前 / 上线后”原始均值。样本来自特定企业与岗位，员工微观记录受共享限制。</p></div></div>`;
 }
 function renderIndustry(){
  if(doc.body.dataset.scrollSections==='true'){
   $$('[data-industry-mount]').forEach(panel=>{panel.innerHTML=panel.dataset.industryMount==='manufacturing'?renderManufacturing():panel.dataset.industryMount==='agriculture'?renderAgriculture():renderService();});renderPerspective();return;
  }
  $$('.industry-tabs button').forEach(b=>{b.setAttribute('aria-selected',b.dataset.industry===state.industry);b.tabIndex=b.dataset.industry===state.industry?0:-1;});
  const panel=$('#industry-panel');panel.setAttribute('aria-labelledby',`tab-${state.industry}`);
  panel.innerHTML=state.industry==='manufacturing'?renderManufacturing():state.industry==='agriculture'?renderAgriculture():renderService();renderPerspective();
 }
 function renderValue(){
  $('#adoption-chart').innerHTML=`<div class="adoption-bars" role="img" aria-label="2024年12月普及率17.7%，2025年6月36.5%"><div class="adoption-bar" style="--height:${17.7/40*100}%"><strong>17.7<small style="position:static">%</small></strong><small>2024 年 12 月</small></div><div class="adoption-bar" style="--height:${36.5/40*100}%"><strong>36.5<small style="position:static">%</small></strong><small>2025 年 6 月</small></div></div><p class="chart-note" style="text-align:right;margin-top:35px">统一刻度：0—40%</p>`;
  $('#purpose-chart').innerHTML=`<div class="purpose-bars" role="img" aria-label="7类可重叠用途分布">${data.purposes.map(r=>`<div class="purpose-row"><span>${esc(r.purpose_zh)}</span><span class="bar-track"><span class="bar-fill" style="--bar:${r.share_pct}%;display:block"></span></span><span class="number">${fmt(r.share_pct,1)}</span></div>`).join('')}</div>`;
 }
 function sortedMatches(){
  const preferred=['4132','2512','2166','4222'];return filterOccupations(data.occupations,state.query,state.group).sort((a,b)=>{const ai=preferred.indexOf(a.code),bi=preferred.indexOf(b.code);return (ai<0?99:ai)-(bi<0?99:bi)||a.code.localeCompare(b.code);});
 }
 const taskHTML=t=>`<div class="task-item"><div><p lang="en">${esc(t.text)}</p><strong>${fmt(t.score)}</strong></div><small>任务 ID ${esc(t.id)}</small><div class="bar-track"><div class="bar-fill" style="--bar:${t.score==null?0:t.score*100}%"></div></div></div>`;
 function renderDetail(){
  const o=data.occupations.find(o=>o.code===state.selected);if(!o){$('#occupation-detail').innerHTML=sortedMatches().length?'<div class="empty-state"><strong>选择一种职业</strong>点击散点、职业列表或表格，查看它的真实任务。</div>':infoError;return;}
  const tasks=[...o.tasks].sort((a,b)=>(b.score??-1)-(a.score??-1)),added=state.compare.includes(o.code);
  $('#occupation-detail').innerHTML=`<div class="eyebrow">OCCUPATION / ISCO ${o.code}</div><h3>${esc(name(o))}</h3><p class="english-title" lang="en">${esc(o.title)}</p><div class="level-pill"><span class="legend-dot" style="--dot:${levels[o.level].color}"></span>${levels[o.level].name}</div><div class="score-pair"><div><strong>${fmt(o.mean)}</strong><span>平均暴露分</span></div><div><strong>${fmt(o.sd)}</strong><span>任务分数标准差</span></div></div><div class="detail-actions"><button class="button primary" data-add-compare="${o.code}" ${added?'disabled':''}>${added?'已加入比较':'加入职业比较'} <span>+</span></button><button class="subtle-button" id="deselect-occupation">取消选中</button></div><h3 style="font-size:12px">${o.tasks.length} 项真实任务</h3><p class="chart-note" style="margin-top:5px">原文保留，按任务暴露分降序排列；尚未逐项翻译。</p><div class="task-list">${tasks.slice(0,3).map(taskHTML).join('')}</div>${tasks.length>3?`<details class="task-disclosure"><summary>展开其余 ${tasks.length-3} 项任务</summary><div class="task-list">${tasks.slice(3).map(taskHTML).join('')}</div></details>`:''}`;
 }
 function renderPeople(){
  const matches=sortedMatches();if(state.selected&&!matches.some(o=>o.code===state.selected))state.selected=matches[0]?.code||null;
  $('#occupation-count').textContent=`${matches.length} / 427 种职业`;
  $('#scatter-chart').innerHTML=scatterChart(matches,state.selected,win.innerWidth<600).replace('role="img"','role="group"');
  $('#occupation-list').innerHTML=matches.length?matches.slice(0,state.visibleCount).map(o=>`<button class="occupation-chip" data-occupation="${o.code}" aria-pressed="${state.selected===o.code}" aria-label="查看 ${esc(name(o))} ${o.code}"><span>${o.code}</span><strong>${esc(name(o))}</strong></button>`).join(''):infoError;
  $('#more-occupations').hidden=matches.length<=state.visibleCount;$('#list-status').textContent=matches.length?`已显示 ${Math.min(matches.length,state.visibleCount)} / ${matches.length} 种职业`:'';
  $('#occupation-table').innerHTML=`<table class="plain-table"><thead><tr><th>代码</th><th>职业（中文 / 原文）</th><th>均值</th><th>标准差</th><th>等级</th></tr></thead><tbody>${matches.map(o=>`<tr><td>${o.code}</td><td><button data-occupation="${o.code}">${esc(name(o))}${o.title_zh?` / ${esc(o.title)}`:''}</button></td><td>${fmt(o.mean)}</td><td>${fmt(o.sd)}</td><td>${levels[o.level].name}</td></tr>`).join('')}</tbody></table>`;
  renderDetail();
 }
 function renderComparison(){
  const items=state.compare.map(code=>data.occupations.find(o=>o.code===code));
  $('#comparison-tray').innerHTML=`<div class="comparison-tray">${items.map(o=>`<span class="compare-chip">${esc(name(o))}<button data-remove-compare="${o.code}" aria-label="从比较中移除 ${esc(name(o))}">×</button></span>`).join('')}</div>`;
  $('#comparison-chart').innerHTML=items.length<2?'<div class="empty-state">请在职业详情中加入至少 2 个职业，开始比较。</div>':`<div class="compare-grid" style="--count:${items.length}">${items.map(o=>`<article class="compare-card"><h4>${esc(name(o))}</h4><p class="english-title" lang="en">${o.code} / ${esc(o.title)}</p><div class="compare-metric"><div><span>平均暴露分（0—1）</span><strong>${fmt(o.mean)}</strong></div><div class="bar-track"><div class="bar-fill" style="--bar:${o.mean*100}%"></div></div></div><div class="compare-metric"><div><span>任务分数标准差（0—0.4）</span><strong>${fmt(o.sd)}</strong></div><div class="bar-track"><div class="bar-fill" style="--bar:${o.sd/.4*100}%"></div></div></div><div class="level-pill">${levels[o.level].name}</div><p class="chart-note">${o.tasks.length} 项任务 / 原始职业等级</p></article>`).join('')}</div>`;
  $('#clear-comparison').disabled=state.compare.length===0;
 }
 function renderEnergy(){
  const row=data.energy.find(r=>r.year===state.energyYear);$('#year-output').value=String(state.energyYear);$('#energy-card-year').innerHTML=`${state.energyYear} <span>年</span>`;
  $('#energy-chart').innerHTML=energyChart(data.energy,state.energyYear,state.enabled,win.innerWidth<600).replace('<svg ','<svg class="energy-svg" ');
  $('#energy-cards').innerHTML=state.energyYear<=2024?`<div class="energy-card"><span><i class="legend-dot" style="--dot:#687c69"></i>历史估计</span><strong>${row.Historical}<small>TWh</small></strong></div>`:series.map(s=>`<div class="energy-card ${state.enabled.has(s.key)?'':'disabled'}"><span><i class="legend-dot" style="--dot:${s.color}"></i>${s.name}${state.enabled.has(s.key)?'':'（已隐藏）'}</span><strong>${state.enabled.has(s.key)?row[s.key]:'—'}<small>TWh</small></strong></div>`).join('');
  $('#energy-explanation').textContent=state.energyYear<=2024?`${state.energyYear} 年为历史估计，尚不区分未来情景。2024 年的 416 TWh 为四条情景线的共同起点。`:state.enabled.size===0?'当前已隐藏全部情景。重新勾选图例可显示未来路径。':state.enabled.has('Base')?`${state.energyYear} 年基准情景为 ${row.Base} TWh，约为 2024 年历史估计 416 TWh 的 ${fmt(row.Base/416,2)} 倍。该比值由图表数据计算，不表示 AI 的单独用电增长。`:`当前展示 ${state.enabled.size} 个情景；同年数值用于比较不同研究设定，不应相加。`;
 }
 function renderSources(){
  $('#sources-grid').innerHTML=sources.map(s=>`<article class="source-entry" id="source-${s.id}"><div><span class="source-id">${s.id}</span><span class="source-kind">${s.kind}</span></div><h3>${esc(s.name)}</h3><p>${esc(s.organization)} · ${s.year}</p><button class="source-link" data-source="${s.id}">来源、口径与限制 ↗</button></article>`).join('');
 }
 function openSource(ids){
  const selected=sources.filter(s=>ids.split(',').includes(s.id));
  $('#source-dialog-content').innerHTML=selected.map((s,i)=>`<article class="dialog-source"><p class="eyebrow">${s.id} / ${esc(s.kind)}</p><h3 ${i===0?'id="source-dialog-title"':''}>${esc(s.name)}</h3><p>${esc(s.organization)} · ${esc(s.date)}</p><dl><dt>统计对象</dt><dd>${esc(s.object)}</dd><dt>数据时期</dt><dd>${esc(s.period)}</dd><dt>单位</dt><dd>${esc(s.unit)}</dd><dt>定位</dt><dd>${esc(s.location)}</dd><dt>整理日期</dt><dd>2026-10-10</dd></dl><p><strong>处理与计算：</strong>${esc(s.method)}</p><p><strong>适用边界：</strong>${esc(s.limit)}</p>${s.license?`<p>${esc(s.license)}</p>`:''}${s.links.map(l=>`<a href="${l[1]}" target="_blank" rel="noopener noreferrer">${esc(l[0])} ↗</a>`).join('')}</article>`).join('');
  $('#source-dialog').showModal();
 }
 // Each document owns one visualization; load only that page's controls.
 if($('#mechanism-track'))renderMechanism();
 if($('#industry-panel')||$('[data-industry-mount]'))renderIndustry();
 if($('#adoption-chart'))renderValue();
 if($('#sources-grid')){renderSources();if(win.location.hash.startsWith('#source-'))win.requestAnimationFrame(()=>doc.getElementById(win.location.hash.slice(1))?.scrollIntoView?.({block:'start'}));}
 if($('#occupation-search')){
 const groups=[...new Set(data.occupations.map(o=>o.group))].sort();
 for(const group of groups){const option=doc.createElement('option');option.value=group;option.textContent=`${group[0]} · ${groupNames[group[0]]}`;$('#occupation-group').append(option);}
 $('#occupation-legend').innerHTML=Object.entries(levels).map(([key,l])=>`<span class="legend-item"><i class="legend-dot" style="--dot:${l.color}"></i>${l.name}（${data.occupations.filter(o=>o.level===key).length} 种）</span>`).join('');
 renderPeople();renderComparison();
 }
 if($('#energy-chart')){
 $('#energy-toggles').innerHTML=`<span class="legend-item"><span style="border-top:2px solid #687c69;width:18px"></span>历史估计</span>`+series.map(s=>`<label><input type="checkbox" data-energy="${esc(s.key)}" checked><span class="line-key" style="--series:${s.color}"></span>${s.name}</label>`).join('');
 $('#energy-table').innerHTML=table(['年份','历史估计','基准','更快增长','更高效率','发展受阻'],data.energy.map(r=>[r.year,...['Historical',...series.map(s=>s.key)].map(k=>r[k]??'—')]));
 renderEnergy();
 }
 doc.addEventListener('click',event=>{
  const target=event.target.closest('[data-source],[data-mechanism],[data-industry],[data-category],[data-service],[data-perspective],[data-occupation],[data-add-compare],[data-remove-compare],button');if(!target)return;
  if(target.dataset.source)openSource(target.dataset.source);
  else if(target.dataset.mechanism){state.step=Number(target.dataset.mechanism);renderMechanism();$(`[data-mechanism="${state.step}"]`).focus({preventScroll:true});}
  else if(target.dataset.industry){state.industry=target.dataset.industry;renderIndustry();}
  else if(target.dataset.category){state.category=target.dataset.category;renderIndustry();}
  else if(target.dataset.service){state.serviceMetric=target.dataset.service;renderIndustry();}
  else if(target.dataset.perspective){state.perspective=target.dataset.perspective;renderPerspective();}
  else if(target.dataset.occupation){state.selected=target.dataset.occupation;renderPeople();}
  else if(target.dataset.addCompare){if(state.compare.length>=5){notify('最多比较 5 个职业，请先移除一个。');return;}if(!state.compare.includes(target.dataset.addCompare))state.compare.push(target.dataset.addCompare);renderComparison();renderDetail();}
  else if(target.dataset.removeCompare){state.compare=state.compare.filter(c=>c!==target.dataset.removeCompare);renderComparison();renderDetail();}
  else if(target.id==='deselect-occupation'){state.selected=null;renderPeople();}
  else if(target.id==='clear-filters'){state.query='';state.group='';state.visibleCount=12;state.selected='4132';$('#occupation-search').value='';$('#occupation-group').value='';renderPeople();}
  else if(target.id==='more-occupations'){state.visibleCount+=24;renderPeople();}
  else if(target.id==='clear-comparison'){state.compare=[];renderComparison();renderDetail();}
  else if(target.classList.contains('dialog-close'))$('#source-dialog').close();
  else if(target.classList.contains('menu-toggle')){const expanded=target.getAttribute('aria-expanded')==='true';target.setAttribute('aria-expanded',!expanded);$('#main-nav').classList.toggle('open',!expanded);}
 });
 doc.addEventListener('change',event=>{
  const t=event.target;
  if(t.id==='category-select'){state.category=t.value;renderIndustry();$('#category-select').focus({preventScroll:true});}
  else if(t.id==='agri-year'){state.year=Number(t.value);renderIndustry();$('#agri-year').focus({preventScroll:true});}
  else if(t.id==='agri-stage'){state.stage=t.value;renderIndustry();$('#agri-stage').focus({preventScroll:true});}
  else if(t.id==='agri-metric'){state.agriMetric=t.value;renderIndustry();$('#agri-metric').focus({preventScroll:true});}
  else if(t.id==='occupation-group'){state.group=t.value;state.visibleCount=12;renderPeople();}
  else if(t.dataset.energy){t.checked?state.enabled.add(t.dataset.energy):state.enabled.delete(t.dataset.energy);renderEnergy();}
 });
 $('#occupation-search')?.addEventListener('input',event=>{state.query=event.target.value;state.visibleCount=12;renderPeople();});
 $('#energy-year')?.addEventListener('input',event=>{state.energyYear=Number(event.target.value);renderEnergy();});
 doc.addEventListener('keydown',event=>{
  if((event.key==='Enter'||event.key===' ')&&event.target.matches('.scatter-hit')){event.preventDefault();event.target.dispatchEvent(new win.MouseEvent('click',{bubbles:true}));}
  if(event.target.matches('[data-industry]')&&['ArrowRight','ArrowLeft','Home','End'].includes(event.key)){
   event.preventDefault();const tabs=$$('[data-industry]'),idx=tabs.indexOf(event.target),next=event.key==='Home'?0:event.key==='End'?2:(idx+(event.key==='ArrowRight'?1:2))%3;tabs[next].click();tabs[next].focus();
  }
 });
 $('#source-dialog').addEventListener('click',event=>{if(event.target===$('#source-dialog')){const rect=event.target.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)event.target.close();}});
 $$('#main-nav a').forEach(a=>a.addEventListener('click',()=>{$('#main-nav').classList.remove('open');$('.menu-toggle').setAttribute('aria-expanded','false');}));
 let narrow=win.innerWidth<600;
 win.addEventListener('resize',()=>{const next=win.innerWidth<600;if(next!==narrow){narrow=next;if($('#scatter-chart'))renderPeople();if($('#industry-panel')||$('[data-industry-mount]'))renderIndustry();if($('#energy-chart'))renderEnergy();}});
 const explorer=initPeopleExplorer(doc,peopleData,renderPeople);
 doc.documentElement.dataset.ready='true';
 if(page!=='applications')initSectionNavigation(doc);
 return {state,renderPeople,renderIndustry,renderEnergy,explorer};
}
if(typeof document!=='undefined'){
 const legacyPage=location.hash.slice(1);
 if(document.body.dataset.page==='understand'&&['industries','value'].includes(legacyPage))location.replace(new URL(`./applications.html?view=${legacyApplicationView(legacyPage,new URL(location.href).searchParams.get('view'))}`,location.href));
 else if(document.body.dataset.page==='understand'&&['mechanism','applications','people','futures','sources'].includes(legacyPage))location.replace(new URL(`./${legacyPage}.html`,location.href));
 const loadData=path=>fetch(new URL(path,import.meta.url)).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();});
 if(document.body.dataset.page==='applications')initApp(document,{});
 else Promise.all([loadData('./data/datasets.json'),document.body.dataset.page==='people'?loadData('./data/people-insights.json'):null]).then(([data,peopleData])=>initApp(document,data,peopleData)).catch(error=>{
  console.error('Dataset load failed',error);document.querySelector('main').insertAdjacentHTML('afterbegin','<div class="load-error"><strong>数据暂时未能加载</strong><p>请刷新重试。静态数据可从 <a href="./src/data/datasets.json">这里</a>获取。</p></div>');
 });
}
