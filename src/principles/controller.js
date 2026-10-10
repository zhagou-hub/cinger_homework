import {renderRepresentation} from './representation.js';
import {renderCompute,renderDataGrowth} from './growth.js';
import {initNetworkScenes} from './network.js';

const heading = (label,id) => `<div class="ai-toolbar"><strong>${label}</strong>${id?`<button class="ai-link ai-focus-trigger" data-focus="${id}" aria-label="放大查看${label}">放大查看 ⤢</button>`:''}</div>`;
function renderOrigins(doc){
  doc.getElementById('origins-visual').innerHTML=heading('三种条件汇合，推动 AI 发展','origins')+`<div class="origin-factors"><div><span class="factor-symbol">01 / DATA</span><div class="factor-icon data-icon" aria-hidden="true">${'<i></i>'.repeat(9)}</div><h3>数据更丰富</h3><p>文本、图像、业务记录<br>提供更多学习材料</p></div><span class="factor-plus" aria-hidden="true">+</span><div><span class="factor-symbol">02 / COMPUTE</span><div class="factor-icon chip-icon" aria-hidden="true"><i></i></div><h3>算力更强</h3><p>GPU 与计算集群<br>支撑大规模运算</p></div><span class="factor-plus" aria-hidden="true">+</span><div><span class="factor-symbol">03 / ALGORITHM</span><div class="factor-icon algorithm-icon" aria-hidden="true"><i>→</i><i>↻</i></div><h3>算法持续进步</h3><p>深度学习与新架构<br>改进学习方法</p></div></div><div class="origin-result"><span aria-hidden="true">↓</span><strong>更大规模的学习 → 更丰富的模型能力 → 更广泛的应用</strong></div><p class="mechanism-takeaway">这三种条件相互配合：有材料可学、有能力计算，也有方法把计算转化为能力。</p><p class="ai-note">图形是机制概括，不表示各因素的贡献比例。下方分别观察算力与数据的变化。</p>`;
}

export function initPrinciples(doc,data){
  const initial=()=>({representationMode:'image',selectedPixel:{x:7,y:7},selectedToken:0,pixelExpansion:false});
  const state=initial();let drag=null;
  const renderRepresentationView=()=>renderRepresentation(doc,data,state);
  const renderAll=()=>{renderOrigins(doc);renderCompute(doc);renderDataGrowth(doc);renderRepresentationView();};
  const selectPixel=value=>{const [x,y]=value.split(',').map(Number);state.selectedPixel={x,y};renderRepresentationView();};
  doc.addEventListener('click',e=>{
    const t=e.target.closest('button,[data-pixel]');if(!t)return;let selector;
    if(t.dataset.representation){state.representationMode=t.dataset.representation;renderRepresentationView();selector=`[data-representation="${t.dataset.representation}"]`;}
    else if(t.dataset.pixel){selectPixel(t.dataset.pixel);selector=`.pixel-values [data-pixel="${t.dataset.pixel}"]`;}
    else if(t.hasAttribute('data-token')){state.selectedToken=Number(t.dataset.token);renderRepresentationView();selector=`[data-token="${t.dataset.token}"]`;}
    else if(t.id==='expand-pixels'){state.pixelExpansion=!state.pixelExpansion;renderRepresentationView();selector='#expand-pixels';}
    else if(t.id==='reset-demo'){Object.assign(state,initial());renderRepresentationView();selector='#reset-demo';}
    if(selector)doc.querySelector(selector)?.focus({preventScroll:true});
  });
  doc.addEventListener('change',e=>{const t=e.target;if(t.id!=='pixel-x'&&t.id!=='pixel-y')return;if(t.value===''||!t.validity.valid)return;state.selectedPixel[t.id==='pixel-x'?'x':'y']=Number(t.value);renderRepresentationView();doc.getElementById(t.id)?.focus({preventScroll:true});});
  doc.addEventListener('pointerdown',e=>{const pixel=e.target.closest('[data-pixel]');if(pixel?.closest('svg')){e.preventDefault();const surface=pixel.closest('svg');drag={rect:surface.getBoundingClientRect(),expanded:surface.dataset.pixelSurface==='grid'&&state.pixelExpansion};selectPixel(pixel.dataset.pixel);}});
  doc.addEventListener('pointermove',e=>{if(!drag)return;const w=drag.expanded?284:256,h=drag.expanded?307:277,cell=drag.expanded?16:14,x=Math.floor(((e.clientX-drag.rect.left)/drag.rect.width*w-15)/cell),y=Math.floor(((e.clientY-drag.rect.top)/drag.rect.height*h-15)/cell);if(x>=0&&x<16&&y>=0&&y<16)selectPixel(`${x},${y}`);});
  const release=()=>{drag=null;};doc.addEventListener('pointerup',release);doc.addEventListener('pointercancel',release);doc.defaultView.addEventListener('pagehide',release);
  renderAll();const networks=initNetworkScenes(doc);return {state,networks,renderRepresentation:renderRepresentationView,redraw:()=>{}};
}
