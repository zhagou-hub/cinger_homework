'use strict';
const chapters = [
  { id: 1, title: '数据', category: 'foundation', count: 5, description: '基于合成新生数据的数据属性、数据变换与 D3 选择器应用。', tags: ['DIKW', '测量尺度', 'Data-Join'], keywords: 'DeepSeek 数组 map filter reduce Stevens Mackinlay 数据生成 信息 知识 智慧' },
  { id: 2, title: '数据可视化流程', category: 'foundation', count: 4, description: '数据聚合、视觉映射、视图渲染与用户交互的完整流程。', tags: ['Card 模型', '树布局', '用户交互'], keywords: 'rollup Reingold Tilford 数据分类树 DOM 事件委托 流程' },
  { id: 3, title: '色彩专题', category: 'visual', count: 8, description: '颜色空间、科学配色方法与色觉友好可视化设计。', tags: ['颜色空间', 'Colormap', '色觉友好'], keywords: 'RGB HSL Lab CVD 色盲 Wong Paul Tol 配色 色带' },
  { id: 4, title: '低维数据可视化', category: 'visual', count: 5, description: '数据的二维空间映射：坐标变换、曲线拟合与等值线提取。', tags: ['坐标变换', '曲线拟合', '等值线'], keywords: 'Crime Cleveland 45度 倾角 Marching Squares 空间' },
  { id: 5, title: '时序数据可视化', category: 'time', count: 5, description: '时间趋势与周期模式的可视化：日历热图、螺旋日历与故事线。', tags: ['日历热图', '螺旋日历', 'Storyline'], keywords: '时间 法国人名 天气 温度 周期 故事线 趋势 van Wijk' }
];
const $ = (selector) => document.querySelector(selector);
const portalRoot = new URL('./', document.currentScript.src);
const chapterUrl = (id) => new URL(`lesson-${String(id).padStart(2, '0')}/`, portalRoot).href;
const englishSearch = ['data fundamentals students generation attributes measurement scales transformations arrays selectors','visualization pipeline workflow aggregation tree layout rendering interaction','color spaces palettes colormap accessibility color blindness','low dimensional coordinates axis curves fitting contours marching squares','time series temporal calendar heatmap spiral storyline periodic trends'];
let activeFilter = 'all';
function readProgress() {
  try {
    const data = JSON.parse(localStorage.getItem('vis-learning-v1') || '{}');
    return { completed: [...new Set(Array.isArray(data?.completed) ? data.completed.filter(id => Number.isInteger(id) && id >= 1 && id <= 5) : [])], lastLesson: Number.isInteger(data?.lastLesson) && data.lastLesson >= 1 && data.lastLesson <= 5 ? data.lastLesson : null };
  } catch { return { completed: [], lastLesson: null }; }
}
function art(id) {
  const open = '<svg viewBox="0 0 240 116" aria-hidden="true" fill="none">';
  const lines = '<path d="M23 88H218M23 62H218M23 36H218" stroke="#cfdac5" stroke-dasharray="3 5"/>';
  const visuals = {
    1: Array.from({length:28},(_,i)=>`<circle cx="${32+i%7*28}" cy="${25+Math.floor(i/7)*21}" r="${3+(i*3)%5}" fill="${['#adbf94','#6d8e59','#8eaa75','#c7a77b'][i%4]}"/>`).join(''),
    2: '<path d="M42 57H91M119 57H149M120 57V26H157M120 57V88H157" stroke="#b4b69b" stroke-width="1.5"/><rect x="10" y="40" width="48" height="34" rx="7" fill="#e4d7b9"/><rect x="87" y="40" width="47" height="34" rx="7" fill="#9ba981"/><rect x="155" y="14" width="54" height="24" rx="5" fill="#c4d1ad"/><rect x="155" y="45" width="54" height="24" rx="5" fill="#d9c199"/><rect x="155" y="76" width="54" height="24" rx="5" fill="#abbf99"/><path d="M24 52H45M24 61H39M100 52H121M100 61H115" stroke="white" stroke-width="3" stroke-linecap="round"/>',
    3: '<circle cx="104" cy="48" r="32" fill="#adc09a" fill-opacity=".9"/><circle cx="139" cy="48" r="32" fill="#d2a17f" fill-opacity=".8"/><circle cx="122" cy="75" r="32" fill="#e4c677" fill-opacity=".8"/><circle cx="193" cy="27" r="6" fill="#d3b9a4"/><circle cx="49" cy="88" r="4" fill="#9da989"/>',
    4: `${lines}<path d="M24 83C42 82 42 39 60 45S84 78 103 55 129 23 149 38 180 63 214 18" stroke="#6b8a64" stroke-width="2.5"/><path d="M24 83C42 82 42 39 60 45S84 78 103 55 129 23 149 38 180 63 214 18V88H24Z" fill="#8dab77" fill-opacity=".1"/><circle cx="60" cy="45" r="4" fill="#d09c70"/><circle cx="149" cy="38" r="4" fill="#d09c70"/><circle cx="214" cy="18" r="4" fill="#6b8a64"/>`,
    5: Array.from({length:48}, (_,i) => `<rect x="${28+i%12*16}" y="${25+Math.floor(i/12)*17}" width="12" height="12" rx="2" fill="${['#e1e6d4','#bbcca5','#8ea775','#56794e','#d2b17b'][(i*7+Math.floor(i/12)*3)%5]}"/>`).join('')
  };
  return open + visuals[id] + '</svg>';
}
function renderChapters() {
  if (!$('#chapter-grid') || !$('#chapter-search')) return;
  const query = $('#chapter-search').value.trim().toLocaleLowerCase();
  const progress = readProgress();
  const filtered = chapters.filter(ch => (activeFilter === 'all' || ch.category === activeFilter) && `${ch.title} ${ch.description} ${ch.tags.join(' ')} ${ch.keywords} ${englishSearch[ch.id-1]}`.toLocaleLowerCase().includes(query));
  $('#chapter-grid').innerHTML = filtered.map(ch => `<a class="chapter-card" href="${chapterUrl(ch.id)}"><div class="card-art">${art(ch.id)}</div><div class="card-body"><div class="card-overline">CHAPTER ${String(ch.id).padStart(2,'0')}<span class="completed-label">${progress.completed.includes(ch.id) ? '✓ 已学完' : `${ch.count} 个小节`}</span></div><h3>${ch.title}</h3><p class="card-description">${ch.description}</p><div class="tags">${ch.tags.map(tag => `<span>${tag}</span>`).join('')}</div><div class="card-foot"><span>讲解 / 代码 / 演示</span><strong>进入学习 ↗</strong></div></div></a>`).join('');
  if ($('#chapter-grid').dataset.labEntry !== 'false' && activeFilter === 'all' && !query) $('#chapter-grid').insertAdjacentHTML('beforeend',`<div class="lab-card"><div class="lab-icon" aria-hidden="true">✳</div><h3>数据可视化<br> 综合实验</h3><p>多数据分析、图形对照与色带映射。</p><a href="${new URL('lab/', portalRoot).href}">进入交互实验室 ↗</a></div>`);
  $('#result-count').textContent = `${filtered.length} 个章节`;
  $('#no-results').hidden = filtered.length !== 0;
  $('#search-announcement').textContent = `找到 ${filtered.length} 个章节`;
}
function updateProgress() {
  const {completed,lastLesson} = readProgress();
  $('#progress-number').textContent = `${completed.length} / 5`;
  $('#course-progress').value = completed.length;
  $('#course-progress').textContent = `${completed.length} / 5`;
  $('#progress-note').textContent = completed.length === 5 ? '全部章节已完成，可进入综合实验。' : completed.length ? `已完成 ${completed.length} 章，其余章节待完成。` : '学习进度依据章节完成标记记录。';
  const next = lastLesson || 1;
  $('#continue-link').href = chapterUrl(next);
  $('#continue-link').innerHTML = `${lastLesson ? '继续上次学习' : '开始第一章'} <span aria-hidden="true">↗</span>`;
  if ($('#hero-start')) {
    $('#hero-start').href = chapterUrl(next);
    $('#hero-start').innerHTML = `${lastLesson ? '继续学习' : '开始学习'} <span aria-hidden="true">↗</span>`;
  }
  document.querySelectorAll('.chapter-nav a').forEach((a,i) => a.classList.toggle('completed',completed.includes(i+1)));
  renderChapters();
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b => {b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
  renderChapters();
}));
$('#chapter-search')?.addEventListener('input',renderChapters);
$('#reset-search')?.addEventListener('click',()=>{$('#chapter-search').value='';$('[data-filter="all"]').click();$('#chapter-search').focus();});
document.addEventListener('keydown',event=>{if($('#chapter-search')&&event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!document.activeElement.isContentEditable){event.preventDefault();$('#chapter-search').focus();}});
window.addEventListener('storage',updateProgress);
window.addEventListener('pageshow',updateProgress);
updateProgress();
