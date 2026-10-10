import {oneHot} from './model.js';
import {svg, text, toolbar, num} from '../visual/ui.js';
import {sourceLinks} from '../data/ai-content.js';
export function renderRepresentation(doc, data, state) {
  const priorGrid=doc.querySelector('[data-pixel-surface="grid"]');
  const previousPixels=priorGrid&&priorGrid.dataset.expanded!==String(state.pixelExpansion)?new Map([...priorGrid.querySelectorAll('[id^="grid-pixel-"]')].map(node=>[node.id,node.getBoundingClientRect()])):null;
  const {pixels, tokens, vocabulary}=data.representation, {x,y}=state.selectedPixel;
  const sx=Math.min(12,Math.max(0,x-1)),sy=Math.min(12,Math.max(0,y-1));
  const draw=(expanded=false, original=false)=>{
    const gap=expanded?2:0,cell=14,offset=15;
    let body='';pixels.forEach((row,py)=>row.forEach((v,px)=>{const selected=px===x&&py===y;body+=`<rect id="${original?'original':'grid'}-pixel-${px}-${py}" data-pixel="${px},${py}" x="${offset+px*(cell+gap)}" y="${offset+py*(cell+gap)}" width="${cell}" height="${cell}" fill="rgb(${v},${v},${v})" class="pixel-cell"/>${selected?`<rect x="${offset+px*(cell+gap)-1}" y="${offset+py*(cell+gap)-1}" width="${cell+2}" height="${cell+2}" fill="none" stroke="#d58a1f" stroke-width="2" pointer-events="none"/>`:''}`;}));
    body+=`<rect x="${offset+sx*(cell+gap)-2}" y="${offset+sy*(cell+gap)-2}" width="${4*(cell+gap)-gap+4}" height="${4*(cell+gap)-gap+4}" fill="none" stroke="#0b786f" stroke-width="2" pointer-events="none"/>`;
    body+=text(offset,expanded?292:261,original?'原图 · 同一灰度矩阵':expanded?'空间次序保持 · 像素已展开':'相邻像素紧排');
    return svg(original?'完整16×16灰度图':'保持空间次序的像素网格',body,expanded?284:256,expanded?307:277,`class="pixel-svg" data-pixel-surface="${original?'original':'grid'}" data-expanded="${expanded}"`);
  };
  let content;
  if(state.representationMode==='image'){
    content=`<div class="representation-image"><div><p class="ai-kicker">01 / 完整图像</p>${draw(false,true)}</div><div><p class="ai-kicker">02 / ${state.pixelExpansion?'展开像素':'紧排像素'}</p>${draw(state.pixelExpansion)}</div><div class="pixel-values"><p class="ai-kicker">03 / 当前 4×4 选区</p><table aria-label="选区灰度数值"><tbody>${pixels.slice(sy,sy+4).map((row,dy)=>`<tr>${row.slice(sx,sx+4).map((v,dx)=>`<td><button data-pixel="${sx+dx},${sy+dy}" aria-label="像素 x ${sx+dx} y ${sy+dy} 灰度 ${v}" aria-pressed="${sx+dx===x&&sy+dy===y}">${v}</button></td>`).join('')}</tr>`).join('')}</tbody></table><p class="pixel-readout">像素 (${x}, ${y})<strong>${pixels[y][x]} <small>/ 255</small></strong></p><div class="grayscale-key"></div><div class="ai-scale"><span>0 · 黑</span><span>255 · 白</span></div></div></div><div class="ai-controls"><button id="expand-pixels" aria-pressed="${state.pixelExpansion}">${state.pixelExpansion?'还原图像':'展开像素'}</button><label>像素 x <input id="pixel-x" type="number" min="0" max="15" step="1" value="${x}"></label><label>像素 y <input id="pixel-y" type="number" min="0" max="15" step="1" value="${y}"></label></div><p class="ai-note">拖动或点选图像，同一选区与数字同步。高亮外框不改变灰度；x 向右、y 向下，索引为 0—15。</p>`;
  }else{
    const token=tokens[state.selectedToken],index=vocabulary.indexOf(token),vector=oneHot(index,vocabulary.length);
    content=`<p class="ai-kicker">简化教学词表 · 独热编码</p><div class="representation-text"><div><p class="ai-kicker">01 / 短文本与词元</p><p class="token-sentence">${tokens.join(' ')}</p><div class="token-list">${tokens.map((t,i)=>`<button data-token="${i}" aria-pressed="${i===state.selectedToken}">${t}<small>词元 ${i+1}</small></button>`).join('')}</div></div><div><p class="ai-kicker">02 / 固定词表索引</p><div class="vocabulary-list">${vocabulary.map((v,i)=>`<div class="${i===index?'selected':''}"><span>${i}</span><strong>${v}</strong></div>`).join('')}</div></div><div><p class="ai-kicker">03 / 实际 0/1 向量</p><div class="one-hot">${vector.map((v,i)=>`<div class="${v?'selected':''}"><span>${i}</span><strong>${v}</strong></div>`).join('')}</div><p class="ai-note">编号 ${index} → 向量长度 ${vocabulary.length}<br>只有索引 ${index} 为 1；重复词元采用相同编码。</p></div></div><p class="ai-note">真实词元也可能是词的一部分或字符。编号表示索引，独热编码不表达语义相似度，也不复现语言模型嵌入。</p>`;
  }
  doc.getElementById('representation-visual').innerHTML=toolbar('原始信息与数值逐项对应','representation')+`<div class="ai-controls"><button data-representation="image" aria-pressed="${state.representationMode==='image'}">图像</button><button data-representation="text" aria-pressed="${state.representationMode==='text'}">文本</button></div>${content}<p class="mechanism-takeaway">原始信息变为数值表示后，才能被模型用于计算与学习。</p><div class="ai-sources">${sourceLinks([state.representationMode==='image'?'R8':'R10'])}</div>`;
  if(previousPixels&&!doc.defaultView.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
    const grid=doc.querySelector('[data-pixel-surface="grid"]');
    const scale=grid?.getScreenCTM?.()?.a||1;
    grid?.querySelectorAll('[id^="grid-pixel-"]').forEach(node=>{const before=previousPixels.get(node.id),after=node.getBoundingClientRect();if(before&&node.animate)node.animate([{transform:`translate(${(before.left-after.left)/scale}px, ${(before.top-after.top)/scale}px) scale(${before.width/after.width})`},{transform:'none'}],{duration:400,easing:'ease-out'});});
  }
}
