import {events, references} from '../data/ai-content.js';
import {svg, text, toolbar, esc} from '../visual/ui.js';

const themes = ['领域与检验', '知识与搜索', '学习与网络', '生成与预测'];
const colors = ['#677bb3', '#b78340', '#0b786f', '#95618e'];
const names = ['图灵测试', '达特茅斯', '专家系统', 'Deep Blue', 'AlexNet', 'AlphaGo', 'Transformer', 'ChatGPT', 'AlphaFold 3'];
const descriptions = [
  '用“模仿游戏”讨论机器的智能表现：通过交流中的可观察行为检验机器。',
  '1956 年夏季研究项目凝聚人工智能研究议程，语言、推理与学习进入共同的研究框架。',
  'R1 将计算机配置知识写成规则：当条件满足时，触发规则并形成配置方案。',
  'Deep Blue 战胜国际象棋世界冠军卡斯帕罗夫，展示搜索与计算在复杂决策中的作用。',
  '大规模标注图像与深度卷积网络结合，让模型从数据中学习图像特征并完成分类。',
  '神经网络与搜索协同，AlphaGo 在与李世石的围棋比赛中获胜。',
  '注意力机制组织序列中的信息交互，Transformer 架构在机器翻译等任务中得到验证。',
  '2022 年 11 月发布研究预览，对话式交互让公众直接体验语言模型的内容生成。',
  '2024 年论文将结构预测扩展到蛋白质、核酸等多种生物分子的相互作用。'
];

export function renderTimeline(doc, state) {
  const event = events.find(e => e.id === state.selectedEventId) || events[0];
  const index = events.indexOf(event), color = colors[themes.indexOf(event.method)];
  const narrow = doc.defaultView.innerWidth < 700;
  // Milestones alone have positions. Equal spacing keeps recent events readable.
  // Height forms a reading path, not a quantitative series.
  const points = narrow
    ? [[48,64],[170,64],[292,64],[292,158],[170,158],[48,158],[48,252],[170,252],[292,252]]
    : [[58,258],[173,220],[288,202],[403,236],[518,165],[633,184],[748,112],[863,134],[978,70]];
  const width = narrow ? 340 : 1036, height = 300;
  const path = points.map(([x,y],i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  let body = '<defs><linearGradient id="milestone-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b786f" stop-opacity=".12"/><stop offset="1" stop-color="#0b786f" stop-opacity="0"/></linearGradient></defs>';
  if (!narrow) body += `<path d="${path} L978 285 L58 285Z" fill="url(#milestone-fill)"/><line x1="58" y1="285" x2="978" y2="285" stroke="#dce8e7"/>`;
  body += `<path d="${path}" class="milestone-path" fill="none" stroke="#8dbab1" stroke-width="3" stroke-linejoin="round"/>`;
  events.forEach((e,i) => {
    const [x,y] = points[i], selected = e.id === event.id;
    const dimmed = state.highlightedMethod && state.highlightedMethod !== e.method;
    const c = colors[themes.indexOf(e.method)];
    body += `<g class="timeline-node ${selected ? 'selected' : ''}" role="button" tabindex="0" data-event="${e.id}" aria-label="${e.year} ${esc(e.name)}" aria-pressed="${selected}" opacity="${dimmed ? .28 : 1}">
      <title>${esc(e.year + ' · ' + e.name)}</title>
      <circle cx="${x}" cy="${y}" r="${selected ? 17 : 13}" fill="${c}" opacity="${selected ? .12 : 0}"/>
      <circle cx="${x}" cy="${y}" r="${selected ? 7 : 5.5}" fill="${c}" stroke="#fff" stroke-width="3"/>
      ${text(x,y-28,e.year,'text-anchor="middle" class="milestone-year"')}
      ${text(x,narrow ? y+26 : y-10,names[i],'text-anchor="middle" class="milestone-name"')}
      <rect x="${x-49}" y="${y-45}" width="98" height="80" fill="transparent"/>
    </g>`;
  });
  const visible = state.highlightedMethod ? events.filter(e => e.method === state.highlightedMethod) : events;
  const cursor = visible.indexOf(event);
  doc.getElementById('history-visual').innerHTML = toolbar('关键里程碑 · 点击节点阅读','history') + `
    <div class="milestone-legend" aria-label="技术路线">
      <button data-method="" aria-pressed="${!state.highlightedMethod}">全部路线</button>
      ${themes.map((m,i) => `<button data-method="${m}" aria-pressed="${state.highlightedMethod===m}"><i style="background:${colors[i]}"></i>${m}</button>`).join('')}
    </div>
    <div class="milestone-chart" style="--event-color:${color}">
      <div class="milestone-plot">${svg('人工智能发展里程碑：按事件顺序展开，点击节点显示图内说明',body,width,height)}</div>
      <div class="milestone-insight" aria-live="polite" aria-atomic="true" data-selected-event="${event.id}">
        <div class="milestone-date"><strong>${event.year}</strong><span>${event.method}</span></div>
        <div class="milestone-copy"><h3>${event.name}</h3><p>${descriptions[index]}</p>
          <div class="milestone-links"><a href="${references[event.source][2]}" target="_blank" rel="noopener noreferrer">原始出处 ↗</a><button class="ai-link" data-locate-concept="${event.relatedConceptIds[0]}">关联概念 →</button></div>
        </div>
        <div class="milestone-pager"><span>${String(cursor+1).padStart(2,'0')} / ${String(visible.length).padStart(2,'0')}</span><div><button id="event-prev" aria-label="上一事件" ${cursor<=0?'disabled':''}>←</button><button id="event-next" aria-label="下一事件" ${cursor===visible.length-1?'disabled':''}>→</button></div></div>
      </div>
    </div>
    <p class="ai-note milestone-note">仅标注精选事件年份；节点按时间先后等距展开，折线高度用于排布。</p>`;
}

