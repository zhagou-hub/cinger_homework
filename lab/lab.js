/* A local-first, task-oriented visual analysis workbench. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector), $$ = selector => [...document.querySelectorAll(selector)];
  const D=window.LabData,C=window.LabCharts,fmt=C.fmt;
  const escapeHTML = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state={dataset:null,cache:new Map(),config:{},selection:null,version:0,records:[],tab:'explore',compareTask:null};
  const taskNames={compare:'分组比较',distribution:'数值分布',relationship:'相关关系',trend:'时间趋势'};
  const field = key => state.dataset?.fields.find(f=>f.key===key)||{label:key||'',unit:''};
  const numberFields = () => state.dataset.fields.filter(f=>f.type==='number');
  const categories = () => state.dataset.fields.filter(f=>f.type==='category');
  const dateFields = () => state.dataset.fields.filter(f=>f.type==='date');
  const selectionOptions=(select,options,value)=>{select.replaceChildren(...options.map(([v,t])=>new Option(t,v)));if(options.some(([v])=>v===value))select.value=value;};
  function switchTab(name,focus=false,updateURL=true) {
    if(!['explore','encoding','color'].includes(name))return;
    state.tab=name;
    $$('.experiment-tabs [role=tab]').forEach(tab=>{const active=tab.dataset.tab===name;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus();});
    $$('.experiment-panel').forEach(p=>{p.hidden=p.id!==`panel-${name}`;});
    $('#data-zone').hidden=name==='color';
    if(updateURL)history.replaceState(null,'',`#${name}`);
    document.dispatchEvent(new CustomEvent('vis:labchange',{detail:{tab:name}}));
    if(state.dataset&&name==='encoding')renderComparison();
  }
  $$('.experiment-tabs [role=tab]').forEach((tab,i,tabs)=>{
    tab.addEventListener('click',()=>switchTab(tab.dataset.tab));
    tab.addEventListener('keydown',event=>{let next;if(['ArrowRight','ArrowDown'].includes(event.key))next=(i+1)%tabs.length;if(['ArrowLeft','ArrowUp'].includes(event.key))next=(i+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!=null){event.preventDefault();switchTab(tabs[next].dataset.tab,true);}});
  });
  window.addEventListener('hashchange',()=>switchTab(location.hash.slice(1)));
  $('#edit-analysis').addEventListener('click',()=>switchTab('explore',true));

  function configure(dataset) {
    state.dataset=dataset;state.selection=null;state.compareTask=null;
    const nums=numberFields(),cats=categories(),dates=dateFields();
    state.config={task:'compare',chart:'bar',group:cats[0]?.key||'__all',metric:nums[0]?.key||'',x:nums[0]?.key||'',y:nums[1]?.key||nums[0]?.key||'',date:dates[0]?.key||'',aggregate:'count',sort:'desc',bins:12,fit:true,smooth:true,normalized:false,filterField:'',filterValue:'',filters:[],...dataset.defaults};
    [['#group-field',cats,'group'],['#metric-field',nums,'metric'],['#x-field',nums,'x'],['#y-field',nums,'y'],['#date-field',dates,'date']].forEach(([selector,fields,key])=>selectionOptions($(selector),fields.map(f=>[f.key,`${f.label}${f.unit?` · ${f.unit}`:''}`]),state.config[key]));
    selectionOptions($('#filter-field'),[['','全部记录'],...cats.map(f=>[f.key,f.label])],'');
    selectionOptions($('#filter-value'),[['','全部类别']],'');$('#filter-value').disabled=true;
    [...$('#analysis-task').options].forEach(option=>{option.disabled=option.value==='relationship'?nums.length<2:option.value==='trend'?!(dates.length&&nums.length):option.value==='distribution'?!nums.length:false;});
    [...$('#aggregation').options].forEach(option=>{option.disabled=option.value!=='count'&&!nums.length;});
    $('#analysis-controls').disabled=false;
    ['#export-svg','#export-csv','#save-record','#check-mission','#load-mission'].forEach(s=>{$(s).disabled=false;});
    $('#dataset-source').textContent=dataset.source;
    $('#source-file').hidden=!dataset.file;if(dataset.file)$('#source-file').href=dataset.file;
    $$('.dataset-card').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dataset===dataset.id)));
    $('#mission-feedback').textContent='';renderMission();syncControls();render();
  }
  async function selectDataset(id) {
    const version=++state.version;state.loadingID=id;
    $('#analysis-controls').disabled=true;$('#data-status').textContent='正在准备实验数据…';$('#data-status').classList.remove('error');$('#retry-data').hidden=true;
    try {
      if(!state.cache.has(id))state.cache.set(id,D.loadBuiltin(id));
      const dataset=await state.cache.get(id);
      if(version!==state.version)return;
      configure(dataset);$('#data-status').textContent='';
    } catch(error) {
      if(version!==state.version)return;
      state.cache.delete(id);$('#data-status').textContent=error.message;$('#data-status').classList.add('error');$('#retry-data').hidden=false;
      if(state.dataset)$('#analysis-controls').disabled=false;
    }
  }
  $$('.dataset-card').forEach(b=>b.addEventListener('click',()=>selectDataset(b.dataset.dataset)));
  $('#retry-data').addEventListener('click',()=>selectDataset(state.loadingID||'weather'));
  $('#csv-upload').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    try {
      if(file.size>2*1024*1024)throw new Error('CSV 文件超过 2 MB，请先截取较小样本。');
      const text=await file.text(),dataset=D.importCSV(text,file.name);
      ++state.version;state.cache.set('custom',dataset);
      $('#custom-name').textContent=dataset.title;$('#custom-count').textContent=`${dataset.rows.length.toLocaleString()} 条 · 本地 CSV`;
      $('.custom-card').hidden=false;configure(dataset);$('#data-status').textContent=`已导入 ${dataset.rows.length} 条记录，识别出 ${numberFields().length} 个数值字段、${dateFields().length} 个日期字段。`;
      $('#data-status').classList.remove('error');$('#retry-data').hidden=true;
    }catch(error){$('#data-status').textContent=`导入失败：${error.message}`;$('#data-status').classList.add('error');}
    event.target.value='';
  });
  function syncControls() {
    const c=state.config,task=c.task;
    $('#analysis-task').value=task;$('#group-field').value=c.group;$('#metric-field').value=c.metric;
    $('#x-field').value=c.x;$('#y-field').value=c.y;$('#date-field').value=c.date;$('#aggregation').value=c.aggregate;
    $('#sort-order').value=c.sort;$('#bin-count').value=String(c.bins);$('#show-fit').checked=c.fit;$('#show-smooth').checked=c.smooth;
    $('#group-control').hidden=task!=='compare';
    $('#metric-control').hidden=task==='relationship'||(task==='compare'&&c.aggregate==='count'&&c.chart!=='box');
    $('#aggregation-control').hidden=task!=='compare'||c.chart==='box';
    $('#x-control').hidden=task!=='relationship';$('#y-control').hidden=task!=='relationship';$('#date-control').hidden=task!=='trend';
    $('#sort-control').hidden=task!=='compare'||c.chart==='box';$('#bins-control').hidden=c.chart!=='histogram';
    $('#fit-control').hidden=c.chart!=='scatter';$('#smooth-control').hidden=c.chart!=='line';
    const canNormalize=state.dataset.id==='states'&&task==='relationship'&&state.dataset.fields.some(f=>f.key===`${c.y}_rate`);
    if(!canNormalize)c.normalized=false;
    $('#normalization-control').hidden=!canNormalize;$('#normalize-rate').checked=c.normalized;
    const nums=numberFields().length,dates=dateFields().length;
    $$('[data-chart]').forEach(button=>{const type=button.dataset.chart;const enabled=['bar','dot'].includes(type)||type==='scatter'?(['bar','dot'].includes(type)||nums>=2):['line','heatmap'].includes(type)?!!(nums&&dates):!!nums;button.disabled=!enabled;button.setAttribute('aria-pressed',String(type===c.chart));button.title=enabled?`切换至${C.names[type]}`:'当前数据缺少该图形所需的数值或日期字段';});
    $('#chart-guidance').textContent=`当前任务：${taskNames[task]}。图形按钮会切换到相应任务；缺少所需字段的图形不可选。${c.chart==='box'?'箱线图分析原始数值的分布，不使用记录数或总和。':''}`;
  }
  function currentConfig(){const c={...state.config};if(c.normalized)c.y=`${c.y}_rate`;return c;}
  function filteredRows(){const c=state.config;return state.dataset.rows.filter(r=>c.filters.every(f=>String(r[f.key]??'缺失')===f.value)&&(!c.filterField||!c.filterValue||String(r[c.filterField]??'缺失')===c.filterValue));}
  function selectedRows(){const rows=filteredRows();return state.selection===null?rows:rows.filter(r=>state.selection.has(r.__id));}
  function scopeText(){const c=state.config;return [...c.filters.map(f=>`${field(f.key).label} = ${f.value}`),...(c.filterField&&c.filterValue?[`${field(c.filterField).label} = ${c.filterValue}`]:[])].join('；')||'全部记录';}
  function selectRows(ids){state.selection=new Set(ids);render();$('#analysis-chart [data-mark][aria-pressed="true"]')?.focus({preventScroll:true});}
  function render() {
    if(!state.dataset)return;
    const rows=filteredRows(),c=currentConfig();
    const result=C.render($('#analysis-chart'),{dataset:state.dataset,rows,config:c,selected:state.selection||new Set(),selectionActive:state.selection!==null,onSelect:selectRows});
    $('#chart-title').textContent=result.title;$('#chart-caption').textContent=result.caption;
    $('#chart-eyebrow').textContent=`${state.dataset.title} / ${taskNames[c.task]}`;
    $('#scope-count').textContent=`${rows.length} / ${state.dataset.rows.length} 条`;
    $('#selection-label').textContent=state.selection!==null?`已选择 ${selectedRows().length} 条 / 当前范围 ${rows.length} 条`:(['scatter','line'].includes(c.chart)?'在图中空白处拖动框选；点击标记可单选关联记录':'点击图形标记，联动查看统计摘要与数据明细');
    $('#clear-selection').hidden=state.selection===null;
    renderStats();renderTable();renderComparison();
    $('#add-filter').disabled=!(state.config.filterField&&state.config.filterValue);
    $('#active-filters').innerHTML=state.config.filters.map((f,i)=>`<button type="button" data-remove-filter="${i}" aria-label="移除条件 ${escapeHTML(field(f.key).label)} = ${escapeHTML(f.value)}">${escapeHTML(field(f.key).label)} = ${escapeHTML(f.value)} <span aria-hidden="true">×</span></button>`).join('');
    $$('[data-remove-filter]').forEach(button=>button.addEventListener('click',()=>{state.config.filters.splice(Number(button.dataset.removeFilter),1);state.selection=null;render();}));
  }
  function renderStats() {
    const rows=selectedRows(),c=currentConfig(),key=c.task==='relationship'?c.y:c.metric,s=D.stats(rows.map(r=>r[key])),r=D.relationship(rows,c.x,c.y);
    const items=[['关联记录',rows.length,'条'],[`${field(key).label||'数值'}均值`,fmt(s.mean),field(key).unit],[c.task==='relationship'?'Pearson r':'中位数',c.task==='relationship'?(r.r==null?'—':r.r.toFixed(3)):fmt(s.median),c.task==='relationship'?`${r.n} 对有效值`:field(key).unit],['数值范围',s.n?`${fmt(s.min)} – ${fmt(s.max)}`:'—',`${s.n} 个非空值`]];
    $('#stat-grid').innerHTML=items.map(([name,value,unit])=>`<div><small>${escapeHTML(name)}</small><strong>${escapeHTML(value)}</strong><span>${escapeHTML(unit||'')}</span></div>`).join('');
    $('#stats-scope').textContent=state.selection===null?'筛选范围':'图形选择';
    let insight;
    if(!rows.length)insight='当前没有关联记录。可以清除图形选择或调整筛选条件。';
    else if(c.task==='relationship')insight=r.r==null?'配对数不足或字段没有变化，相关系数无法定义。':`${field(c.x).label}与${field(c.y).label}的 Pearson r 为 ${r.r.toFixed(3)}，用于描述线性关系。相关性不能证明因果关系。`;
    else if(c.task==='compare'){
      const groups=D.aggregate(rows,c).sort((a,b)=>b.value-a.value),max=groups[0]?.value,ties=groups.filter(g=>Math.abs(g.value-max)<1e-9);
      insight=groups.length?`${ties.length>1?`${ties.length} 个分组并列最大`:`${groups[0].label}的${c.aggregate==='count'?'记录数':c.aggregate==='mean'?'均值':'总和'}最高`}：${fmt(max)}${c.aggregate==='count'?' 条':field(c.metric).unit}。${c.chart==='box'?'箱线图呈现的是各组原始数值分布。':''}`:'所选数值字段全部为空，无法计算该聚合结果。';
    }else insight=s.n?`${s.n} 个有效数值的均值为 ${fmt(s.mean)}，中位数为 ${fmt(s.median)}。四分位区间为 ${fmt(s.q1)}–${fmt(s.q3)}。${c.task==='trend'?'该摘要按原始记录计算；时间视图按日聚合。':''}`:'没有可用于统计的非空数值。';
    $('#analysis-insight').textContent=insight;
    $('#analysis-method').textContent=`${scopeText()}${state.selection!==null?'，摘要仅针对图形选择。':'。'}空数值不作为零；分位数采用线性插值。${c.normalized?'纵轴 = 事件数 ÷ 人口 × 100,000。':''}`;
  }
  function renderTable() {
    const rows=selectedRows(),fields=state.dataset.fields;
    const formatCell=(r,f)=>r[f.key]==null?'—':f.type==='date'?new Date(r[f.key]).toISOString().slice(0,10):f.type==='number'?fmt(r[f.key]):r[f.key];
    $('#data-table thead').innerHTML=`<tr><th scope="col">行号</th>${fields.map(f=>`<th scope="col">${escapeHTML(f.label)}</th>`).join('')}</tr>`;
    $('#data-table tbody').innerHTML=rows.slice(0,100).map(r=>`<tr><td>${r.__id+1}</td>${fields.map(f=>`<td>${escapeHTML(formatCell(r,f))}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${fields.length+1}">当前没有关联记录。</td></tr>`;
    $('#table-count').textContent=`${rows.length} 条${state.selection!==null?'已选记录':'筛选记录'}`;
    $('#table-note').textContent=rows.length>100?'页面展示前 100 条，导出包含全部关联记录。':'表格随筛选与图形选择联动。日期使用 UTC 日历日，数值在表格中保留至两位小数；导出保留原数值精度。';
  }
  $('#clear-selection').addEventListener('click',()=>{state.selection=null;render();});
  $('#analysis-task').addEventListener('change',event=>{const c=state.config;c.task=event.target.value;c.chart={compare:'bar',distribution:'histogram',relationship:'scatter',trend:'line'}[c.task];state.selection=null;syncControls();render();});
  $$('[data-chart]').forEach(button=>button.addEventListener('click',()=>{const type=button.dataset.chart,c=state.config;c.chart=type;c.task=['bar','dot'].includes(type)?'compare':type==='scatter'?'relationship':['line','heatmap'].includes(type)?'trend':type==='box'&&c.task==='compare'?'compare':'distribution';state.selection=null;syncControls();render();}));
  [['#group-field','group'],['#metric-field','metric'],['#x-field','x'],['#y-field','y'],['#date-field','date'],['#aggregation','aggregate'],['#sort-order','sort'],['#bin-count','bins']].forEach(([selector,key])=>$(selector).addEventListener('change',event=>{state.config[key]=key==='bins'?Number(event.target.value):event.target.value;state.selection=null;syncControls();render();}));
  [['#show-fit','fit'],['#show-smooth','smooth'],['#normalize-rate','normalized']].forEach(([selector,key])=>$(selector).addEventListener('change',event=>{state.config[key]=event.target.checked;render();}));
  $('#filter-field').addEventListener('change',event=>{
    const key=event.target.value;state.config.filterField=key;state.config.filterValue='';state.selection=null;
    const values=key?[...new Set(state.dataset.rows.map(r=>String(r[key]??'缺失')))].sort((a,b)=>a.localeCompare(b,'zh-CN',{numeric:true})):[];
    selectionOptions($('#filter-value'),[['','全部类别'],...values.map(v=>[v,v])],'');$('#filter-value').disabled=!key;render();
  });
  $('#filter-value').addEventListener('change',event=>{state.config.filterValue=event.target.value;state.selection=null;render();});
  $('#add-filter').addEventListener('click',()=>{const c=state.config;if(!c.filterField||!c.filterValue)return;c.filters.push({key:c.filterField,value:c.filterValue});$('#filter-field').value='';$('#filter-field').dispatchEvent(new Event('change'));});
  $('#reset-filters').addEventListener('click',()=>{state.config.filters=[];$('#filter-field').value='';$('#filter-field').dispatchEvent(new Event('change'));});

  function compareOptions() {
    const task=state.config.task;
    return task==='compare'?[['bar','柱状图'],['dot','圆点图']]:task==='distribution'?[['histogram','直方图'],['box','箱线图']]:task==='relationship'?[['scatter','原始散点'],['scatter-fit','散点 + 拟合']]:[['line','折线趋势'],['heatmap','日历热图']];
  }
  function renderComparison() {
    if(!state.dataset||state.tab!=='encoding')return;
    const opts=compareOptions();
    if(state.compareTask!==state.config.task){selectionOptions($('#compare-a'),opts,opts[0][0]);selectionOptions($('#compare-b'),opts,opts[1][0]);state.compareTask=state.config.task;}
    const rows=filteredRows(),c=currentConfig();
    ['a','b'].forEach(side=>{const type=$(`#compare-${side}`).value,config={...c,chart:type==='scatter-fit'?'scatter':type,fit:type==='scatter-fit'};const result=C.render($(`#comparison-${side}`),{dataset:state.dataset,rows,config,interactive:false,compact:true});$(`#compare-caption-${side}`).textContent=result.caption;});
    $('#comparison-context').textContent=`${state.dataset.title} · ${taskNames[c.task]} · ${scopeText()} · ${rows.length} 条记录`;
    $('#comparison-tip').textContent='对照使用完整筛选范围，不采用单个图形的临时框选。先在数据分析中配置任务和字段，再比较相应图形。';
    $('#comparison-question').textContent={compare:'柱状图用长度、圆点图用位置表达同一组数值。哪一种更便于识别接近的数值？',distribution:'直方图保留分箱频数，箱线图压缩为分位数与范围外观测。哪种视图能看出分布的峰形？',relationship:'加入拟合线后，整体线性趋势更明显，但哪些点偏离直线？拟合线是否会掩盖非线性结构？',trend:'折线图更容易追踪连续变化，日历热图更容易定位月份与日期。两种表达分别回答什么问题？'}[c.task];
  }
  ['#compare-a','#compare-b'].forEach(selector=>$(selector).addEventListener('change',renderComparison));

  let mission;
  function renderMission() {
    const rows=state.dataset.rows,id=state.dataset.id;
    if(id==='students'){
      const groups=D.groupRows(rows,'年龄').sort((a,b)=>b.rows.length-a.rows.length);
      mission={question:'在全部 80 条合成样本中，17 岁与 18 岁哪组人数更多？',options:[['17','17 岁'],['18','18 岁']],answer:groups[0].label,explanation:groups.map(g=>`${g.label} 岁 ${g.rows.length} 人`).join('；'),config:{task:'distribution',chart:'histogram',metric:'年龄'}};
    }else if(id==='weather'){
      const groups=D.aggregate(rows,{group:'__month',metric:'temp_max',aggregate:'mean',sort:'desc'});
      mission={question:'不筛选月份时，哪个月的日最高温算术均值最高？',options:[...groups].sort((a,b)=>a.label.localeCompare(b.label)).map(g=>[g.label,g.label]),answer:groups[0].label,explanation:`${groups[0].label} 的日最高温均值为 ${fmt(groups[0].value)} °C。`,config:{task:'compare',chart:'bar',group:'__month',metric:'temp_max',aggregate:'mean',sort:'name'}};
    }else if(id==='states'){
      const r=D.relationship(rows,'population','burglary').r;
      mission={question:'在 50 州历史示例中，人口与入室盗窃总量的 Pearson r 是否大于 0.8？',options:[['yes','大于 0.8'],['no','不大于 0.8']],answer:r>.8?'yes':'no',explanation:`全部样本的 r = ${r.toFixed(3)}。再把纵轴切换为每十万人指标，观察关系是否改变；相关性不代表因果。`,config:{task:'relationship',chart:'scatter',x:'population',y:'burglary',normalized:false}};
    }else{
      const f=numberFields()[0],s=f?D.stats(rows.map(r=>r[f.key])):null;
      mission=f&&s.n?{question:`全部导入记录中，“${f.label}”的均值是否大于中位数？`,options:[['yes','均值大于中位数'],['no','均值不大于中位数']],answer:s.mean>s.median?'yes':'no',explanation:`均值 ${fmt(s.mean)}，中位数 ${fmt(s.median)}。可用直方图进一步检查分布。`,config:{task:'distribution',chart:'histogram',metric:f.key}}:{question:'这份导入数据共有多少条记录？',options:[[String(rows.length),`${rows.length} 条`],[String(rows.length+1),`${rows.length+1} 条`]],answer:String(rows.length),explanation:`成功解析 ${rows.length} 条记录，不包含表头。`,config:{task:'compare',chart:'bar',aggregate:'count'}};
    }
    $('#mission-question').textContent=mission.question;selectionOptions($('#mission-answer'),[['','先选择你的预测'],...mission.options],'');
    $('#mission-feedback').textContent='任务基于全部数据，不使用当前筛选或图形选择。';
  }
  $('#check-mission').addEventListener('click',()=>{if(!mission)return;const answer=$('#mission-answer').value;$('#mission-feedback').textContent=!answer?'请先选择预测，再查看验证结果。':`${answer===mission.answer?'预测正确。':'可以再观察图形。'}${mission.explanation}`;});
  $('#load-mission').addEventListener('click',()=>{if(!mission)return;Object.assign(state.config,mission.config,{filterField:'',filterValue:'',filters:[]});state.selection=null;$('#filter-field').value='';selectionOptions($('#filter-value'),[['','全部类别']],'');$('#filter-value').disabled=true;syncControls();render();});

  function download(content,mime,filename){const blob=new Blob(['\uFEFF',content],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('#export-svg').addEventListener('click',()=>{const svg=$('#analysis-chart svg')?.cloneNode(true);if(!svg)return;svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('style','background:#fffefb;font-family:Segoe UI,Microsoft YaHei,sans-serif');const style=document.createElementNS('http://www.w3.org/2000/svg','style');style.textContent='.plot-axis text,.plot-label{fill:#667768;font-size:12px}.plot-axis line,.plot-axis path{stroke:#dce4d6}.plot-value{fill:#355640;font-size:12px}.plot-empty{fill:#667768;font-size:15px}.plot-brush{display:none}';svg.prepend(style);download(new XMLSerializer().serializeToString(svg),'image/svg+xml;charset=utf-8',`vis-${state.dataset.id}-${state.config.chart}.svg`);});
  $('#export-csv').addEventListener('click',()=>{
    const fields=state.dataset.fields,rows=selectedRows();
    const quote=value=>`"${String(value??'').replace(/"/g,'""')}"`;
    const cell=(r,f)=>r[f.key]==null?'':f.type==='date'?new Date(r[f.key]).toISOString().slice(0,10):typeof r[f.key]==='string'&&/^[=+\-@]/.test(r[f.key])?`'${r[f.key]}`:r[f.key];
    const csv=[fields.map(f=>quote(f.key)).join(','),...rows.map(r=>fields.map(f=>quote(cell(r,f))).join(','))].join('\r\n');download(csv,'text/csv;charset=utf-8',`vis-${state.dataset.id}-selection.csv`);
  });
  $('#save-record').addEventListener('click',()=>{
    if(state.records.length>=6){$('#record-list').setAttribute('role','status');$('#record-list').insertAdjacentHTML('afterbegin','<p class="record-limit">已保存 6 条，请先删除一条记录。</p>');return;}
    const c=currentConfig(),record={id:Date.now(),title:`${state.dataset.title} · ${taskNames[c.task]} · ${C.names[c.chart]}`,config:`${scopeText()}；${selectedRows().length} 条关联记录；${c.task==='relationship'?`${field(c.x).label} × ${field(c.y).label}`:c.task==='trend'?`${field(c.date).label} / ${field(c.metric).label} / 每日均值`:c.task==='distribution'?`${field(c.metric).label} / 原始分布`:`${field(c.group).label} / ${field(c.metric).label} / ${c.chart==='box'?'原始分布':c.aggregate==='count'?'记录数':c.aggregate==='mean'?'平均值':'总和'}`} / ${C.names[c.chart]}`,source:state.dataset.source,result:$('#analysis-insight').textContent,note:$('#experiment-note').value.trim()};
    state.records.unshift(record);$('#experiment-note').value='';renderRecords();
  });
  function renderRecords(){
    $('#record-list').innerHTML=state.records.length?state.records.map((r,i)=>`<article><span class="record-index">${String(state.records.length-i).padStart(2,'0')}</span><div><h4>${escapeHTML(r.title)}</h4><p>${escapeHTML(r.config)}</p><p>${escapeHTML(r.result)}</p>${r.note?`<blockquote>${escapeHTML(r.note)}</blockquote>`:''}</div><button type="button" class="text-button" data-remove-record="${r.id}" aria-label="删除记录 ${state.records.length-i}">×</button></article>`).join(''):'<p class="empty-note">尚无实验记录。</p>';
    $('#export-notes').disabled=!state.records.length;
    $$('[data-remove-record]').forEach(button=>button.addEventListener('click',()=>{state.records=state.records.filter(r=>r.id!==Number(button.dataset.removeRecord));renderRecords();}));
  }
  $('#export-notes').addEventListener('click',()=>download(`# 可视化实验记录\n\n${state.records.map((r,i)=>`## ${i+1}. ${r.title}\n\n配置：${r.config}\n\n来源：${r.source}\n\n统计：${r.result}\n\n观察与解释：${r.note||'未填写'}\n`).join('\n')}`,'text/markdown;charset=utf-8','可视化实验记录.md'));

const colorExamples = {
  sequential: {
    title: '学习时长示例 / 分钟', ruleTitle: '有序数值的明暗映射',
    rule: '顺序色带通过由浅到深的颜色变化表达递增数值。数量起点为 0 分钟，深绿色对应较长的学习时长。',
    values: [10, 20, 30, 15, 40, 55, 25, 35, 50, 45, 60, 30, 5, 10, 25, 35, 40, 50, 15, 30, 20, 40, 55, 60],
    palette: ['#eef3e6', '#c9d9b8', '#96b48b', '#668971', '#365a49'],
    legend: ['0 分钟', '15', '30', '45', '60 分钟'],
    summary: '映射范围为 0–60 分钟，颜色深度随数值递增。矩阵行对应 4 个示例小组，列对应 6 次观测。'
  },
  diverging: {
    title: '相对基准的温度偏差 / °C', ruleTitle: '基准偏差的双向映射',
    rule: '发散色带以 0 °C 偏差为中点。绿色表示低于基准，米白表示接近基准，橙色表示高于基准；映射范围为对称的 −8 至 +8 °C。',
    values: [-8, -6, -3, 0, 3, 6, -5, -2, 0, 2, 5, 8, -7, -4, -1, 1, 4, 7, -6, -3, 0, 3, 6, 8],
    palette: ['#365a49', '#a3bea1', '#faf6ea', '#d7a578', '#9b522d'],
    legend: ['−8 °C', '−4', '0（基准）', '+4', '+8 °C'],
    summary: '绿色与橙色分别表示负偏差和正偏差，0 为共同基准。接近色带两端的颜色对应较大的偏差绝对值。'
  },
  categorical: {
    title: '学习活动类型 / 类别', ruleTitle: '无序类别的色相映射',
    rule: '阅读、练习、讨论和复习属于无序类别。定性色带通过不同色相区分类别，并保留文字标签；颜色不表示数量或优劣。',
    values: ['阅读', '练习', '讨论', '复习', '练习', '阅读', '讨论', '阅读', '复习', '练习', '阅读', '讨论', '练习', '复习', '阅读', '讨论', '复习', '练习', '复习', '讨论', '练习', '阅读', '讨论', '复习'],
    palette: ['#547c67', '#bd805d', '#817ba1', '#b29949'],
    legend: ['阅读', '练习', '讨论', '复习'],
    summary: '颜色仅编码活动类别，不编码数量或优劣。各单元保留类别文字，提供独立于颜色的识别信息。'
  }
};

function mixColor(a, b, amount) {
  const parts = (color) => [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16));
  return `#${parts(a).map((channel, index) => Math.round(channel + (parts(b)[index] - channel) * amount).toString(16).padStart(2, '0')).join('')}`;
}

function textColor(hex) {
  const rgb = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255).map((channel) => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  const luminance = .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
  return (luminance + .05) / .05 > 1.05 / (luminance + .05) ? '#000000' : '#ffffff';
}

function renderColor() {
  const mode = $('#color-mode').value;
  const example = colorExamples[mode];
  $('#color-title').textContent = example.title;
  $('#color-rule-title').textContent = example.ruleTitle;
  $('#color-rule').textContent = example.rule;
  $('#color-summary').textContent = example.summary;
  const label = (value) => mode === 'diverging' && value > 0 ? `+${value}` : value;
  const color = (value) => {
    if (mode === 'categorical') return example.palette[example.legend.indexOf(value)];
    const position = mode === 'sequential' ? value / 60 * 4 : (value + 8) / 16 * 4;
    const index = Math.min(3, Math.floor(position));
    return mixColor(example.palette[index], example.palette[index + 1], position - index);
  };
  const width = 680, cellWidth = 96, cellHeight = 57, left = 68, top = 35;
  let shapes = '';
  for (let column = 0; column < 6; column++) shapes += `<text x="${left + column * cellWidth + 44}" y="18" text-anchor="middle" fill="#64736a" font-size="12">观测 ${column + 1}</text>`;
  for (let row = 0; row < 4; row++) shapes += `<text x="${left - 15}" y="${top + row * cellHeight + 31}" text-anchor="end" fill="#64736a" font-size="12">组 ${String.fromCharCode(65 + row)}</text>`;
  example.values.forEach((value, index) => {
    const x = left + index % 6 * cellWidth, y = top + Math.floor(index / 6) * cellHeight, fill = color(value);
    shapes += `<rect x="${x}" y="${y}" width="88" height="49" rx="5" fill="${fill}"><title>组 ${String.fromCharCode(65 + Math.floor(index / 6))}，观测 ${index % 6 + 1}：${label(value)}</title></rect><text opacity="${$('#color-labels').checked ? 1 : 0}" x="${x + 44}" y="${y + 31}" text-anchor="middle" font-size="14" fill="${textColor(fill)}">${label(value)}</text>`;
  });
  const accessible = `${example.title}。${example.values.map((value, index) => `组 ${String.fromCharCode(65 + Math.floor(index / 6))} 观测 ${index % 6 + 1} 为 ${label(value)}`).join('；')}。`;
  $('#color-chart').style.filter = $('#grayscale-check').checked ? 'grayscale(1)' : '';
  $('#color-legend').style.filter = $('#grayscale-check').checked ? 'grayscale(1)' : '';
  $('#color-chart').innerHTML = `<svg viewBox="0 0 ${width} 270" role="img" aria-label="${escapeHTML(accessible)}"><title>${escapeHTML(example.title)}</title>${shapes}</svg>`;
  $('#color-legend').innerHTML = example.legend.map((text, index) => `<span class="legend-item"><i class="legend-swatch" style="background:${example.palette[index]}"></i>${text}</span>`).join('');
}


  ['#color-mode','#grayscale-check','#color-labels'].forEach(selector=>$(selector).addEventListener('change',renderColor));
  matchMedia('(max-width:760px)').addEventListener('change',()=>render());
  renderColor();
  switchTab(['explore','encoding','color'].includes(location.hash.slice(1))?location.hash.slice(1):'explore',false,false);
  selectDataset('weather');
})();
