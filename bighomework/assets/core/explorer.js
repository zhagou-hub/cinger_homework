(function(g){
  'use strict';
  const A=g.ATLAS, E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const colors=['#157d70','#2d819e','#b17a39','#6e70ab','#c16249'];
  function thumb(sc){
    const idx=A.stages.findIndex(s=>s.id===sc.stageId),color=colors[idx%5];
    let p='';
    if(['geology','seismic','welllog','mudlogging'].includes(sc.stageId)){
      for(let j=0;j<8;j++){let d='';for(let i=0;i<41;i++){let y=24+j*13+Math.sin(i*.26+j*.5)*7+(i>23&&idx===1?13:0);d+=(i?'L':'M')+(14+i*6.6)+','+y.toFixed(1);}p+='<path d="'+d+'" stroke="'+color+'" opacity="'+(.22+j*.08)+'"/>';}
      p+='<path d="M175 12L147 135" stroke="#ba7547" stroke-width="2" stroke-dasharray="4 4"/>';
    }else if(['transport','workover','completion'].includes(sc.stageId)){
      const pts=[[30,75],[95,32],[95,112],[180,70],[267,35],[267,115]];
      [[0,1],[0,2],[1,3],[2,3],[3,4],[3,5]].forEach(([a,b])=>{p+='<path d="M'+pts[a].join(',')+'L'+pts[b].join(',')+'" stroke="'+color+'" opacity=".38" stroke-width="3"/>';});
      pts.forEach(([x,y],i)=>{p+='<circle cx="'+x+'" cy="'+y+'" r="'+(i===3?14:9)+'" fill="'+(i===3?color:'#e4efec')+'" stroke="'+color+'"/>';});
    }else{
      for(let i=0;i<24;i++){let x=22+i*11,y=110-Math.sin(i*.11+idx)*37-i*1.3;p+='<circle cx="'+x+'" cy="'+y+'" r="'+(3+(i%3))+'" fill="'+color+'" opacity=".6"/>';}
      p+='<path d="M20 125H285M20 125V18" stroke="#9ab2b2"/>';
    }
    return '<svg viewBox="0 0 300 150" aria-hidden="true"><rect width="300" height="150" fill="#f1f6f4"/><g fill="none">'+p+'</g></svg>';
  }
  function render(){return '<main class="wrap explorer-page"><div class="explorer-head"><div><span class="section-label">案例探索</span><h1>把问题带进实验室</h1><p>按环节、方法或关键词查找，在图表中观察参数怎样改变结果。</p></div><div class="explorer-total"><strong>'+g.Cases.list().length+'</strong><span>可运行案例</span></div></div><div class="explorer-layout"><aside class="explorer-sidebar" aria-label="案例筛选"><div class="filter-top"><b>筛选案例</b><button id="ex-reset" type="button">重置</button></div><label class="ex-search">关键词<input id="ex-search" type="search" placeholder="搜索场景、算法或案例" autocomplete="off"></label><h2>作业环节</h2><div id="ex-stage"></div><h2>AI 方法</h2><div id="ex-method"></div><h2>难度</h2><div class="ex-diffs">'+['全部','低','中','高'].map(x=>'<button data-diff="'+(x==='全部'?'':x)+'" type="button">'+x+'</button>').join('')+'</div><a class="ex-chain" href="#/chain">按完整作业链浏览 ↗</a><button class="btn primary" data-import>＋ 添加案例</button></aside><section class="explorer-results" aria-label="案例结果"><div class="results-toolbar"><div id="ex-count" role="status" aria-live="polite"></div><label>排序 <select id="ex-sort"><option value="stage">作业顺序</option><option value="recent">最近更新</option><option value="name">案例名称</option></select></label></div><div id="ex-active"></div><div id="ex-cards" class="ex-cards"></div><nav id="ex-pages" class="ex-pages" aria-label="案例分页"></nav><details class="ex-quality"><summary>案例内容完整性</summary><div id="ex-checks"></div></details></section></div></main>';}
  function bind(root,q){
    const state={stage:q.stage||'',m:q.m||'',diff:q.diff||'',search:q.q||'',sort:'stage',page:1};
    const all=g.Cases.list().filter(c=>A.index.byScene[c.sceneId]);
    const $=s=>root.querySelector(s);$('#ex-search').value=state.search;
    function apply(){
      const query=state.search.toLowerCase().trim();
      let list=all.filter(c=>{let sc=A.index.byScene[c.sceneId];return(!state.stage||sc.stageId===state.stage)&&(!state.m||(c.methods||sc.methods).includes(state.m))&&(!state.diff||sc.diff===state.diff)&&(!query||(c.title+' '+c.id+' '+sc.name+' '+sc.stageName+' '+sc.refs.join(' ')).toLowerCase().includes(query));});
      list.sort((a,b)=>state.sort==='recent'?String(b.updated).localeCompare(a.updated):state.sort==='name'?a.title.localeCompare(b.title,'zh-CN'):A.allScenes.indexOf(A.index.byScene[a.sceneId])-A.allScenes.indexOf(A.index.byScene[b.sceneId]));
      const pages=Math.max(1,Math.ceil(list.length/12));state.page=Math.min(state.page,pages);
      $('#ex-stage').innerHTML=[{id:'',name:'全部环节',idx:0},...A.stages].map(st=>'<button type="button" data-stage="'+st.id+'" aria-pressed="'+(st.id===state.stage)+'"><span>'+(st.idx?String(st.idx).padStart(2,'0')+'　':'')+E(st.name)+'</span><b>'+all.filter(c=>!st.id||A.index.byScene[c.sceneId].stageId===st.id).length+'</b></button>').join('');
      $('#ex-method').innerHTML=[{key:'',name:'全部方法',abbr:''},...Object.values(A.methods)].map(m=>'<button type="button" data-method="'+m.key+'" aria-pressed="'+(m.key===state.m)+'"><span>'+E((m.abbr?m.abbr+' · ':'')+m.name)+'</span><b>'+all.filter(c=>!m.key||(c.methods||A.index.byScene[c.sceneId].methods).includes(m.key)).length+'</b></button>').join('');
      root.querySelectorAll('[data-diff]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.diff===state.diff)));
      $('#ex-count').innerHTML='<b>'+list.length+'</b> 个案例 <span> / 共 '+all.length+' 个</span>';
      $('#ex-active').textContent=[state.stage&&A.index.byStage[state.stage].name,state.m&&A.methods[state.m].name,state.diff&&state.diff+'难度',state.search].filter(Boolean).join(' / ');
      $('#ex-cards').innerHTML=list.slice((state.page-1)*12,state.page*12).map(c=>{const sc=A.index.byScene[c.sceneId],url='#/scene/'+sc.id+'?case='+c.id;return '<article class="ex-card"><a class="ex-preview" href="'+url+'&tab=demo" aria-label="演示：'+E(sc.name)+'">'+(c.preview?'<img src="'+E(c.preview)+'" alt="'+E(sc.name)+'默认教学图" loading="lazy" width="760" height="400">':thumb(sc))+'<span>运行演示 ↗</span></a><div class="ex-card-body"><div class="ex-meta"><span>'+E(sc.stageName)+' · '+sc.id.toUpperCase()+'</span><span>'+sc.diff+'难度</span></div><h2><a href="'+url+'">'+E(sc.name)+'</a></h2><p>'+E(c.title)+'</p><div class="ex-tags">'+(c.methods||sc.methods).map(k=>'<span data-m="'+k+'">'+A.methods[k].abbr+' '+A.methods[k].name+'</span>').join('')+'</div><div class="ex-card-footer"><a href="'+url+'">背景与流程 →</a><a href="'+url+'&tab=demo">进入演示 ↗</a></div>'+(c.imported?'<a class="link-remove" data-remove-case="'+E(c.id)+'" href="#">移除本地导入</a>':'')+'</div></article>';}).join('')||'<div class="ex-empty"><h2>没有匹配的案例</h2><p>尝试更短的关键词，或清除筛选条件。</p><button class="btn" data-ex-clear>重置筛选</button></div>';
      $('#ex-pages').innerHTML=Array.from({length:pages},(_,i)=>'<button type="button" data-page="'+(i+1)+'" aria-current="'+(state.page===i+1?'page':'false')+'">'+(i+1)+'</button>').join('');
      const checks=g.Cases.validateAll();let errors=Object.values(checks).flat().filter(x=>x.level==='error').length;
      $('#ex-checks').textContent=all.length+' 个案例 · '+all.filter(x=>x.tabs.background&&x.tabs.workflow&&x.tabs.demo).length+' 个包含背景、流程和演示 · '+errors+' 项校验错误。';
      const params=new URLSearchParams();if(state.stage)params.set('stage',state.stage);if(state.m)params.set('m',state.m);if(state.diff)params.set('diff',state.diff);if(state.search)params.set('q',state.search);
      try{history.replaceState(null,'','#/cases'+(params.size?'?'+params:''));}catch(_){}
    }
    $('.explorer-page').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
      if(b.dataset.stage!==undefined){state.stage=b.dataset.stage;state.page=1;}
      else if(b.dataset.method!==undefined){state.m=b.dataset.method;state.page=1;}
      else if(b.dataset.diff!==undefined){state.diff=b.dataset.diff;state.page=1;}
      else if(b.dataset.page){state.page=+b.dataset.page;$('.explorer-results').scrollIntoView({block:'start'});}
      else if(b.id==='ex-reset'||b.hasAttribute('data-ex-clear')){Object.assign(state,{stage:'',m:'',diff:'',search:'',page:1});$('#ex-search').value='';}
      else return;apply();
    });
    $('#ex-search').addEventListener('input',e=>{state.search=e.target.value;state.page=1;apply();});$('#ex-sort').addEventListener('change',e=>{state.sort=e.target.value;state.page=1;apply();});apply();
  }
  function chain(){return '<main class="wrap chain-page chain-v3"><div class="explorer-head"><div><span class="section-label">作业链</span><h1>一条链，看懂石油全流程</h1><p>13 个环节依次展开，每个场景都能直接进入交互演示。</p></div><div class="explorer-total"><strong>61</strong><span>完整场景</span></div></div><nav class="phase-nav" aria-label="阶段导航"><a href="#chain-explore">01 勘探与评价</a><a href="#chain-develop">02 开发与生产</a><a href="#chain-process">03 加工与储运</a></nav>'+A.stages.map((st,i)=>'<section class="chain-stage" id="'+(i===0?'chain-explore':i===5?'chain-develop':i===11?'chain-process':'chain-'+st.id)+'"><div class="chain-stage-intro"><span>'+String(st.idx).padStart(2,'0')+'</span><h2><a href="#/stage/'+st.id+'">'+st.name+' ↗</a></h2><p>'+E(st.blurb)+'</p><b>'+st.scenes.length+' 个场景</b></div><div class="chain-scene-links">'+st.scenes.map(sc=>'<a href="#/scene/'+sc.id+'?tab=demo"><span>'+sc.id.toUpperCase()+'</span><strong>'+E(sc.name)+'</strong><small>'+sc.methods.map(k=>A.methods[k].abbr).join(' / ')+'</small><i>演示 ↗</i></a>').join('')+'</div></section>').join('')+'</main>';}
  g.AtlasExplorer={render,bind,chain};
})(window);
