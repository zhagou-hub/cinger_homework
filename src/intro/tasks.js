import {tasks, concepts, sourceLinks} from '../data/ai-content.js';
import {svg, text, toolbar, esc} from '../visual/ui.js';

const branches = [
  {id:'classification',name:'识别与分类',question:'它是什么？',input:'零件图像',output:'合格 / 缺陷',color:'#507cae',detail:'把输入归入类别。比如检查一张零件图像，给出“合格”或“缺陷”的标签。'},
  {id:'estimation',name:'数值预测与估计',question:'未来是多少？',input:'历史需求记录',output:'下一期需求量',color:'#0b786f',detail:'从已知记录中估计未知数值。比如根据历史需求，预测下一期需要多少产品。'},
  {id:'generation',name:'内容生成',question:'能创造什么？',input:'描述与提示',output:'文本 / 图像 / 代码',color:'#b78340',detail:'根据提示与条件产生新内容。比如输入画面描述，生成相应的图像。'},
  {id:'decision',name:'决策与控制',question:'下一步怎么做？',input:'状态 + 目标 + 约束',output:'路线 / 行动方案',color:'#95618e',detail:'在目标和约束下选择行动。比如给出起点、终点和障碍，规划一条可行路线。'}
];
const centered = (x,y,value,extra='')=>text(x,y,value,'text-anchor="middle" '+extra);

function branchGraphic(branch,index,selected,narrow) {
  const {id,name,question,input,output,color}=branch;
  let body='', cx,cy;
  if(narrow) {
    cx=153;cy=188+index*125;
    body+=`<path d="M35 ${cy}H63" stroke="${color}" stroke-width="${selected?3:2}" fill="none"/>`;
    body+=`<rect x="63" y="${cy-37}" width="180" height="74" rx="15" fill="${selected?color+'16':'#fff'}" stroke="${color}" stroke-opacity="${selected?1:.3}" stroke-width="${selected?2:1}"/>`;
    body+=centered(cx,cy-4,name,'class="mindmap-category"')+centered(cx,cy+19,question,'class="mindmap-question"');
    for(const [label,value,offset] of [['输入',input,-24],['输出',output,26]]) {
      body+=`<path d="M243 ${cy}C258 ${cy} 260 ${cy+offset} 276 ${cy+offset}" fill="none" stroke="${color}" stroke-opacity=".5"/>`;
      body+=text(280,cy+offset-10,label,'class="mindmap-leaf-label"')+text(280,cy+offset+8,value,'class="mindmap-leaf"');
    }
  } else {
    cx=index%2?800:240;cy=index<2?78:319;
    const left=index%2===0, rootX=left?455:585, endX=left?341:699;
    body+=`<path d="M${rootX} ${index<2?211:260}C${left?393:647} ${index<2?169:289} ${left?404:636} ${cy} ${endX} ${cy}" fill="none" stroke="${color}" stroke-width="${selected?3.5:2.2}" stroke-linecap="round"/>`;
    body+=`<rect x="${cx-101}" y="${cy-33}" width="202" height="66" rx="18" fill="${selected?color+'16':'#fff'}" stroke="${color}" stroke-opacity="${selected?1:.3}" stroke-width="${selected?2:1}"/>`;
    body+=centered(cx,cy-3,name,'class="mindmap-category"')+centered(cx,cy+20,question,'class="mindmap-question"');
    for(const [label,value,offset] of [['输入',input,-91],['输出',output,91]]) {
      const tx=cx+offset,ty=cy+86;
      body+=`<path d="M${cx} ${cy+33}C${cx} ${cy+57} ${tx} ${cy+42} ${tx} ${ty-22}" fill="none" stroke="${color}" stroke-opacity=".45" stroke-width="1.6"/><circle cx="${tx}" cy="${ty-20}" r="3" fill="${color}" opacity=".65"/>`;
      body+=centered(tx,ty-6,label,'class="mindmap-leaf-label"')+centered(tx,ty+16,value,'class="mindmap-leaf"');
    }
  }
  return `<g class="task-map-branch ${selected?'selected':''}" data-task="${id}" role="button" tabindex="0" aria-pressed="${selected}" aria-label="${esc(name+'：'+question+' 输入'+input+'，输出'+output)}" style="--branch-color:${color}">${body}</g>`;
}

export function renderTasks(doc,state) {
  const current=branches.find(t=>t.id===state.selectedTaskId)||branches[0], narrow=doc.defaultView.innerWidth<700;
  const w=narrow?430:1040,h=narrow?634:463,rx=narrow?210:520,ry=narrow?66:235,r=narrow?49:66;
  let body=narrow?'<path d="M162 66H35V563" stroke="#cadbd6" stroke-width="2" fill="none"/>':'';
  body+=`<circle cx="${rx}" cy="${ry}" r="${r+10}" fill="#0b786f" opacity=".035"/><circle cx="${rx}" cy="${ry}" r="${r}" fill="#0b786f"/>`;
  body+=centered(rx,ry-8,'人工智能','class="mindmap-root"')+centered(rx,ry+18,'任务类别','class="mindmap-root-sub"');
  body+=branches.map((branch,i)=>branchGraphic(branch,i,current.id===branch.id,narrow)).join('');
  if(!narrow) body+=centered(520,345,'按目标与输出理解','class="mindmap-center-note"')+centered(520,369,'同一系统可以组合多类任务','class="mindmap-center-note"');
  const task=tasks.find(t=>t.id===current.id);
  doc.getElementById('tasks-visual').innerHTML=toolbar('AI 任务思维导图 · 点击分支查看说明','tasks')+`
    <div class="task-mindmap" style="--branch-color:${current.color}">
      ${svg('人工智能任务思维导图，四条分支分别连接典型输入与主要输出',body,w,h)}
      <div class="task-map-insight" role="status" aria-live="polite"><strong>${current.name}</strong><p>${current.detail}</p></div>
    </div>
    <div class="task-footer"><span>相关概念</span>${task.relatedConceptIds.map(id=>`<button class="ai-link" data-locate-concept="${id}">${concepts.find(c=>c.id===id).name} →</button>`).join('')}</div>
    <div class="ai-sources">${sourceLinks(['C6'])}</div>`;
}

