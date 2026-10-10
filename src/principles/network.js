import {learningBatch,newInputs,forwardNetwork,networkHistory} from './network-model.js';

const stages={
  training:[['向前计算','输入信息通过各层连接，形成当前预测。'],['比较结果','把当前预测与目标对照，找出差距。'],['向后反馈','误差向后传递，计算各条连接该怎样调整。'],['更新权重','调整连接权重，再用新参数继续学习。']],
  inference:[['接收新输入','新的数值进入已经训练好的网络。'],['隐藏层计算','按固定的连接权重，把输入组合成新的信号。'],['形成输出','信号到达输出层，得到本次计算的结果。']]
};
const positions={input:[[75,95],[75,175],[75,255]],hidden:[[280,70],[280,140],[280,210],[280,280]],output:[[485,175]]};

function networkMarkup(kind){
  let wires='';
  const signalLine=(name,x1,y1,x2,y2)=>{const length=Math.hypot(x2-x1,y2-y1),dx=(x2-x1)/length*34,dy=(y2-y1)/length*34;return `<line class="nn-signal ${name}" x1="${x1+dx}" y1="${y1+dy}" x2="${x2-dx}" y2="${y2-dy}"/>`;};
  for(let j=0;j<4;j++)for(let i=0;i<3;i++){
    const [x1,y1]=positions.input[i],[x2,y2]=positions.hidden[j];
    wires+=`<g><line class="nn-wire" data-edge="${j},${i}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>${signalLine('nn-input-signal',x1,y1,x2,y2)}</g>`;
  }
  for(let j=0;j<4;j++){
    const [x1,y1]=positions.hidden[j],[x2,y2]=positions.output[0];
    wires+=`<g><line class="nn-wire" data-output-edge="${j}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>${signalLine('nn-output-signal',x1,y1,x2,y2)}</g>`;
  }
  const nodes=Object.entries(positions).flatMap(([layer,points])=>points.map(([x,y],i)=>`<g data-neuron="${layer},${i}" class="nn-neuron"><circle class="nn-halo" cx="${x}" cy="${y}" r="32"/><circle class="nn-unit" cx="${x}" cy="${y}" r="24"/><text class="nn-value" x="${x}" y="${y+5}" text-anchor="middle"></text></g>`)).join('');
  return `<svg class="nn-network" data-kind="${kind}" data-phase="0" viewBox="0 0 560 340" role="img" aria-label="三输入、四隐藏单元、一输出的神经网络"><title>神经网络的输入层、隐藏层与输出层</title><defs><marker id="${kind}-forward-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#0b786f"/></marker><marker id="${kind}-backward-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#cf925d"/></marker></defs><text class="nn-layer-label" x="75" y="27" text-anchor="middle">输入层</text><text class="nn-layer-label" x="280" y="27" text-anchor="middle">隐藏层</text><text class="nn-layer-label" x="485" y="27" text-anchor="middle">输出层</text>${wires}${nodes}</svg>`;
}

function mountScene(doc,kind){
  const phases=stages[kind],title=kind==='training'?'神经网络怎样学会调整自己的判断？':'训练好的网络，怎样处理一个新输入？';
  doc.getElementById(`${kind}-visual`).innerHTML=`<div class="ai-toolbar"><strong>${title}</strong><button class="ai-link ai-focus-trigger" data-focus="${kind}" aria-label="放大查看${kind==='training'?'模型训练':'任务推理'}">放大查看 ⤢</button></div><div class="nn-controls"><span class="nn-status" role="status"></span><div class="nn-step-buttons"><button data-nn-prev="${kind}">← 上一步</button><button data-nn-next="${kind}">下一步 →</button><button class="nn-reset" data-nn-reset="${kind}" aria-label="从头查看${kind==='training'?'训练':'推理'}流程">从头查看 ↺</button></div></div><ol class="nn-phases" aria-label="${kind==='training'?'训练':'推理'}流程步骤">${phases.map(([name],i)=>`<li><button data-nn-phase="${kind}" data-phase-index="${i}" aria-pressed="false"><span>0${i+1}</span>${name}</button></li>`).join('')}</ol><div class="nn-scene"><div class="nn-network-wrap">${networkMarkup(kind)}<div class="nn-visual-key"><span><i class="nn-key-signal"></i>亮度：信号强弱</span><span><i class="nn-key-weight"></i>粗细：连接权重</span></div></div><aside class="nn-observation"><div class="nn-phase-copy"><span></span><h3></h3><p></p></div><div class="nn-result"></div>${kind==='training'?'<div class="nn-error"><span>平均预测误差</span><strong></strong><svg viewBox="0 0 220 84" role="img" aria-label="教学网络在整批样本上的平均绝对预测误差"><title>平均预测误差随训练减小</title><line x1="8" y1="74" x2="212" y2="74" stroke="#dce5eb"/><polyline fill="none" stroke="#0b786f" stroke-width="2.5"/><circle r="3.5" fill="#0b786f"/></svg></div>':'<div class="nn-fixed">连接权重始终固定</div>'}</aside></div>`;
}

