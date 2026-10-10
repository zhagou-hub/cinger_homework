import {escapeHTML as esc,fmt,signed,effectInterval} from './charts.js';
import {initSectionNavigation} from './section-navigation.js';

const GREEN='#3b9478',BLUE='#7d99bb',SAND='#bd9d70';
const svg=(label,body,w=780,h=360)=>`<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>${body}</svg>`;
const txt=(x,y,text,cl='col-svg-label',extra='')=>`<text x="${x}" y="${y}" class="${cl}" ${extra}>${esc(text)}</text>`;
const source=(id,label)=>`<button class="source-link" data-source="${id}">${label} ↗</button>`;
const key=(items)=>`<div class="column-key">${items.map(([color,text])=>`<span><i style="--key:${color}"></i>${text}</span>`).join('')}</div>`;
const frame=(chart,aside,analysis,foot,note='')=>`<div class="column-layout"><article class="column-chart">${chart}<p class="column-analysis">${analysis}</p><div class="column-foot">${foot}</div>${note?`<p class="chart-note">${note}</p>`:''}</article><aside class="column-aside">${aside}</aside></div>`;
const detail=(kicker,title,body)=>`<p class="detail-kicker">${kicker}</p><h3>${title}</h3>${body}`;
const bar=(id,label,value,max=100,color=GREEN,selected=false,sub='')=>`<button class="col-bar" data-col-bar="${id}" aria-pressed="${selected}"><span class="col-bar-label">${label}${sub?`<small>${sub}</small>`:''}</span><span class="col-bar-track"><span class="col-bar-fill" style="--width:${value/max*100}%;--color:${color}"></span></span><strong>${value.toFixed(1)}</strong></button>`;

export function calculateScenario(input){
 const defaults={tasks:100,manual:12,coverage:60,assist:2,review:3,call:.5,wage:45};
 const limits={tasks:[0,2000],manual:[.5,120],coverage:[0,100],assist:[0,120],review:[0,120],call:[0,100],wage:[0,1000]};
 const p=Object.fromEntries(Object.entries(defaults).map(([k,v])=>[k,Math.max(limits[k][0],Math.min(limits[k][1],Number.isFinite(Number(input[k]))?Number(input[k]):v))]));
 const aiTasks=p.tasks*p.coverage/100,manualTasks=p.tasks-aiTasks;
 const baselineMinutes=p.tasks*p.manual,manualMinutes=manualTasks*p.manual,assistMinutes=aiTasks*p.assist,reviewMinutes=aiTasks*p.review;
 const aidedMinutes=manualMinutes+assistMinutes+reviewMinutes,baselineCost=baselineMinutes/60*p.wage,laborCost=aidedMinutes/60*p.wage,apiCost=aiTasks*p.call,aidedCost=laborCost+apiCost;
 return {params:p,aiTasks,manualTasks,baselineMinutes,manualMinutes,assistMinutes,reviewMinutes,aidedMinutes,baselineCost,laborCost,apiCost,aidedCost,savedHours:(baselineMinutes-aidedMinutes)/60,savedCost:baselineCost-aidedCost};
}
export const confidenceColor=c=>c>=90?'#316ea5':c>=70?'#68b3bf':c>=50?'#ddc55e':'#d49154';

