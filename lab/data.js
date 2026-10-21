/* Data and statistics shared by the browser workbench and the numerical checks. */
(() => {
  'use strict';
  const numeric = value => value !== '' && value != null && Number.isFinite(Number(value));
  function parseCSV(input) {
    const text = input.replace(/^\uFEFF/, '');
    const records = []; let row = [], field = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (quoted && text[i + 1] === '"') { field += '"'; i++; }
        else quoted = !quoted;
      } else if (c === ',' && !quoted) { row.push(field); field = ''; }
      else if ((c === '\n' || c === '\r') && !quoted) {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); if (row.some(v => v.trim())) records.push(row);
        row = []; field = '';
      } else field += c;
    }
    if (quoted) throw new Error('CSV 引号未闭合。');
    if (field || row.length) { row.push(field); if (row.some(v => v.trim())) records.push(row); }
    if (records.length < 2) throw new Error('请提供表头和至少一行数据。');
    const headers = records.shift().map(v => v.trim());
    if (headers.length > 100 || headers.some(h => !h || h.length > 80 || h.startsWith('__'))) throw new Error('字段名不能为空、超过 80 字或以双下划线开头；最多支持 100 列。');
    if (new Set(headers).size !== headers.length) throw new Error('字段名不能重复。');
    if (records.length > 5000) throw new Error('单次实验最多支持 5,000 行，请先截取样本。');
    if (records.some(r => r.length !== headers.length)) throw new Error('部分记录的列数与表头不同，请检查逗号及引号。');
    return records.map(values => Object.fromEntries(headers.map((h, i) => [h, values[i].trim()])));
  }
  function parseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
    const ms = Date.parse(`${value}T00:00:00Z`);
    return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value ? ms : null;
  }
  function inferFields(rows) {
    return Object.keys(rows[0]).map(key => {
      const values = rows.map(r => r[key]).filter(v => v !== '');
      const identifier = /^(id|序号|编号|学号)$/i.test(key);
      const type = !identifier && values.length && values.every(v => parseDate(v) !== null) ? 'date' : !identifier && values.length && values.every(numeric) ? 'number' : 'category';
      return {key, label:key, type, unit:''};
    });
  }
  function prepare(id, title, raw, fields, extra = {}) {
    const rows = raw.map((r, i) => {
      const row = {__id:i, __all:'全部样本'};
      for (const f of fields) row[f.key] = r[f.key] == null || r[f.key] === '' ? null : f.type === 'date' ? parseDate(r[f.key]) : f.type === 'number' ? (numeric(r[f.key]) ? Number(r[f.key]) : null) : String(r[f.key]);
      return row;
    });
    fields = fields.map(f => ({unit:'', ...f}));
    const date = fields.find(f => f.type === 'date');
    if (date) {
      rows.forEach(r => {
        r.__month = r[date.key] == null ? null : new Date(r[date.key]).toISOString().slice(0, 7);
        r.__weekday = r[date.key] == null ? null : ['周日','周一','周二','周三','周四','周五','周六'][new Date(r[date.key]).getUTCDay()];
      });
      fields.push({key:'__month', label:'月份', type:'category', unit:''}, {key:'__weekday', label:'星期', type:'category', unit:''});
    }
    if (!fields.some(f => f.type === 'category')) fields.push({key:'__all',label:'全部样本',type:'category',unit:''});
    return {id,title,rows,fields,...extra};
  }
  const builtins = {
    students:{title:'新生数据', short:'分组与分布', icon:'◈', file:'../lesson-01/data/newstudent.csv', source:'原课程合成新生样本，由 DeepSeek 生成；非真实学生记录。', defaults:{task:'compare',group:'班级',metric:'年龄',x:'年龄',y:'年龄',aggregate:'count',chart:'bar'}, fields:[['姓名','姓名','category'],['性别','性别','category'],['年龄','年龄','number','岁'],['班级','班级','category'],['籍贯','籍贯','category'],['民族','民族','category']]},
    weather:{title:'全年天气', short:'趋势与周期', icon:'◌', file:'../lesson-05/data/weather_2024.csv', source:'原课程 2024 年天气示例；原文件未附采集说明，仅用于教学分析。', defaults:{task:'trend',group:'__month',metric:'temp_max',x:'temp_max',y:'rain_mm',date:'date',aggregate:'mean',chart:'line'}, fields:[['date','日期','date'],['temp_max','日最高温','number','°C'],['rain_mm','日降水量','number','mm']]},
    states:{title:'州级统计', short:'关系与标准化', icon:'⤢', file:'../lesson-04/data/crime.csv', source:'原课程历史州级统计示例（50 州），非当前统计。总量与每十万人指标应分别解读。', defaults:{task:'relationship',group:'state',metric:'burglary',x:'population',y:'burglary',aggregate:'mean',chart:'scatter'}, fields:[['state','州','category'],['population','人口','number','人'],['population_growth','人口增长指标','number'],['robbery','抢劫数','number'],['aggravated_assault','严重袭击数','number'],['burglary','入室盗窃数','number'],['larceny_theft','盗窃数','number'],['motor_vehicle_theft','机动车盗窃数','number'],['murder','凶杀数','number']]}
  };
  async function loadBuiltin(id) {
    const spec = builtins[id];
    const response = await fetch(spec.file);
    if (!response.ok) throw new Error('课程数据暂时无法加载，请重试。');
    const dataset = prepare(id,spec.title,parseCSV(await response.text()),spec.fields.map(([key,label,type,unit]) => ({key,label,type,unit})), {source:spec.source,file:spec.file,defaults:spec.defaults});
    if (id === 'states') {
      for (const key of ['robbery','burglary','murder','larceny_theft']) {
        const label = dataset.fields.find(f => f.key === key).label;
        dataset.fields.push({key:`${key}_rate`,label:label.replace(/数$/,'率'),type:'number',unit:'每十万人'});
        dataset.rows.forEach(r => {r[`${key}_rate`] = r.population > 0 && r[key] != null ? r[key] / r.population * 100000 : null;});
      }
    }
    return dataset;
  }
  function importCSV(text, filename) {
    const rows = parseCSV(text), fields = inferFields(rows);
    return prepare('custom', filename.replace(/\.csv$/i,''), rows, fields, {source:'用户本地 CSV；数据只在当前浏览器内处理，不上传服务器。字段类型由非空值自动识别。', defaults:{}});
  }
  function quantile(sorted, p) {
    if (!sorted.length) return null;
    const i = (sorted.length - 1) * p, a = Math.floor(i);
    return sorted[a] + (sorted[Math.ceil(i)] - sorted[a]) * (i - a);
  }
  function stats(values) {
    const a = values.filter(v => typeof v === 'number' && Number.isFinite(v)).sort((a,b) => a-b);
    if (!a.length) return {n:0,mean:null,median:null,min:null,max:null,q1:null,q3:null};
    return {n:a.length,mean:a.reduce((s,v)=>s+v,0)/a.length,median:quantile(a,.5),min:a[0],max:a[a.length-1],q1:quantile(a,.25),q3:quantile(a,.75)};
  }
  function relationship(rows,x,y) {
    const valid = rows.filter(r => Number.isFinite(r[x]) && Number.isFinite(r[y]));
    if (valid.length < 3) return {n:valid.length,r:null,slope:null,intercept:null};
    const mx = stats(valid.map(r=>r[x])).mean, my = stats(valid.map(r=>r[y])).mean;
    let xx=0,yy=0,xy=0;
    valid.forEach(r=>{xx+=(r[x]-mx)**2;yy+=(r[y]-my)**2;xy+=(r[x]-mx)*(r[y]-my);});
    if (!xx) return {n:valid.length,r:null,slope:null,intercept:null};
    const slope=xy/xx;
    return {n:valid.length,r:yy?Math.max(-1,Math.min(1,xy/Math.sqrt(xx*yy))):null,slope,intercept:my-slope*mx};
  }
  function groupRows(rows,key) {
    const groups = new Map();
    rows.forEach(r=>{const label=String(r[key] ?? '缺失');if(!groups.has(label))groups.set(label,[]);groups.get(label).push(r);});
    return [...groups].map(([label,rows])=>({label,rows}));
  }
  function aggregate(rows,config) {
    const groups = groupRows(rows,config.group).map(g=>{
      const summary=stats(g.rows.map(r=>r[config.metric]));
      return {...g,summary,value:config.aggregate==='count'?g.rows.length:config.aggregate==='sum'?(summary.n?g.rows.reduce((s,r)=>s+(Number.isFinite(r[config.metric])?r[config.metric]:0),0):null):summary.mean};
    }).filter(g=>g.value!==null);
    if(config.sort==='name')groups.sort((a,b)=>a.label.localeCompare(b.label,'zh-CN',{numeric:true}));
    else groups.sort((a,b)=>(config.sort==='asc'?1:-1)*(a.value-b.value)||a.label.localeCompare(b.label));
    return groups;
  }
  const api = {parseCSV,parseDate,inferFields,prepare,builtins,loadBuiltin,importCSV,stats,quantile,relationship,groupRows,aggregate};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  else window.LabData=api;
})();
