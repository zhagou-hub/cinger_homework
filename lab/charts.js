/* Seven data-appropriate views, with shared row IDs for linked selection. */
(() => {
  'use strict';
  const D = window.LabData, d3 = window.d3;
  const names = {bar:'柱状图',dot:'圆点图',histogram:'直方图',box:'箱线图',scatter:'散点图',line:'折线图',heatmap:'日历热图'};
  const colors = ['#527660','#b28c5c','#8e9c72','#8d839d','#bd805e','#7c9c9b'];
  const fmt = n => n == null || !Number.isFinite(n) ? '—' : Math.abs(n)>=1e8 ? `${+(n/1e8).toFixed(1)}亿` : Math.abs(n)>=1e4 ? `${+(n/1e4).toFixed(1)}万` : Number.isInteger(n) ? String(n) : String(+n.toFixed(2));
  function extent(values, zero=false) {
    let [a,b] = d3.extent(values.filter(Number.isFinite));
    if(a==null)return [0,1];
    if(zero){a=Math.min(0,a);b=Math.max(0,b);}
    if(a===b){const pad=Math.abs(a)*.1||1;a-=pad;b+=pad;}
    return [a,b];
  }
  function render(host, options) {
    const {dataset,rows,config:c,selected=new Set(),onSelect=()=>{},interactive=true} = options;
    const chart = c.chart, W=options.compact||matchMedia('(max-width:760px)').matches?600:880, left=76,right=28,top=26;
    const field = key => dataset.fields.find(f=>f.key===key)||{label:key||'',unit:''};
    const label = key => `${field(key).label}${field(key).unit?`（${field(key).unit}）`:''}`;
    const numberLabel = c.aggregate==='count'?'记录数':`${c.aggregate==='sum'?'总和':'平均'} · ${label(c.metric)}`;
    let H=398,bottom=H-60, caption='', title='';
    host.replaceChildren();
    const svg=d3.select(host).append('svg').attr('viewBox',`0 0 ${W} ${H}`).attr('role','group').attr('aria-label',`${dataset.title} · ${names[chart]}`);
    svg.append('title').text(`${dataset.title} · ${names[chart]}`);
    function size(height){H=height;bottom=H-60;svg.attr('viewBox',`0 0 ${W} ${H}`);}
    function text(x,y,t,anchor='start',cls='plot-label'){return svg.append('text').attr('x',x).attr('y',y).attr('text-anchor',anchor).attr('class',cls).text(t);}
    function xaxis(scale,format=fmt,ticks=6){svg.append('g').attr('class','plot-axis').attr('transform',`translate(0,${bottom})`).call(d3.axisBottom(scale).ticks(ticks).tickFormat(format).tickSizeOuter(0));}
    function yaxis(scale,format=fmt){svg.append('g').attr('class','plot-axis grid-axis').attr('transform',`translate(${left},0)`).call(d3.axisLeft(scale).ticks(5).tickFormat(format).tickSize(-(W-left-right)).tickSizeOuter(0));}
    function interactiveMark(mark,records,description,color='#527660') {
      const active = !options.selectionActive || records.some(r=>selected.has(r.__id));
      mark.attr('data-mark','true').attr('opacity',active?1:.19);
      mark.append('title').text(description);
      if(interactive)mark.attr('tabindex',0).attr('role','button').attr('aria-label',`${description}，选择关联的 ${records.length} 条记录`).attr('aria-pressed',selected.size&&records.some(r=>selected.has(r.__id))?'true':'false')
        .on('click',(event)=>{event.stopPropagation();onSelect(records.map(r=>r.__id));})
        .on('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(records.map(r=>r.__id));}});
      return mark;
    }
    function empty(message){text(W/2,170,message,'middle','plot-empty');return {caption:message,title:names[chart],usable:0};}
    if(!rows.length)return empty('当前范围没有记录，请调整筛选条件。');

    if(chart==='bar'||chart==='dot') {
      const all=D.aggregate(rows,c),groups=all.slice(0,12);
      if(!groups.length)return empty('该字段没有可用于聚合的非空数值。');
      size(Math.max(310,groups.length*32+90));
      const L=135,x=d3.scaleLinear().domain(extent(all.map(g=>g.value),true)).nice().range([L,W-76]);
      const y=d3.scaleBand().domain(groups.map(g=>g.label)).range([top,bottom]).padding(.32);
      svg.append('g').attr('class','plot-axis grid-axis vertical-grid').attr('transform',`translate(0,${bottom})`).call(d3.axisBottom(x).ticks(6).tickFormat(fmt).tickSize(-(bottom-top)).tickSizeOuter(0));
      svg.append('line').attr('x1',x(0)).attr('x2',x(0)).attr('y1',top).attr('y2',bottom).attr('stroke','#a5b3a1');
      groups.forEach((g,i)=>{
        const mid=y(g.label)+y.bandwidth()/2,color=colors[i%colors.length];
        text(L-12,mid+4,g.label.length>15?g.label.slice(0,14)+'…':g.label,'end');
        let mark;
        if(chart==='bar')mark=svg.append('rect').attr('x',Math.min(x(0),x(g.value))).attr('y',y(g.label)).attr('width',Math.max(.7,Math.abs(x(g.value)-x(0)))).attr('height',y.bandwidth()).attr('rx',3).attr('fill',color);
        else {svg.append('line').attr('x1',x(0)).attr('x2',x(g.value)).attr('y1',mid).attr('y2',mid).attr('stroke','#d4dece');mark=svg.append('circle').attr('cx',x(g.value)).attr('cy',mid).attr('r',6).attr('fill',color);}
        interactiveMark(mark,g.rows,`${g.label}：${numberLabel} ${fmt(g.value)}；${g.rows.length} 条记录`,color);
        text(x(g.value)+(g.value<0?-9:9),mid+4,fmt(g.value),g.value<0?'end':'start','plot-value');
      });
      title=`${field(c.group).label} · ${numberLabel}`;
      caption=`${all.length} 个分组${all.length>12?'，当前按所选顺序展示前 12 组；明细仍包含全部筛选记录':''}。${c.aggregate==='count'?'每条记录计数一次。':c.aggregate==='mean'?'每组仅对非空数值取算术平均。':'每组仅对非空数值求和。'}横轴包含零基准。`;
      text(W-76,H-14,numberLabel,'end');
    } else if(chart==='histogram') {
      const valid=rows.filter(r=>Number.isFinite(r[c.metric])),values=valid.map(r=>r[c.metric]);
      if(!valid.length)return empty('该字段没有可用数值。');
      const unique=[...new Set(values)].sort((a,b)=>a-b);
      let domain=extent(values),thresholds=c.bins||12;
      if(unique.length<=12&&values.every(Number.isInteger)&&unique.at(-1)-unique[0]<=15){domain=[unique[0]-.5,unique.at(-1)+.5];thresholds=d3.range(unique[0]+.5,unique.at(-1)+.5,1);}
      else domain=d3.scaleLinear().domain(domain).nice().domain();
      const bins=d3.bin().value(r=>r[c.metric]).domain(domain).thresholds(thresholds)(valid);
      const x=d3.scaleLinear().domain(domain).range([left,W-right]), y=d3.scaleLinear().domain([0,d3.max(bins,b=>b.length)||1]).nice().range([bottom,top]);
      yaxis(y,n=>Number.isInteger(n)?fmt(n):'');xaxis(x);
      bins.forEach(bin=>{
        const mark=svg.append('rect').attr('x',x(bin.x0)+1).attr('y',y(bin.length)).attr('width',Math.max(1,x(bin.x1)-x(bin.x0)-2)).attr('height',bottom-y(bin.length)).attr('fill','#78936a').attr('rx',2);
        interactiveMark(mark,bin,`${fmt(bin.x0)} 至 ${fmt(bin.x1)}：${bin.length} 条记录`);
        if(bins.length<=15)text((x(bin.x0)+x(bin.x1))/2,y(bin.length)-8,bin.length,'middle','plot-value');
      });
      text(left,15,'记录数');text(W-right,H-14,label(c.metric),'end');
      title=`${field(c.metric).label} · 数值分布`;
      caption=`${valid.length} 条有效数值，${rows.length-valid.length} 条空值被排除；实际 ${bins.length} 个等宽分箱。区间左闭右开，最后一个区间包含右端点。整数取值较少时按单位宽度分箱。`;
    } else if(chart==='box') {
      const groups=(c.task==='compare'?D.groupRows(rows,c.group):[{label:'全部样本',rows}]).map(g=>({...g,summary:D.stats(g.rows.map(r=>r[c.metric]))})).filter(g=>g.summary.n).sort((a,b)=>b.summary.n-a.summary.n).slice(0,12);
      if(!groups.length)return empty('该字段没有可用数值。');
      const x=d3.scaleBand().domain(groups.map(g=>g.label)).range([left,W-right]).padding(.4),y=d3.scaleLinear().domain(extent(rows.map(r=>r[c.metric]))).nice().range([bottom,top]);
      yaxis(y);svg.append('g').attr('class','plot-axis').attr('transform',`translate(0,${bottom})`).call(d3.axisBottom(x).tickFormat(t=>t.length>10?t.slice(0,9)+'…':t).tickSizeOuter(0));
      groups.forEach((g,i)=>{
        const s=g.summary,iqr=s.q3-s.q1,valid=g.rows.filter(r=>Number.isFinite(r[c.metric]));
        const inside=valid.map(r=>r[c.metric]).filter(v=>v>=s.q1-1.5*iqr&&v<=s.q3+1.5*iqr),lo=d3.min(inside),hi=d3.max(inside),cx=x(g.label)+x.bandwidth()/2,bw=Math.min(75,x.bandwidth());
        const group=svg.append('g');
        group.append('line').attr('x1',cx).attr('x2',cx).attr('y1',y(lo)).attr('y2',y(hi)).attr('stroke','#527660');
        [lo,hi].forEach(v=>group.append('line').attr('x1',cx-bw/4).attr('x2',cx+bw/4).attr('y1',y(v)).attr('y2',y(v)).attr('stroke','#527660'));
        group.append('rect').attr('x',cx-bw/2).attr('y',y(s.q3)).attr('width',bw).attr('height',Math.max(1,y(s.q1)-y(s.q3))).attr('fill','#d5e1cb').attr('stroke','#688361').attr('rx',3);
        group.append('line').attr('x1',cx-bw/2).attr('x2',cx+bw/2).attr('y1',y(s.median)).attr('y2',y(s.median)).attr('stroke','#365b47').attr('stroke-width',2);
        valid.filter(r=>r[c.metric]<lo||r[c.metric]>hi).forEach((r,j)=>group.append('circle').attr('cx',cx+((j%5)-2)*3).attr('cy',y(r[c.metric])).attr('r',3).attr('fill','#bf8d63'));
        group.append('rect').attr('x',cx-bw/2-7).attr('y',top).attr('width',bw+14).attr('height',bottom-top).attr('fill','transparent');
        interactiveMark(group,valid,`${g.label}：中位数 ${fmt(s.median)}；Q1 ${fmt(s.q1)}；Q3 ${fmt(s.q3)}；有效记录 ${s.n}`);
      });
      title=`${field(c.metric).label} · 箱线分布`;
      caption=`箱体为 Q1–Q3，横线为中位数；须线止于 1.5×IQR 范围内的最远观测，散点为范围外观测，不等同于数据错误。${c.task==='compare'?'按有效记录数展示前 12 个分组。':'本图汇总全部有效数值。'}`;
      text(left,15,label(c.metric));
    } else if(chart==='scatter') {
      const valid=rows.filter(r=>Number.isFinite(r[c.x])&&Number.isFinite(r[c.y]));
      if(!valid.length)return empty('横纵轴均非空的配对记录不足。');
      const pad=values=>{const[a,b]=extent(values),p=(b-a)*.06;return[d3.min(values)>=0?Math.max(0,a-p):a-p,b+p];};
      const x=d3.scaleLinear().domain(pad(valid.map(r=>r[c.x]))).nice().range([left,W-right]),y=d3.scaleLinear().domain(pad(valid.map(r=>r[c.y]))).nice().range([bottom,top]);
      yaxis(y);xaxis(x);text(left,15,label(c.y));text(W-right,H-14,label(c.x),'end');
      if(interactive){const brush=d3.brush().extent([[left,top],[W-right,bottom]]).on('end',event=>{if(!event.sourceEvent||!event.selection)return;const[[x0,y0],[x1,y1]]=event.selection;onSelect(valid.filter(r=>x(r[c.x])>=x0&&x(r[c.x])<=x1&&y(r[c.y])>=y0&&y(r[c.y])<=y1).map(r=>r.__id));});svg.append('g').attr('class','plot-brush').call(brush);}
      const fit=D.relationship(valid,c.x,c.y);
      if(c.fit&&fit.slope!=null){const clipId=`clip-${host.id}`;svg.append('defs').append('clipPath').attr('id',clipId).append('rect').attr('x',left).attr('y',top).attr('width',W-left-right).attr('height',bottom-top);const[a,b]=d3.extent(valid,r=>r[c.x]);svg.append('path').attr('d',`M${x(a)},${y(fit.slope*a+fit.intercept)}L${x(b)},${y(fit.slope*b+fit.intercept)}`).attr('clip-path',`url(#clip-${host.id})`).attr('stroke','#b7845c').attr('stroke-width',2).attr('stroke-dasharray','7 4').attr('fill','none');}
      valid.forEach(r=>{
        const category=dataset.fields.find(f=>f.type==='category'&&!f.key.startsWith('__'));
        const identifier=category?r[category.key]:r.__id+1;
        const mark=svg.append('circle').attr('cx',x(r[c.x])).attr('cy',y(r[c.y])).attr('r',5).attr('fill','#668a70').attr('stroke','#fffdf7').attr('stroke-width',1);
        interactiveMark(mark,[r],`${identifier}：${field(c.x).label} ${fmt(r[c.x])}；${field(c.y).label} ${fmt(r[c.y])}`);
      });
      title=`${field(c.x).label} × ${field(c.y).label}`;
      caption=`${valid.length} 对有效观测；${rows.length-valid.length} 条存在空值的配对被排除。${fit.r==null?'数据不足或方差为零，无法计算 Pearson r。':`Pearson r = ${fit.r.toFixed(3)}。`}${c.fit&&fit.slope!=null?'虚线为含截距的最小二乘直线。':''}相关性不代表因果关系。${interactive?'在空白处拖动可框选，点击单点可查看对应记录。':''}`;
    } else if(chart==='line'||chart==='heatmap') {
      const valid=rows.filter(r=>Number.isFinite(r[c.date])&&Number.isFinite(r[c.metric]));
      if(!valid.length)return empty('时间与数值同时有效的记录不足。');
      const days=D.groupRows(valid,c.date).map(g=>({time:Number(g.label),value:D.stats(g.rows.map(r=>r[c.metric])).mean,rows:g.rows})).sort((a,b)=>a.time-b.time);
      if(chart==='line') {
        const x=d3.scaleUtc().domain(days.length===1?[days[0].time-864e5,days[0].time+864e5]:extent(days.map(d=>d.time))).range([left,W-right]),y=d3.scaleLinear().domain(extent(days.map(d=>d.value))).nice().range([bottom,top]);
        yaxis(y);xaxis(x,d3.utcFormat('%m-%d'),7);text(left,15,label(c.metric));text(W-right,H-14,'日期（UTC）','end');
        const byDay=new Map(days.map(d=>[d.time,d]));
        const span=(days.at(-1).time-days[0].time)/864e5;
        const pathData=span<=10000?d3.utcDay.range(new Date(days[0].time),new Date(days.at(-1).time+864e5)).map(d=>byDay.get(+d)||{time:+d,value:null}):days;
        svg.append('path').datum(pathData).attr('d',d3.line().defined(d=>d.value!=null).x(d=>x(d.time)).y(d=>y(d.value))).attr('fill','none').attr('stroke','#9fb399').attr('stroke-width',1.5);
        if(c.smooth){const avg=new Map(days.map((d,i)=>[d.time,{...d,value:d3.mean(days.slice(Math.max(0,i-6),i+1),r=>r.value)}]));svg.append('path').datum(pathData.map(d=>avg.get(d.time)||d)).attr('d',d3.line().defined(d=>d.value!=null).x(d=>x(d.time)).y(d=>y(d.value))).attr('fill','none').attr('stroke','#3e6951').attr('stroke-width',2.4);}
        if(interactive){const brush=d3.brushX().extent([[left,top],[W-right,bottom]]).on('end',event=>{if(!event.sourceEvent||!event.selection)return;const[a,b]=event.selection.map(x.invert);onSelect(valid.filter(r=>r[c.date]>=+a&&r[c.date]<=+b).map(r=>r.__id));});svg.append('g').attr('class','plot-brush').call(brush);}
        days.forEach(d=>{const mark=svg.append('circle').attr('cx',x(d.time)).attr('cy',y(d.value)).attr('r',days.length>100?2.6:4).attr('fill','#65866a');interactiveMark(mark,d.rows,`${new Date(d.time).toISOString().slice(0,10)}：${fmt(d.value)}`);});
        title=`${field(c.metric).label} · 时间趋势`;
        caption=`${days.length} 个有效观测日；同一天多条记录先取平均。${c.smooth?'浅线为每日均值，深线为当前及前 6 个有效观测日的平均；开头使用已有天数。':'折线连接每日均值。'}${span<=10000?'缺测日期保留断点。':'跨度超过 10,000 天，按观测日期连线。'}${interactive?'拖动空白区域选择时间区间。':''}`;
      } else {
        const months=d3.utcMonth.range(d3.utcMonth.floor(new Date(days[0].time)),d3.utcMonth.offset(d3.utcMonth.floor(new Date(days.at(-1).time)),1)).map(d=>d3.utcFormat('%Y-%m')(d));
        const visible=months.slice(0,24),cw=(W-130)/31,rh=24,L=100,T=35;
        size(Math.max(245,T+visible.length*rh+76));
        const color=d3.scaleSequential(d3.interpolateRgb('#eef2dd','#406b50')).domain(extent(days.map(d=>d.value)));
        const lookup=new Map(days.map(d=>[new Date(d.time).toISOString().slice(0,10),d]));
        d3.range(1,32).filter(day=>!options.compact||day===1||day%3===0).forEach(day=>text(L+(day-.5)*cw,19,day,'middle'));
        visible.forEach((month,i)=>{
          text(L-12,T+i*rh+15,month,'end');
          for(let day=1;day<=31;day++){
            const date=`${month}-${String(day).padStart(2,'0')}`;
            if(D.parseDate(date)===null)continue;
            const d=lookup.get(date),cell=svg.append('rect').attr('x',L+(day-1)*cw+1).attr('y',T+i*rh).attr('width',cw-3).attr('height',rh-3).attr('rx',3).attr('fill',d?color(d.value):'#ecede7');
            if(d)interactiveMark(cell,d.rows,`${date}：${fmt(d.value)} ${field(c.metric).unit}`);else cell.append('title').text(`${date}：无记录`);
          }
        });
        const legendY=T+visible.length*rh+22;
        d3.range(60).forEach(i=>svg.append('rect').attr('x',L+i*3).attr('y',legendY).attr('width',3.1).attr('height',9).attr('fill',color(days.every(d=>d.value===days[0].value)?days[0].value:color.domain()[0]+i/59*(color.domain()[1]-color.domain()[0]))));
        text(L,legendY+26,fmt(d3.min(days,d=>d.value)));text(L+180,legendY+26,fmt(d3.max(days,d=>d.value)),'end');text(L+205,legendY+9,`${label(c.metric)}；灰格 = 无记录`);
        title=`${field(c.metric).label} · 日历分布`;
        caption=`每行一个年月，每列一个日期；单元颜色表示每日均值。${months.length>24?'当前展示时间最早的 24 个月，其他月份仍保留在明细中。':''}不同长度的月份保留日历留白，无记录日期用灰格标记。${interactive?'点击单元可联动查看明细。':''}`;
      }
    }
    if(interactive){const marks=svg.selectAll('[data-mark][role=button]');marks.attr('tabindex',(d,i)=>i===0?0:-1).on('keydown.navigate',function(event){const items=marks.nodes(),index=items.indexOf(this);let next;if(['ArrowRight','ArrowDown'].includes(event.key))next=(index+1)%items.length;if(['ArrowLeft','ArrowUp'].includes(event.key))next=(index+items.length-1)%items.length;if(event.key==='Home')next=0;if(event.key==='End')next=items.length-1;if(next!=null){event.preventDefault();marks.attr('tabindex',-1);d3.select(items[next]).attr('tabindex',0);items[next].focus({preventScroll:true});}});}
    svg.selectAll('.plot-axis text').attr('font-family','inherit');
    return {title,caption,usable:rows.length};
  }
  window.LabCharts={render,names,fmt};
})();
