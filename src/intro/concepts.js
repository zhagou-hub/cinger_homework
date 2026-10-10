import {concepts, events, tasks, sourceLinks} from '../data/ai-content.js';
import {toolbar} from '../visual/ui.js';

const membership = new Set(['learning','deep','knowledge','search','expert','supervised','unsupervised','self','reinforcement','network','cnn','transformer','llm']);
const positions = [[500,236],[380,163],[597,313],[153,156],[139,313],[200,233],[313,75],[113,70],[863,246],[841,165],[728,81],[903,83],[661,162],[824,330],[513,75],[346,318],[500,399],[123,395],[278,398],[731,402],[898,403],[81,239]];
const mobilePositions = [[210,274],[150,212],[267,337],[93,143],[71,393],[87,275],[85,77],[283,74],[354,272],[335,154],[346,212],[56,214],[264,208],[178,403],[209,132],[117,339],[333,409],[89,459],[270,461],[113,517],[318,517],[351,340]];
const relationType = label => /属于|包含/.test(label) ? 'membership' : 'extension';

export function renderConcepts(doc, state) {
  const current = concepts.find(c => c.id === state.selectedConceptId) || concepts[0];
  const related = current.relations;
  const narrow = doc.defaultView.innerWidth < 700;
  const layout = narrow ? mobilePositions : positions, width = narrow ? 420 : 1000, height = narrow ? 570 : 460;
  const words = concepts.map((c,i) => {
    const [x,y] = layout[i], selected = c.id === current.id;
    const type = c.id === 'ai' ? 'root' : membership.has(c.id) ? 'membership' : 'extension';
    return `<button class="cloud-word level-${c.level} ${selected?'selected':''} ${related.some(r=>r.to===c.id)?'related':''}" style="left:${x/width*100}%;top:${y/height*100}%;--word-color:${type==='extension'?'#b27b35':'#0b786f'}" data-concept="${c.id}" data-concept-type="${type}" aria-pressed="${selected}">${c.name}</button>`;
  }).join('');
  const local = related.map(({to,label,id}) => {
    const target = concepts.find(c => c.id === to), type = relationType(label);
    return `<div class="local-relation ${state.selectedRelationId===id?'selected':''}" data-relation-type="${type}"><span>${current.name}</span><button class="relation-label" data-relation="${id}" aria-pressed="${state.selectedRelationId===id}">${label} →</button><button class="ai-link" data-concept="${target.id}">${target.name}</button></div>`;
  }).join('');
  doc.getElementById('concepts-visual').innerHTML = toolbar('从中心概念向外探索','concepts') + `
    <div class="cloud-legend"><span><i style="background:#0b786f"></i>包含 / 属于关系</span><span><i style="background:#b27b35"></i>应用 / 延伸关系</span><small>点击词语，查看它与其他概念的关系</small></div>
    <div class="concept-cloud ${narrow?'mobile-cloud':''}" style="aspect-ratio:${width}/${height}">${words}</div>
    <div class="concept-insight" aria-live="polite">
      <div class="concept-summary"><p class="ai-kicker">${current.dimension}</p><h3>${current.name}</h3><p>${current.definition}</p><p class="concept-example">例如：${current.example}</p></div>
      <div><div class="local-relations" aria-label="有类型的局部概念关系">${local}</div><div class="concept-jumps">${current.relatedEventIds.slice(0,1).map(id=>`<button class="ai-link" data-locate-event="${id}">${events.find(e=>e.id===id).year} 年相关事件 →</button>`).join('')}${current.relatedTaskIds.slice(0,1).map(id=>`<button class="ai-link" data-locate-task="${id}">${tasks.find(t=>t.id===id).name} →</button>`).join('')}</div></div>
    </div>
    <div class="concept-footer"><p class="ai-note">字号表示概念层级；选择后位置保持稳定。</p><div class="ai-sources">${sourceLinks(current.sources)}</div></div>`;
}