export function initColumns(doc,data,insights,protein){
 if(!doc.body.hasAttribute('data-columns'))return null;
 const $=s=>doc.querySelector(s),$$=s=>[...doc.querySelectorAll(s)],win=doc.defaultView,page=doc.body.dataset.page;
 const state={view:'',factor:'worker',criterion:'efficiency',benchmark:'SWE-bench',step:0,division:'service',divisionMode:'compare',divisionStep:2,conditions:[true,true,true,true],efficiency:'resolutions_per_hour',quality:'resolution_rate',barrierGroup:'all',barrier:'expertise',yaw:25,pitch:-15,residue:1};
 const factors=[
  {id:'worker',name:'劳动者',before:['经验与手工操作','查找资料、识别异常、执行任务'],after:['知识辅助与结果核验','借助建议完成任务，同时承担判断'],title:'人的工作从操作扩展到判断',analysis:'知识建议可以辅助劳动者处理任务。任务如何分配、结果如何核验，取决于具体场景与人的能力。',example:'客服接收AI建议，再决定回答内容。'},
  {id:'tools',name:'生产工具',before:['固定规则与专用设备','按既定规则执行操作'],after:['识别、生成与辅助决策','从样本中学习模式，支持更多任务'],title:'工具增加了处理信息的能力',analysis:'模型可以识别图像、生成内容或提供决策线索。需要把这些能力接入工作流程，才能评价生产效果。',example:'质检模型寻找异常，人员进行现场复核。'},
  {id:'objects',name:'生产对象',before:['物料与已有资料','处理实物及人工整理的信息'],after:['实物、数据与知识','设备记录和知识内容参与分析'],title:'数据与知识成为重要输入',analysis:'设备状态、知识文档和图像样本为模型提供输入。数据质量、使用授权和反馈，影响其可用程度。',example:'设备记录支持异常识别，维修记录又成为反馈。'}
 ];
 function renderFactors(){
  const selected=factors.find(f=>f.id===state.factor);
  const chart=`<div class="factor-table"><div class="factor-head">点击要素</div><div class="factor-head">传统方式 · 示意</div><div class="factor-head">AI参与 · 示意</div>${factors.map(f=>`<button data-factor="${f.id}" aria-pressed="${f.id===state.factor}">${f.name}</button><div class="${f.id===state.factor?'':'factor-dim'}"><strong>${f.before[0]}</strong><small>${f.before[1]}</small></div><div class="factor-ai ${f.id===state.factor?'':'factor-dim'}"><strong>${f.after[0]}</strong><small>${f.after[1]}</small></div>`).join('')}</div>${key([['#eef5ea','可点击的要素对照'],[GREEN,'当前选择']])}`;
  $('#factor-view').innerHTML=frame(chart,detail('当前要素',selected.name,`<h3>${selected.title}</h3><p>${selected.analysis}</p><hr><p>${selected.example}</p>`),'“新”体现在工具能力、任务分工和知识使用方式的变化。点击各要素，观察技术怎样进入生产过程。',source('S01,S02','概念依据与政策背景'),'对照图为编辑性示意，不表示所有企业已经完成同样的转型。');
 }
 const criteria=[{id:'efficiency',name:'效率',color:GREEN,x:155,y:135,question:'同样时间，是否能完成更多工作？',indicators:'每小时产出、处理时长、资源消耗',example:'客服研究：每小时解决问题数与处理时长。',source:'S04'}, {id:'quality',name:'质量',color:BLUE,x:390,y:135,question:'结果是否更准确、可靠或令人满意？',indicators:'解决率、误差、可靠性、满意度',example:'客服研究：问题解决率与净推荐值需要单独检验。',source:'S04'}, {id:'innovation',name:'创新',color:SAND,x:625,y:135,question:'是否打开新的研究与应用方法？',indicators:'新能力、可验证的新方法与新成果',example:'蛋白质结构预测：支持研究者探索结构线索。',source:'S15'}];
 function renderCriteria(){
  const item=criteria.find(c=>c.id===state.criterion);
  const body=txt(390,34,'从任务变化走向结果检验','col-svg-title','text-anchor="middle"')+`<path d="M390 52V70H155V94M390 70V94M390 70H625V94" fill="none" stroke="#bfd0bb" stroke-width="2"/>`+criteria.map(c=>`<g class="col-node ${c.id===state.criterion?'selected':''}" data-criterion="${c.id}" role="button" tabindex="0" aria-label="查看${c.name}评价方向"><rect x="${c.x-90}" y="95" width="180" height="90" rx="7" fill="${c.id===state.criterion?c.color:'#eff4e9'}" stroke="#d6e2ce"/>${txt(c.x,131,c.name,'col-svg-title',`text-anchor="middle" style="fill:${c.id===state.criterion?'#fff':'#345d42'}"`)}${txt(c.x,160,c.id==='efficiency'?'时间与产出':c.id==='quality'?'结果与可靠性':'新方法与新能力','col-svg-small',`text-anchor="middle" style="fill:${c.id===state.criterion?'#fff':'#82947c'}"`)}</g>`).join('')+txt(390,230,'观察任务 → 选择指标 → 保留不确定性 → 判断适用条件','col-svg-label','text-anchor="middle"')+txt(390,275,'点击分支查看评价依据','col-svg-small','text-anchor="middle"');
  $('#criteria-view').innerHTML=frame(`<div class="column-canvas">${svg('效率、质量与创新的评价框架',body,780,310).replace('role="img"','role="group"')}</div>`,detail('当前评价方向',item.name,`<h3>${item.question}</h3><p>${item.indicators}</p><hr><p>${item.example}</p><a class="source-link" href="./sources.html#source-${item.source}">查看对应研究来源 ↗</a>`),'三个方向需要分别验证：速度变化、质量变化和创新成果使用不同证据。选择指标后，再判断结果能否支持结论。',source(item.source,'查看对应案例来源'),'关系线为评价框架，不编码占比或贡献。');
 }
 function renderCapability(){
  const item=insights.capability.find(c=>c.id===state.benchmark);
  const chart='<div class="col-bar-axis"><span>0</span><span>20</span><span>40</span><span>60</span><span>80 pp</span></div><div class="col-bars">'+insights.capability.map((c,i)=>bar(c.id,c.name,c.gain,80,[GREEN,BLUE,SAND][i],c.id===state.benchmark,c.id)).join('')+'</div>';
  $('#capability-view').innerHTML=frame(chart,detail('当前测试 · '+esc(item.id),item.name,`<div class="column-stat">+${item.gain}<small>个百分点</small></div><p>${item.description}</p><hr><p>增量不等于当前得分；不同测试的题目、难度和评估方法不同。</p>`),'2025 年报告摘要披露三项测试在 2023→2024 的明显进步。图中比较的是成绩增量，不能用柱长判断哪一类任务更容易。',source('S13','Stanford AI Index · 2025 摘要'),'这里只展示已披露的历史增量，不补造完整年度曲线，也不称为当前最新成绩。');
 }
 function renderFlow(){
  if(!$('#mechanism-visual'))return;
  const stages=[['设备信号','数据'],['异常线索','模型'],['现场核验','人'],['维护安排','流程'],['运行结果','结果'],['记录与改进','反馈']];
  const body=txt(390,27,'预测维护 · 从状态信号到实际行动','col-svg-label','text-anchor="middle"')+stages.map(([label,role],i)=>{const x=25+i*126,active=i===state.step;return `${i<5?`<path d="M${x+102} 115H${x+123}" stroke="#bfd0bb" stroke-width="2" marker-end="url(#flow-arrow)"/>`:''}<g class="col-node ${active?'selected':''}" data-mechanism="${i}" role="button" tabindex="0" aria-label="${label}"><rect x="${x}" y="65" width="102" height="104" rx="6" fill="${active?'#d9eee3':'#f4f7ee'}" stroke="#d5e2cc"/>${txt(x+51,88,role,'col-svg-small','text-anchor="middle"')}${txt(x+51,120,label,'col-svg-label','text-anchor="middle"')}${txt(x+51,147,'0'+(i+1),'col-svg-number','text-anchor="middle"')}</g>`;}).join('')+`<path d="M707 181V205H77V181" fill="none" stroke="#9eba9b" stroke-width="1.5" stroke-dasharray="5 5"/>`+txt(390,232,'把核验与维修结果带回下一轮 · 定性反馈关系','col-svg-small','text-anchor="middle"');
  $('#mechanism-visual').innerHTML=svg('预测维护的六个相连环节','<defs><marker id="flow-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#bfd0bb"/></marker></defs>'+body,780,260).replace('role="img"','role="group"');
 }
 const divisionCases={service:{name:'客服处理',stages:['接收问题','检索资料','形成答复','核验内容','沟通解决'],human:['理解需求','查找文档','组织语言','核对信息','处理反馈'],aided:['理解需求','检索建议','答复建议','核验与修改','沟通与判断'],roles:['human','ai','ai','joint','human'],details:['人理解客户的真实需求与情境。','AI可提供相关文档线索；是否适用仍需核对。','AI生成答复建议，人决定怎样使用。','人核查事实、表达与业务要求，必要时修改。','人负责最终沟通、复杂情况及后续反馈。'],source:'S04'},maintenance:{name:'设备维护',stages:['采集状态','寻找异常','核验原因','安排维护','检查结果'],human:['记录信号','经验排查','现场检查','安排维修','记录反馈'],aided:['传感器记录','模型提示','现场核验','人员排程','记录反馈'],roles:['joint','ai','human','human','joint'],details:['传感器记录状态，人员维护设备与数据质量。','模型提供异常线索，而非直接决定停线。','工程人员结合现场经验检查原因。','人员结合生产排程、备件和维修资源安排行动。','人员检验实际结果，记录误报和维修反馈。'],source:'S06'}};
 function renderDivision(){
  const c=divisionCases[state.division];
  const lane=(aided)=>`<div class="division-lane ${state.divisionMode!=='compare'&&state.divisionMode!==(aided?'ai':'manual')?'division-dim':''}"><span class="lane-name">${aided?'AI辅助方式':'传统方式'}</span>${(aided?c.aided:c.human).map((s,i)=>`<button class="division-cell ${aided?c.roles[i]:''} ${i===state.divisionStep?'selected':''}" data-division-step="${i}">${s}<small>${!aided||c.roles[i]==='human'?'人负责':c.roles[i]==='ai'?'AI建议':'人机配合'}</small></button>`).join('')}</div>`;
  const chart=`<div class="column-controls"><label>场景<select id="division-case"><option value="service" ${state.division==='service'?'selected':''}>客服处理</option><option value="maintenance" ${state.division==='maintenance'?'selected':''}>设备维护</option></select></label>${[['compare','对照'],['manual','传统'],['ai','AI辅助']].map(([id,name])=>`<button data-division-mode="${id}" aria-pressed="${state.divisionMode===id}">${name}</button>`).join('')}</div><div class="division-board"><div class="division-labels"><span>任务流程 →</span>${c.stages.map(s=>`<span>${s}</span>`).join('')}</div>${lane(false)}${lane(true)}</div>${key([['#f1f5eb','人负责'],['#d9eee6','AI提供建议'],['#e8e9f4','人机配合']])}`;
  $('#division-view').innerHTML=frame(chart,detail('当前步骤 · '+c.name,c.stages[state.divisionStep],`<p>${c.details[state.divisionStep]}</p><hr><p>图中格子表示步骤与分工，不表示工时或自动化比例。</p>`),'分工变化发生在具体步骤中。检索与生成可以得到辅助，理解情境、核验结果和承担责任仍需要明确负责人。',source(c.source,'案例依据'),'根据研究或企业描述抽象的工作方式示意，并非企业原始工时记录。');
 }
 function renderBottleneck(){
  const names=['数据可用','模型经过验证','人员能够复核','行动能够执行'],labels=['输入数据','模型分析','人工核验','生产行动'],first=state.conditions.indexOf(false),ready=first===-1;
  const body=labels.map((label,i)=>{const x=35+i*190,blocked=i>=first&&!ready;return `${i<3?`<path d="M${x+145} 150H${x+183}" stroke="${blocked?'#d8b18a':'#aac7aa'}" stroke-width="2" ${blocked?'stroke-dasharray="4 5"':''}/>`:''}<rect x="${x}" y="88" width="145" height="117" rx="7" fill="${blocked?'#faf0e5':'#e8f3e4'}" stroke="${!state.conditions[i]?'#c89258':'#d1dfc8'}"/>${txt(x+72,120,'0'+(i+1),'col-svg-number','text-anchor="middle"')}${txt(x+72,151,label,'col-svg-title','text-anchor="middle"')}${txt(x+72,180,!state.conditions[i]?'条件未满足':blocked?'受上游影响':'条件已勾选','col-svg-small','text-anchor="middle"')}`;}).join('')+txt(390,260,'配套条件共同影响链条 · 点击右侧条件进行探索','col-svg-small','text-anchor="middle"');
  $('#bottleneck-view').innerHTML=frame(`<div class="column-canvas">${svg('数据、模型、核验与行动的条件链条',body,780,320)}</div><div class="bottleneck-status ${ready?'':'blocked'}">${ready?'四项条件均已勾选：可以继续用现场结果验证效果。':`当前首先缺少“${names[first]}”条件，后续环节的结果需要重新核验。`}</div>`,detail('调整配套条件','检查链条是否完整',`<div class="condition-checks">${names.map((name,i)=>`<label><input type="checkbox" data-condition="${i}" ${state.conditions[i]?'checked':''}>${name}</label>`).join('')}</div><hr><p>勾选反映你设定的条件；没有计算准确率或生产率。</p>`),'数据、模型、人员与组织相互连接。取消某个条件，观察影响怎样沿流程传递，再到产业现场用实际指标检验。',source('S01,S02','概念与应用条件'),'此图用于说明依赖关系，不是对某家企业的诊断或收益预测。');
 }
 const metrics={
  resolutions_per_hour:{name:'每小时解决问题数',unit:'件 / 小时',factor:1,digits:3,meaning:'估计为正，近似区间未跨零，支持研究岗位单位时间产出的改善。'},
  average_handle_time:{name:'平均处理时长',unit:'分钟',factor:1,digits:3,meaning:'估计为负，近似区间未跨零，表示一个问题的处理时间减少。'},
  chats_per_hour:{name:'每小时聊天数',unit:'次 / 小时',factor:1,digits:3,meaning:'处理的对话数量增加；数量变化需要与解决率一起看。'},
  resolution_rate:{name:'问题解决率',unit:'个百分点',factor:100,digits:2,meaning:'近似区间跨零，不能据此声称解决率明确提高。'},
  net_promoter_score:{name:'净推荐值 NPS',unit:'NPS 分',factor:1,digits:3,meaning:'近似区间跨零，不能据此声称净推荐值明确改变。'}
 };
 function renderMetric(mode){
  const ids=mode==='efficiency'?['resolutions_per_hour','average_handle_time','chats_per_hour']:['resolution_rate','net_promoter_score'];
  const selected=state[mode],row=data.service.find(r=>r.metric===selected),meta=metrics[selected],effect=row.effect*meta.factor,se=row.standard_error*meta.factor,interval=effectInterval(effect,se,meta.unit),uncertain=interval.lo<=0&&interval.hi>=0;
  const choices=`<div class="col-metric-options">${ids.map(id=>{const r=data.service.find(r=>r.metric===id),m=metrics[id];return `<button data-value-metric="${id}" data-metric-mode="${mode}" aria-pressed="${id===selected}">${m.name}<strong>${signed(r.effect*m.factor,m.digits)}</strong><small>${m.unit}</small></button>`;}).join('')}</div>`;
  const chart=choices+`<div class="col-metric-caption"><span>${meta.name} · ${meta.unit}</span><span>回归效果与正态近似 95% 区间</span></div>${interval.html}${key([[GREEN,'点：估计效果'],['#b9ccad','横线：近似区间']])}<p class="chart-note">竖虚线为零效应；区间 [${fmt(interval.lo,3)}, ${fmt(interval.hi,3)}]。每个指标使用自己的单位与坐标轴。</p>`;
  const analysis=mode==='efficiency'?'这项客服研究同时观察处理速度和单位时间产出。三个效率指标的区间均未跨零，但它们的单位不同，应逐项解释。':'这两个质量指标的近似区间均跨零。效率方面的改善证据更明确；现有估计尚不足以支持所有质量指标同步改善。';
  $('#'+mode+'-view').innerHTML=frame(chart,detail('当前研究指标',meta.name,`<div class="column-stat">${signed(effect,meta.digits)}<small>${meta.unit}</small></div><p>${meta.meaning}</p><hr><p>${uncertain?'区间跨零 · 存在方向不确定性':'区间未跨零 · 有方向性证据'}</p><p>标准误：${fmt(se,4)}<br>样本：特定企业的客服岗位</p>`),analysis,source('S04','QJE · 作者论文与计算方法'),'数值是回归估计，不是上线前后原始均值。区间按系数 ± 1.96 × 标准误计算；研究不提供全国生产率估计。');
 }
 function updateProtein(){
  if(!protein||!$('#protein-draw'))return;
  const points=protein.points,mean=k=>points.reduce((s,p)=>s+p[k],0)/points.length,center={x:mean('x'),y:mean('y'),z:mean('z')};
  const radius=Math.max(...points.map(p=>Math.hypot(p.x-center.x,p.y-center.y,p.z-center.z))),scale=145/radius,yaw=state.yaw*Math.PI/180,pitch=state.pitch*Math.PI/180;
  const projected=points.map(p=>{const x=p.x-center.x,y=p.y-center.y,z=p.z-center.z,rx=x*Math.cos(yaw)+z*Math.sin(yaw),rz=-x*Math.sin(yaw)+z*Math.cos(yaw),ry=y*Math.cos(pitch)-rz*Math.sin(pitch),depth=y*Math.sin(pitch)+rz*Math.cos(pitch);return {...p,sx:390+rx*scale,sy:200-ry*scale,depth};});
  const segments=projected.slice(1).map((p,i)=>({a:projected[i],b:p,depth:(p.depth+projected[i].depth)/2})).sort((a,b)=>a.depth-b.depth);
  let body=txt(18,25,'Cα 主链 · 正交投影','col-svg-small')+txt(760,25,protein.id+' · v'+protein.version,'col-svg-small','text-anchor="end"');
  body+=segments.map(({a,b})=>`<line x1="${a.sx}" y1="${a.sy}" x2="${b.sx}" y2="${b.sy}" stroke="${confidenceColor((a.confidence+b.confidence)/2)}" stroke-width="4" stroke-linecap="round" opacity=".9"/>`).join('');
  body+=projected.map(p=>`<circle class="protein-residue" data-residue="${p.residue}" cx="${p.sx}" cy="${p.sy}" r="${state.residue===p.residue?6:2.2}" fill="${confidenceColor(p.confidence)}" tabindex="${state.residue===p.residue?'0':'-1'}" role="button" aria-label="残基 ${p.residue} ${p.name}，pLDDT ${p.confidence}"><title>残基 ${p.residue} · ${p.name} · pLDDT ${p.confidence}</title></circle>`).join('');
  const selected=projected.find(p=>p.residue===state.residue);
  body+=`<circle cx="${selected.sx}" cy="${selected.sy}" r="11" fill="none" stroke="#254533" stroke-width="1.5"/>`+txt(18,385,'选择残基或拖动角度控件查看结构','col-svg-small');
  $('#protein-draw').innerHTML=svg('AlphaFold血红蛋白α亚基预测结构，可选择残基',body,780,400).replace('role="img"','role="group"');
  $('#protein-detail').innerHTML=detail('当前残基 · '+protein.accession,`#${selected.residue} · ${selected.name}`,`<div class="column-stat">${fmt(selected.confidence,1)}<small>pLDDT</small></div><p>位置：${fmt(selected.x,1)}, ${fmt(selected.y,1)}, ${fmt(selected.z,1)} Å</p><p>pLDDT 为局部预测置信度评分，0–100；数值高通常意味着局部结构更可信。</p><hr><p>${protein.name}<br>${points.length} 个 Cα 点 · 模型 v${protein.version}</p>`);
  $('#protein-yaw-output').textContent=state.yaw+'°';$('#protein-pitch-output').textContent=state.pitch+'°';$('#protein-residue-output').textContent=state.residue+' / '+points.length;
 }
 function renderInnovation(){
  const groups=[{name:'≥90',test:c=>c>=90,color:'#316ea5'},{name:'70–90',test:c=>c>=70&&c<90,color:'#68b3bf'},{name:'50–70',test:c=>c>=50&&c<70,color:'#ddc55e'},{name:'<50',test:c=>c<50,color:'#d49154'}];
  const chart=`<div class="protein-toolbar"><span>人血红蛋白 α 亚基 · ${protein.accession}</span><button class="source-link" data-protein-reset>重置视角 ↺</button></div><div class="protein-canvas" id="protein-draw"></div><div class="protein-sliders"><label>左右旋转 <output id="protein-yaw-output"></output><input type="range" id="protein-yaw" min="-180" max="180" step="1" value="${state.yaw}" aria-label="左右旋转蛋白质结构"></label><label>上下旋转 <output id="protein-pitch-output"></output><input type="range" id="protein-pitch" min="-90" max="90" step="1" value="${state.pitch}" aria-label="上下旋转蛋白质结构"></label><label style="grid-column:1/-1">选择残基 <output id="protein-residue-output"></output><input type="range" id="protein-residue" min="1" max="${protein.points.length}" step="1" value="1" aria-label="蛋白质残基编号"></label></div>${key(groups.map(g=>[g.color,'pLDDT '+g.name]))}`;
  const aside=`<div id="protein-detail"></div><h3 style="font-size:12px">本模型置信度分布</h3><div class="confidence-bars">${groups.map(g=>{const count=protein.points.filter(p=>g.test(p.confidence)).length;return `<div class="confidence-row"><span>${g.name}</span><span class="col-bar-track" style="height:8px"><span class="col-bar-fill" style="--width:${count/protein.points.length*100}%;--color:${g.color}"></span></span><strong>${count}</strong></div>`;}).join('')}</div><p>颜色呈现预测置信度，旋转只改变观察角度。</p>`;
  $('#innovation-view').innerHTML=frame(chart,aside,'AI可以把序列转为可检查的结构线索，辅助研究者提出与检验假设。这里展示真实预测模型的主链；科学价值还需要结合实验和具体研究问题验证。',source('S15','AlphaFold DB · 模型与数据来源'),'仅绘制模型 Cα 主链，不运行折叠模拟。预测结构和置信度不能当作实验测定结果或疾病诊断。');
  updateProtein();
 }
 function renderBarriers(){
  const group=insights.barriers.groups.find(g=>g.id===state.barrierGroup),items=[...insights.barriers.items].sort((a,b)=>b[group.id]-a[group.id]),item=items.find(i=>i.id===state.barrier);
  const chart=`<div class="column-controls"><label>企业规模<select id="barrier-group">${insights.barriers.groups.map(g=>`<option value="${g.id}" ${g.id===group.id?'selected':''}>${g.name} · ${g.definition}</option>`).join('')}</select></label></div><div class="col-bar-axis"><span>0</span><span>25</span><span>50</span><span>75</span><span>100%</span></div><div class="col-bars">${items.map(i=>bar(i.id,i.name,i[group.id],100,GREEN,i.id===state.barrier)).join('')}</div>`;
  $('#barriers-view').innerHTML=frame(chart,detail('当前原因 · '+group.name,item.name,`<div class="column-stat">${item[group.id].toFixed(1)}<small>%</small></div><p>分母：该规模中曾考虑采用、但尚未使用AI的受访企业。</p><hr><p>可以检查的配套条件：</p><p>${item.action}</p>`),`在<strong>${group.name}</strong>中，“${items[0].name}”被提及最多，为 ${items[0][group.id].toFixed(1)}%。规模切换后排序可能变化；多种原因可以同时存在。`,source('S14','Eurostat · 2026 报告，Table 7'),'欧盟企业 2025 年调查，多选原因，不加总为 100%。该子样本的障碍比例不是全体企业未采用率，也不代表中国企业。');
 }
 const scenarioFields=[['tasks','每日任务量',0,2000,1,'件；比较两种方案的同等任务量'],['manual','传统处理时间',.5,120,.5,'分钟 / 件'],['coverage','AI辅助覆盖比例',0,100,1,'% 任务采用辅助，其余维持传统方式'],['assist','辅助操作时间',0,120,.5,'分钟 / 辅助任务；按人工占用时间计'],['review','人工审核时间',0,120,.5,'分钟 / 辅助任务'],['call','每次调用费用',0,100,.1,'元 / 辅助任务；每件按一次调用计'],['wage','人工时间单价',0,1000,1,'元 / 小时；自行设定']];
 let scenarioInput={tasks:100,manual:12,coverage:60,assist:2,review:3,call:.5,wage:45};
 function updateScenario(){
  const r=calculateScenario(scenarioInput),p=r.params;
  const stack=(label,parts,total,max,unit)=>`<div class="scenario-bar-row"><span>${label}</span><span class="scenario-bar-stack">${parts.map(([value,color])=>`<i style="--width:${max?value/max*100:0}%;--color:${color}" title="${fmt(value,2)} ${unit}"></i>`).join('')}</span><strong>${fmt(total,1)} ${unit}</strong></div>`;
  const timeMax=Math.max(r.baselineMinutes,r.aidedMinutes),costMax=Math.max(r.baselineCost,r.aidedCost);
  $('#scenario-results').innerHTML=`<div class="scenario-summary"><div class="scenario-result ${r.savedHours<0?'loss':''}"><small>${r.savedHours>=0?'节省的人工时间':'增加的人工时间'}</small><strong>${fmt(Math.abs(r.savedHours),2)} 小时</strong></div><div class="scenario-result ${r.savedCost<0?'loss':''}"><small>${r.savedCost>=0?'减少的每日费用':'增加的每日费用'}</small><strong>${fmt(Math.abs(r.savedCost),2)} 元</strong></div></div><h3 class="scenario-chart-title">人工占用时间 · 两方案共用刻度</h3>${stack('传统方式',[[r.baselineMinutes,SAND]],r.baselineMinutes,timeMax,'分')}${stack('AI辅助',[[r.manualMinutes,SAND],[r.assistMinutes,BLUE],[r.reviewMinutes,GREEN]],r.aidedMinutes,timeMax,'分')}${key([[SAND,'传统任务'],[BLUE,'辅助操作'],[GREEN,'人工审核']])}<h3 class="scenario-chart-title">费用 · 两方案共用刻度</h3>${stack('传统方式',[[r.baselineCost,GREEN]],r.baselineCost,costMax,'元')}${stack('AI辅助',[[r.laborCost,GREEN],[r.apiCost,SAND]],r.aidedCost,costMax,'元')}${key([[GREEN,'人工时间费用'],[SAND,'调用费用']])}<p class="column-analysis">在当前设定下，${fmt(r.aiTasks,1)} 件任务采用辅助，${fmt(r.manualTasks,1)} 件维持传统处理。审核时间与操作时间共同影响结果；${r.savedHours>0?'该方案减少人工占用时间':r.savedHours<0?'该方案增加人工占用时间':'两方案人工占用时间相同'}${r.savedCost>0?'，核算费用降低。':r.savedCost<0?'，核算费用增加。':'，核算费用相同。'}</p><div class="scenario-formula">传统时间 = 任务量 × 传统处理时间<br>辅助时间 = 传统任务时间 ＋ 辅助任务量 ×（操作时间 ＋ 审核时间）<br>费用 = 人工时间 ÷ 60 × 时间单价 ＋ 辅助任务量 × 调用费用</div>`;
  $('#scenario-assumptions').textContent=`任务量 ${p.tasks} 件 · 辅助覆盖 ${p.coverage}% · 传统 ${p.manual} 分钟 / 件`;
 }
 function renderScenario(){
  $('#scenario-view').innerHTML=`<div class="scenario-layout"><article class="column-chart"><div class="col-metric-caption"><span id="scenario-assumptions"></span><span>示例参数均可修改</span></div><div id="scenario-results" aria-live="polite"></div><p class="chart-note">这是按自行设置参数计算的情景。未计系统建设、培训和固定费用；未建立并发或排队模型，也未测量质量变化。</p></article><aside class="scenario-controls"><h3>设定你的协作方案</h3><div class="scenario-presets"><button data-scenario-preset="cautious">谨慎辅助</button><button data-scenario-preset="normal">常规协作</button><button data-scenario-preset="review">重审核</button><button data-scenario-preset="reset">恢复初始</button></div>${scenarioFields.map(([id,label,min,max,step,unit])=>`<div class="scenario-input"><label for="scenario-${id}">${label}</label><input type="number" id="scenario-${id}" data-scenario="${id}" value="${scenarioInput[id]}" min="${min}" max="${max}" step="${step}"><small>${unit}</small></div>`).join('')}<p class="chart-note" id="scenario-validation" role="status"></p><p class="chart-note">预设为演示假设，不取自某个企业。</p></aside></div>`;
  updateScenario();
 }
 function renderIndustryContext(){
  const id=$('.industry-tabs [aria-selected=true]')?.dataset.industry||'manufacturing';
  const cases={manufacturing:{name:'工业质检：把异常变成检查线索',sub:'从产品图像到方法评估，观察不同物品类别的适用性。',stages:[['产品图像','现场采集'],['异常识别','模型分析'],['人员复核','质量判断'],['记录反馈','持续改进']],focus:'图表读法',text:'行表示物品，列表示方法。颜色越深，像素级 PR-AUC 越高；点击类别查看方法排序。'},agriculture:{name:'农业灌溉：从监测到管理判断',sub:'比较两个田块在同年同阶段的水分状态，保留差异方向。',stages:[['田块监测','水分状态'],['系统分析','监测与建议'],['灌溉管理','人员与设备'],['田间观察','效果比较']],focus:'图表读法',text:'点表示田块观测，WDI误差线为标准差。WDI较低表示水分胁迫较小，NDVI采用独立刻度。'},service:{name:'知识服务：把知识建议接入工作',sub:'观察处理速度、处理量与质量指标，分别核验效果。',stages:[['客户问题','理解需求'],['知识建议','检索与生成'],['核验答复','人员负责'],['服务结果','效率与质量']],focus:'图表读法',text:'点表示回归估计，横线表示近似95%区间。区间是否跨零，会改变我们能支持的结论。'}};
  const c=cases[id];
  $('#industry-context').innerHTML=`<div class="industry-context"><article class="industry-context-main"><h2>${c.name}</h2><p>${c.sub}</p><div class="industry-path">${c.stages.map(([title,sub],i)=>`<div><span>0${i+1}</span><strong>${title}</strong><small>${sub}</small></div>`).join('')}</div></article><aside class="column-aside"><p class="detail-kicker">任务流程 · 定性示意</p><h3>${c.focus}</h3><p>${c.text}</p></aside></div>`;
 }
 function showView(id,updateURL=true){
  if(!$$('[data-column-view]').some(t=>t.dataset.columnView===id))return;
  state.view=id;
  $$('[data-column-view]').forEach(t=>{const active=t.dataset.columnView===id;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;});
  $$('[data-column-panel]').forEach(p=>p.hidden=p.dataset.columnPanel!==id);
  if(updateURL){const url=new URL(win.location.href);url.searchParams.set('view',id);win.history.replaceState(null,'',url);}
 }
 const renderers={understand:()=>{renderFactors();renderCriteria();renderCapability();},mechanism:()=>{renderFlow();renderDivision();renderBottleneck();},value:()=>{renderMetric('efficiency');renderMetric('quality');renderInnovation();},futures:()=>{renderBarriers();renderScenario();},industries:()=>{if($('#industry-context'))renderIndustryContext();}};
 renderers[page]?.();
 const requested=new URL(win.location.href).searchParams.get('view');
 if(doc.body.dataset.scrollSections==='true'){
  $$('[data-column-panel]').forEach(p=>p.hidden=false);
 }else if(page==='industries'){
  const observer=new win.MutationObserver(()=>renderIndustryContext());observer.observe($('#industry-panel'),{childList:true});
  if(requested&&['manufacturing','agriculture','service'].includes(requested)){
   const selectRequested=()=>{if($('#industry-panel').childNodes.length){$(`[data-industry="${requested}"]`).click();return true;}return false;};
   if(!selectRequested()){const initial=new win.MutationObserver(()=>{if(selectRequested())initial.disconnect();});initial.observe($('#industry-panel'),{childList:true});}
  }
 }else showView(requested||$('[data-column-view]')?.dataset.columnView,false);
 doc.addEventListener('click',event=>{
  const t=event.target.closest('[data-column-view],[data-factor],[data-criterion],[data-col-bar],[data-mechanism],[data-division-step],[data-division-mode],[data-value-metric],[data-residue],[data-protein-reset],[data-scenario-preset],[data-industry]');if(!t)return;
  if(t.dataset.columnView)showView(t.dataset.columnView);
  else if(t.dataset.factor){state.factor=t.dataset.factor;renderFactors();$(`[data-factor="${state.factor}"]`).focus({preventScroll:true});}
  else if(t.dataset.criterion){state.criterion=t.dataset.criterion;renderCriteria();$(`[data-criterion="${state.criterion}"]`).focus({preventScroll:true});}
  else if(t.dataset.colBar){if(page==='understand'){state.benchmark=t.dataset.colBar;renderCapability();}else if(page==='futures'){state.barrier=t.dataset.colBar;renderBarriers();}$(`[data-col-bar="${t.dataset.colBar}"]`)?.focus({preventScroll:true});}
  else if(t.dataset.mechanism){state.step=Number(t.dataset.mechanism);renderFlow();$(`#mechanism-visual [data-mechanism="${state.step}"]`)?.focus({preventScroll:true});}
  else if(t.dataset.divisionStep){state.divisionStep=Number(t.dataset.divisionStep);renderDivision();$(`[data-division-step="${state.divisionStep}"]`)?.focus({preventScroll:true});}
  else if(t.dataset.divisionMode){state.divisionMode=t.dataset.divisionMode;renderDivision();$(`[data-division-mode="${state.divisionMode}"]`).focus({preventScroll:true});}
  else if(t.dataset.valueMetric){state[t.dataset.metricMode]=t.dataset.valueMetric;renderMetric(t.dataset.metricMode);$(`[data-value-metric="${t.dataset.valueMetric}"]`).focus({preventScroll:true});}
  else if(t.dataset.residue){state.residue=Number(t.dataset.residue);$('#protein-residue').value=state.residue;updateProtein();}
  else if(t.hasAttribute('data-protein-reset')){state.yaw=25;state.pitch=-15;state.residue=1;$('#protein-yaw').value=25;$('#protein-pitch').value=-15;$('#protein-residue').value=1;updateProtein();}
  else if(t.dataset.scenarioPreset){const presets={cautious:{coverage:25,assist:3,review:4},normal:{coverage:60,assist:2,review:3},review:{coverage:80,assist:2,review:12},reset:{tasks:100,manual:12,coverage:60,assist:2,review:3,call:.5,wage:45}};scenarioInput={...scenarioInput,...presets[t.dataset.scenarioPreset]};$$('[data-scenario]').forEach(i=>{i.value=scenarioInput[i.dataset.scenario];i.removeAttribute('aria-invalid');});$('#scenario-validation').textContent='';updateScenario();}
  else if(t.dataset.industry){renderIndustryContext();const url=new URL(win.location.href);url.searchParams.set('view',t.dataset.industry);win.history.replaceState(null,'',url);}
 });
 doc.addEventListener('change',event=>{
  const t=event.target;
  if(t.id==='division-case'){state.division=t.value;renderDivision();$('#division-case').focus({preventScroll:true});}
  else if(t.hasAttribute('data-condition')){state.conditions[Number(t.dataset.condition)]=t.checked;renderBottleneck();$(`[data-condition="${t.dataset.condition}"]`).focus({preventScroll:true});}
  else if(t.id==='barrier-group'){state.barrierGroup=t.value;renderBarriers();$('#barrier-group').focus({preventScroll:true});}
 });
 doc.addEventListener('input',event=>{
  const t=event.target;
  if(t.id==='protein-yaw'){state.yaw=Number(t.value);updateProtein();}
  else if(t.id==='protein-pitch'){state.pitch=Number(t.value);updateProtein();}
  else if(t.id==='protein-residue'){state.residue=Number(t.value);updateProtein();}
  else if(t.dataset.scenario){
   if(t.value===''||!t.validity.valid){t.setAttribute('aria-invalid','true');$('#scenario-validation').textContent='请按输入框范围填写有效数字，图表保留上一次有效设定。';return;}
   t.removeAttribute('aria-invalid');scenarioInput[t.dataset.scenario]=Number(t.value);if(!$$('[data-scenario][aria-invalid=true]').length)$('#scenario-validation').textContent='';updateScenario();
  }
 });
 doc.addEventListener('keydown',event=>{
  const t=event.target;
  if(t.matches('.col-node,.protein-residue')&&['Enter',' '].includes(event.key)){event.preventDefault();t.dispatchEvent(new win.MouseEvent('click',{bubbles:true}));}
  if(t.matches('[data-column-view]')&&['ArrowRight','ArrowLeft','Home','End'].includes(event.key)){
   event.preventDefault();const tabs=$$('[data-column-view]'),index=tabs.indexOf(t),next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length;tabs[next].click();tabs[next].focus({preventScroll:true});
  }
 });
 doc.documentElement.dataset.columnsReady='true';
 initSectionNavigation(doc);
 return {state,showView,updateProtein,updateScenario};
}

if(typeof document!=='undefined'&&document.body.hasAttribute('data-columns')){
 const read=async file=>{const response=await fetch(new URL(file,import.meta.url));if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.json();};
 Promise.all([read('./data/datasets.json'),read('./data/column-insights.json'),document.body.dataset.page==='value'?read('./data/protein-structure.json'):null]).then(([data,insights,protein])=>initColumns(document,data,insights,protein)).catch(error=>{
  console.error('Column data failed',error);document.querySelector('.section').insertAdjacentHTML('afterbegin','<p class="load-error" role="alert">可视化数据暂未加载，请刷新重试。</p>');
 });
}