export function initNetworkScenes(doc){
  const history=networkHistory(),finalModel=history.at(-1).model;
  const state={training:{step:0,phase:0,round:0,sampleIndex:4},inference:{step:0,phase:0,inputIndex:0}};
  const lastStep=kind=>kind==='training'?(history.length-1)*4-1:newInputs.length*3-1;

  function render(kind){
    const s=state[kind],root=doc.getElementById(`${kind}-visual`),learnedRound=kind==='training'?s.round+(s.phase===3?1:0):history.length-1,model=history[learnedRound].model,input=kind==='training'?learningBatch[s.sampleIndex].input:newInputs[s.inputIndex],result=forwardNetwork(model,input),graph=root.querySelector('.nn-network');
    graph.dataset.phase=String(s.phase);
    root.querySelectorAll('[data-phase-index]').forEach(n=>{const current=Number(n.dataset.phaseIndex)===s.phase;n.classList.toggle('active',current);n.setAttribute('aria-pressed',String(current));if(current)n.setAttribute('aria-current','step');else n.removeAttribute('aria-current');});
    root.querySelectorAll('.nn-signal').forEach(n=>{const backward=kind==='training'&&s.phase===2;n.setAttribute('marker-start',backward?`url(#${kind}-backward-arrow)`:'none');n.setAttribute('marker-end',backward?'none':`url(#${kind}-forward-arrow)`);});
    root.querySelectorAll('[data-edge]').forEach(n=>{const [j,i]=n.dataset.edge.split(',').map(Number),w=model.weights[j][i];n.setAttribute('stroke-width',String(.65+Math.abs(w)*.85));n.dataset.weight=String(w);});
    root.querySelectorAll('[data-output-edge]').forEach(n=>{const w=model.outputWeights[Number(n.dataset.outputEdge)];n.setAttribute('stroke-width',String(.65+Math.abs(w)*.85));n.dataset.weight=String(w);});
    root.querySelectorAll('[data-neuron]').forEach(n=>{
      const [layer,i]=n.dataset.neuron.split(','),value=layer==='input'?input[Number(i)]:layer==='hidden'?result.hidden[Number(i)]:result.output;
      const active=kind==='training'||layer==='input'||s.phase>=(layer==='hidden'?1:2);
      const circle=n.querySelector('.nn-unit');
      circle.setAttribute('fill',active?`rgb(${Math.round(231-213*value)},${Math.round(240-121*value)},${Math.round(239-130*value)})`:'#f3f6f8');
      n.classList.toggle('active',active);n.querySelector('.nn-value').textContent=active?value.toFixed(2):'·';n.querySelector('.nn-value').style.fill=active&&value>.6?'#fff':'#335e58';
    });
    const phase=stages[kind][s.phase];root.querySelector('.nn-phase-copy>span').textContent=`0${s.phase+1} / 0${stages[kind].length}`;root.querySelector('.nn-phase-copy h3').textContent=phase[0];root.querySelector('.nn-phase-copy p').textContent=phase[1];
    const outputReady=kind==='training'||s.phase>=2;
    root.querySelector('.nn-result').innerHTML=kind==='training'?`<div><span>当前预测</span><strong>${outputReady?result.output.toFixed(2):'—'}</strong></div><div><span>目标</span><strong>${learningBatch[s.sampleIndex].target.toFixed(2)}</strong></div>`:`<span>模型输出</span><strong>${outputReady?result.output.toFixed(2):'—'}</strong>`;
    root.querySelector('.nn-status').textContent=kind==='training'?`第 ${s.phase+1} / 4 步 · 已学习 ${history[learnedRound].epoch} 轮`:`第 ${s.phase+1} / 3 步 · 新输入 ${s.inputIndex+1} / ${newInputs.length}`;
    root.querySelector('[data-nn-prev]').disabled=s.step===0;
    const next=root.querySelector('[data-nn-next]');next.disabled=s.step===lastStep(kind);next.textContent=next.disabled?'已查看完毕':s.phase===stages[kind].length-1?kind==='training'?'下一轮学习 →':'下一组输入 →':'下一步 →';
    if(kind==='training'){
      root.querySelector('.nn-error>strong').textContent=history[learnedRound].error.toFixed(3);
      const points=history.slice(0,learnedRound+1).map((r,i)=>[8+i/(history.length-1)*204,74-r.error/.55*62]);
      root.querySelector('.nn-error polyline').setAttribute('points',points.map(p=>p.join(',')).join(' '));const [x,y]=points.at(-1);root.querySelector('.nn-error circle').setAttribute('cx',x);root.querySelector('.nn-error circle').setAttribute('cy',y);
    }
  }

  function goTo(kind,step){
    const s=state[kind];s.step=Math.max(0,Math.min(lastStep(kind),step));s.phase=s.step%stages[kind].length;
    if(kind==='training'){s.round=Math.floor(s.step/4);s.sampleIndex=s.round%2?0:4;}
    else s.inputIndex=Math.floor(s.step/3);
    render(kind);
  }

  for(const kind of ['training','inference']){mountScene(doc,kind);render(kind);}
  doc.addEventListener('click',e=>{
    const button=e.target.closest('[data-nn-prev],[data-nn-next],[data-nn-reset],[data-nn-phase]');if(!button||button.disabled)return;
    const kind=button.dataset.nnPrev||button.dataset.nnNext||button.dataset.nnReset||button.dataset.nnPhase,s=state[kind];
    if(button.hasAttribute('data-nn-prev'))goTo(kind,s.step-1);
    else if(button.hasAttribute('data-nn-next'))goTo(kind,s.step+1);
    else if(button.hasAttribute('data-nn-reset'))goTo(kind,0);
    else goTo(kind,s.step-s.phase+Number(button.dataset.phaseIndex));
  });
  return {state,history,finalModel,goTo,render};
}
