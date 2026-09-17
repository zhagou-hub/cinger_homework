/* Layout Lens — native DOM, one resident workbench, no dependencies or network calls. */
(() => {
  'use strict';
  const root = document.getElementById('layout-lens');
  if (!root) return;
  const $ = selector => root.querySelector(selector);
  const $$ = selector => [...root.querySelectorAll(selector)];
  const STORAGE = 'layout-lens-experiment-v1';
  const CASES = ['grid', 'flex', 'editorial'];
  const DEFAULTS = { version: 1, case: 'grid', mode: 'fluid', width: 960, gap: 16, min: 220, long: false, textZoom: false, guides: false, lang: 'zh', panel: 'insight', query: '', filter: false, tasks: 4, bookmarked: false };
  const TEXT = {
    zh: {
      labName: '亮点实验室', headline: '让布局原理，<em>看得见。</em>',
      subtitle: '一个画布，走完「调整 → 观察 → 修复」。不是看演示，而是亲手验证。',
      tour: '演示一遍', export: '导出实验', nextStep: '下一步', stopTour: '结束演示', finish: '完成演示',
      recipes: '实验场景', chooseCase: '选择实验场景', gridTitle: '自适应画廊', flexTitle: '弹性工具栏', editorialTitle: '双栏阅读页',
      variables: '布局变量', reset: '重置当前实验', gap: '元素间距', minGrid: '卡片最小宽度', minFlex: '搜索框基准宽度', minEditorial: '侧栏宽度',
      stress: '内容压力', longText: '超长文案', doubleText: '文字放大', stressNote: '仅改变示例内容，不缩放操作界面。', challenge: '制造一次布局故障',
      canvas: '实时布局画布', device: '模拟容器尺寸', desktop: '桌面', tablet: '平板', phone: '手机', guides: '结构透视', rules: '对比布局规则',
      fixed: '固定写法', fluid: '自适应写法', live: '实时渲染', dragWidth: '拖动改变容器宽度，方向键调整', width: '容器宽度', widthPixels: '容器宽度（像素）',
      inspector: '布局洞察与代码', insight: '布局洞察', keyCode: '关键代码', audit: '实时体检', applyFix: '应用自适应规则', fixedApplied: '自适应规则已应用',
      auditNote: '读取当前画布的真实尺寸，不用预设分数代替检测。', synchronized: '与画布同步',
      codeNote: '这里就是驱动画布的布局规则。修改参数，CSS 会同步更新。', copyCSS: '复制布局 CSS', fullCode: '查看完整 HTML / CSS',
      exportNote: '导出包含当前内容、视觉样式与布局规则，可独立运行。',
      footerTip: '布局不是固定答案，而是内容与空间之间的关系。', localNote: '纯前端运行 · 实验参数自动保存',
      sourceTitle: '这个实验的完整代码', close: '关闭', sourceNote: '布局 CSS + 示例外观样式，导出后无需外部依赖。', copyCurrent: '复制当前代码', downloadHTML: '下载 HTML',
      columns: '当前列数', rows: '工具栏行数', cardWidth: '卡片宽度', searchWidth: '搜索框宽度', proseWidth: '正文宽度', measuredGap: '实测间距',
      overflow: '横向溢出', clipping: '文字裁切', overlap: '元素重叠', none: '未发现', intact: '完整', items: '{n} 处',
      overflowAmount: '{n} px', displayScale: '显示比例 {n}% · 内部仍为 {w}px', gridStatus: 'CSS Grid · {n} 列', flexStatus: 'Flexbox · {n} 行', editorialStatus: 'Container Query · {n} 列',
      gridFluidTitle: '空间变了，列数自己适应。', gridFixedTitle: '固定轨道，不会主动让位。',
      gridFluidExplanation: '<code>auto-fit</code> 决定能放几列，<code>minmax()</code> 约束卡片下限。剩余空间交给 <code>1fr</code> 平分。',
      gridFixedExplanation: '每列固定为 {min}px，总共 3 列。容器变窄时，轨道仍保留原宽度，可能把内容推到画布之外。',
      gridNext: '下一断点 {next}px → {cols} 列。由卡宽、间距与 48px 内边距推算。',
      gridLast: '当前参数在 1200px 内已到最大列数。改变卡宽，断点也会跟着移动。',
      gridFixedNote: '此写法至少需要 {need}px。横向溢出取决于实际内容，不取决于设备名称。',
      flexFluidTitle: '挤不下，就换一行。', flexFixedTitle: '空间不足，仍被锁在一行。',
      flexFluidExplanation: '<code>flex-wrap</code> 允许换行；搜索框从 {min}px 出发吸收剩余空间。按钮跟随内容，不必强行等宽。',
      flexFixedExplanation: '<code>nowrap</code> 禁止换行，搜索框也不能缩到 {min}px 以下。长按钮和窄容器会直接暴露问题。',
      flexNext: '当前实测 {rows} 行。换行点由搜索框、按钮文案与间距共同决定。',
      editorialFluidTitle: '换个容器，换种阅读节奏。', editorialFixedTitle: '桌面双栏，不能硬塞进手机。',
      editorialFluidExplanation: '查询的是组件容器，不是整个浏览器。小于 {breakpoint}px 时侧栏自然接到正文之后，保持 DOM 阅读顺序。',
      editorialFixedExplanation: '正文固定 480px，侧栏固定 {min}px。容器变化不会改变双栏；长词和文字放大也可能超出轨道。',
      editorialNote: '容器断点 {breakpoint}px：正文、侧栏与留白共同决定，不按设备型号猜测。',
      fixedReady: '已切到窄容器并注入长文案。观察橙色检测项，再试着修复。', fixedDone: '已应用自适应规则；检测结果已按当前画布重新计算。',
      resetDone: '当前实验已重置，课程学习记录不受影响。', copyDone: '代码已复制。', copyFail: '复制未成功，请打开完整代码手动选择。', exportDone: '已生成可独立运行的 HTML 文件。', storageUnavailable: '本地存储不可用 · 本次会话内保留参数',
      tourTitle0: '01 / 先观察一个正常的布局', tourDesc0: '同一组作品在 960px 容器中排列。所有数字都来自当前 DOM 测量。',
      tourTitle1: '02 / 空间变了，内容怎样响应？', tourDesc1: '将容器缩小到 375px，网格自动变成单列。注意列数与断点提示。',
      tourTitle2: '03 / 有意制造一个真实问题', tourDesc2: '保留窄容器，换成固定轨道并注入长文案。观察溢出、裁切与结构透视。',
      tourTitle3: '04 / 用规则修复，而不是隐藏问题', tourDesc3: '恢复自适应轨道与自然换行，保留压力条件。打开「关键代码」检查实际修复。',
      tourDone: '演示结束。现在可以自由调整参数，验证其他边界情况。',
      works: '作品', about: '关于', contact: '联系', selected: '精选作品 / 2026', galleryHeadline: '设计，让关系发生。', gallerySub: '探索形式、空间与日常生活之间的可能。', collection: '六个关于设计的提案',
      galleryNames: ['形与秩序', '日常的界面', '留白的力量', '流动的边界', '另一种视角', '明天的形状'],
      galleryLongNames: ['形与秩序：为不断变化的内容建立有弹性的视觉系统', '日常的界面：一个容纳更多语言、更多信息与更多可能的空间', '留白的力量：让复杂的信息关系在不同屏幕上依然清晰', '流动的边界：从桌面到手机保持一致而灵活的阅读体验', '另一种视角：SuperLongUnbreakableDesignSystemComponentIdentifier', '明天的形状：从固定像素走向内容驱动的响应式布局'],
      galleryCategories: ['视觉系统', '数字产品', '编辑设计', '交互探索', '品牌实验', '空间叙事'],
      workspace: '团队工作台', workspaceSub: '把想法变成下一件好作品。', allProjects: '全部项目', activeProjects: '进行中', newProject: '新建项目',
      allProjectsLong: '筛选全部团队协作项目', activeProjectsLong: '仅显示正在进行的团队项目', newProjectLong: '创建一个新的团队协作项目',
      searchPlaceholder: '搜索项目…', searchLabel: '搜索示例项目', project: '项目', status: '状态', updated: '最近更新',
      taskNames: ['品牌视觉系统', '产品体验改版', '设计组件库', '秋季作品集', '交互原型', '设计规范', '移动端体验', '创意提案'],
      taskLongNames: ['支持跨团队协作与多语言内容的品牌视觉系统', '适配桌面、平板和移动端的产品体验全面改版', 'SuperLongUnbreakableDesignSystemComponentIdentifier', '收集本季设计研究与实践成果的秋季作品集', '面向真实使用场景的交互原型验证', '覆盖组件状态与无障碍要求的设计规范', '为不同容器宽度设计的移动端阅读体验', '连接信息架构与视觉呈现的创意提案'],
      inProgress: '进行中', completed: '已完成', noProjects: '没有匹配的项目，换个关键词试试。', maxProjects: '示例项目已达到 8 个。', newProjectAdded: '已添加一个示例项目。',
      journal: '设计手记', journalCategory: 'FIELD NOTES / 03', journalTitle: '留白，是设计的一部分。', journalSubtitle: '好的阅读体验，往往从少放一点开始。',
      journalIntro: '页面里的每一段空白，都在悄悄告诉读者：什么属于同一组，什么值得停下来，下一步该看哪里。',
      journalText: '布局不只是把内容放进去。标题、段落和补充信息之间需要清晰的关系。先确定阅读顺序，再让网格表达这种关系，界面才能在不同尺寸下保持从容。',
      journalTextLong: '当内容增加、用户放大文字，或同一个组件被放进更窄的侧栏时，布局依然需要保留合理的行长、稳定的间距与完整的阅读顺序。SuperLongUnbreakableDesignSystemComponentIdentifier 不应撑破正文所在的轨道。',
      journalQuote: '留白不是剩下的空间，而是被设计的关系。', journalSection: '先让内容呼吸',
      journalFoot: '宽屏下并列，窄容器中顺序阅读。视觉变了，内容的逻辑没有变。',
      inThisArticle: '这篇文章', readingTime: '约 4 分钟阅读', contentsOne: '01 · 阅读节奏', contentsTwo: '02 · 信息分组', contentsThree: '03 · 自然重排', bookmark: '保存这篇文章', bookmarked: '已保存', bookmarkDone: '已更新本地收藏状态。',
      sourceComment: '当前实验的布局规则；数值与画布同步。', baseComment: '示例视觉样式（自包含，无图片和字体依赖）。',
      htmlTitle: 'Layout Lens — {case}', exportHeader: 'Layout Lens / 独立实验', exportCaption: '{case} · {mode} · 调整浏览器宽度继续验证',
      rowLabel: '行 {n}'
    },
    en: {
      labName: 'Interactive lab', headline: 'Make layout principles <em>visible.</em>',
      subtitle: 'One canvas. Adjust, observe, repair. Learn by testing, not just watching.',
      tour: 'Play walkthrough', export: 'Export experiment', nextStep: 'Next step', stopTour: 'End walkthrough', finish: 'Finish',
      recipes: 'EXPERIMENTS', chooseCase: 'Choose an experiment', gridTitle: 'Adaptive gallery', flexTitle: 'Flexible toolbar', editorialTitle: 'Editorial layout',
      variables: 'LAYOUT VARIABLES', reset: 'Reset this experiment', gap: 'Element gap', minGrid: 'Minimum card width', minFlex: 'Search flex basis', minEditorial: 'Sidebar width',
      stress: 'CONTENT STRESS', longText: 'Long copy', doubleText: 'Text at 200%', stressNote: 'Changes the example text, not the workbench UI.', challenge: 'Introduce a layout bug',
      canvas: 'Live layout canvas', device: 'Simulated container size', desktop: 'Desktop', tablet: 'Tablet', phone: 'Phone', guides: 'Structure lens', rules: 'Compare layout rules',
      fixed: 'Fixed rules', fluid: 'Adaptive rules', live: 'Live rendering', dragWidth: 'Drag to resize the container; use arrow keys to adjust', width: 'Container width', widthPixels: 'Container width in pixels',
      inspector: 'Layout insights and source code', insight: 'Insights', keyCode: 'Live CSS', audit: 'LIVE DIAGNOSTICS', applyFix: 'Apply adaptive rules', fixedApplied: 'Adaptive rules applied',
      auditNote: 'Measured from the current DOM. No preset reliability scores.', synchronized: 'Canvas-linked',
      codeNote: 'These rules power the actual canvas. Change a parameter and the CSS updates with it.', copyCSS: 'Copy layout CSS', fullCode: 'Full HTML / CSS',
      exportNote: 'The export includes content, visual styles and layout rules. It runs independently.',
      footerTip: 'Layout is a relationship between content and space, not a fixed answer.', localNote: 'Frontend only · Parameters saved locally',
      sourceTitle: 'The complete experiment', close: 'Close', sourceNote: 'Layout rules and visual styles. No external dependencies.', copyCurrent: 'Copy this code', downloadHTML: 'Download HTML',
      columns: 'Columns', rows: 'Toolbar rows', cardWidth: 'Card width', searchWidth: 'Search width', proseWidth: 'Article width', measuredGap: 'Actual gap',
      overflow: 'Horizontal overflow', clipping: 'Clipped text', overlap: 'Overlapping items', none: 'None', intact: 'Intact', items: '{n} found',
      overflowAmount: '{n} px', displayScale: 'Display {n}% · Internal width {w}px', gridStatus: 'CSS Grid · {n} columns', flexStatus: 'Flexbox · {n} rows', editorialStatus: 'Container Query · {n} columns',
      gridFluidTitle: 'New space. A natural reflow.', gridFixedTitle: 'Fixed tracks cannot yield.',
      gridFluidExplanation: '<code>auto-fit</code> finds how many columns fit. <code>minmax()</code> bounds their minimum; <code>1fr</code> shares the remaining space.',
      gridFixedExplanation: 'Three tracks stay at {min}px each. As the container narrows, they keep their widths and can push content outside the canvas.',
      gridNext: 'Next breakpoint: {next}px → {cols} columns. Derived from card width, gaps and 48px padding.',
      gridLast: 'The maximum column count within 1200px is reached. Change the minimum width to move the breakpoints.',
      gridFixedNote: 'These rules need at least {need}px. Actual content, not a device name, determines overflow.',
      flexFluidTitle: 'When space runs out, wrap.', flexFixedTitle: 'One line, even when it breaks.',
      flexFluidExplanation: '<code>flex-wrap</code> allows new lines. Search starts at {min}px and absorbs free space. Buttons follow their content, not equal-width tracks.',
      flexFixedExplanation: '<code>nowrap</code> locks the toolbar to one line. Search cannot shrink below {min}px, so longer labels and narrow containers reveal the failure.',
      flexNext: 'Measured: {rows} rows. The wrap point depends on search width, button text and spacing.',
      editorialFluidTitle: 'A different space. A better rhythm.', editorialFixedTitle: 'Desktop columns in a phone?',
      editorialFluidExplanation: 'Query the component, not the browser. Below {breakpoint}px, the sidebar follows the article without changing DOM reading order.',
      editorialFixedExplanation: 'The article stays at 480px and the sidebar at {min}px. Neither reacts to container width; long words and larger text can also exceed their tracks.',
      editorialNote: 'Container breakpoint: {breakpoint}px. It accounts for text, sidebar and space, not device models.',
      fixedReady: 'Narrow container and long copy enabled. Inspect the orange diagnostics, then apply a repair.', fixedDone: 'Adaptive rules applied. Diagnostics have been remeasured from the canvas.',
      resetDone: 'This experiment was reset. Course progress is unchanged.', copyDone: 'Code copied.', copyFail: 'Copy failed. Open the full source and select it manually.', exportDone: 'A standalone HTML file has been generated.', storageUnavailable: 'Storage unavailable · Parameters kept for this session',
      tourTitle0: '01 / Start with a working layout', tourDesc0: 'The same collection is arranged in a 960px container. Every metric is measured from the DOM.',
      tourTitle1: '02 / What happens when space changes?', tourDesc1: 'At 375px, the grid flows into one column. Watch the column count and breakpoint hint.',
      tourTitle2: '03 / Introduce a real failure', tourDesc2: 'Keep the narrow container, use fixed tracks and add long copy. Inspect overflow, clipping and guides.',
      tourTitle3: '04 / Fix the rules, not the symptoms', tourDesc3: 'Restore adaptive tracks and natural wrapping, keeping the stress conditions. Open Live CSS to inspect the repair.',
      tourDone: 'Walkthrough complete. Adjust any parameter to explore more edge cases.',
      works: 'Work', about: 'About', contact: 'Contact', selected: 'SELECTED WORK / 2026', galleryHeadline: 'Design makes connections.', gallerySub: 'Exploring the space between form, systems and everyday life.', collection: 'Six proposals for a better everyday',
      galleryNames: ['Form & order', 'Everyday interfaces', 'Room to breathe', 'Fluid boundaries', 'Another perspective', 'Shapes of tomorrow'],
      galleryLongNames: ['Form & order: a flexible visual system for continuously changing content', 'Everyday interfaces: making room for more languages, more information and more possibilities', 'Room to breathe: keeping complex information clear across every screen size', 'Fluid boundaries: a consistent yet adaptable reading experience from desktop to phone', 'Another perspective: SuperLongUnbreakableDesignSystemComponentIdentifier', 'Shapes of tomorrow: moving from fixed pixels to content-driven responsive layouts'],
      galleryCategories: ['Visual systems', 'Digital products', 'Editorial design', 'Interaction studies', 'Brand experiments', 'Spatial stories'],
      workspace: 'Team workspace', workspaceSub: 'Turn the next idea into something good.', allProjects: 'All projects', activeProjects: 'In progress', newProject: 'New project',
      allProjectsLong: 'Filter all team collaboration projects', activeProjectsLong: 'Show active collaboration projects only', newProjectLong: 'Create a new team collaboration project',
      searchPlaceholder: 'Search projects…', searchLabel: 'Search example projects', project: 'Project', status: 'Status', updated: 'Last update',
      taskNames: ['Brand identity system', 'Product experience redesign', 'Design component library', 'Autumn portfolio', 'Interaction prototype', 'Design guidelines', 'Mobile experience', 'Creative proposal'],
      taskLongNames: ['A multilingual brand identity system for collaboration across teams', 'A complete product experience redesign across desktop, tablet and mobile', 'SuperLongUnbreakableDesignSystemComponentIdentifier', 'An autumn portfolio of design research and practical explorations', 'An interaction prototype validated through real use cases', 'Design guidelines for component states and accessibility', 'A mobile reading experience across different container widths', 'A creative proposal connecting information architecture and visual design'],
      inProgress: 'In progress', completed: 'Complete', noProjects: 'No matching projects. Try another keyword.', maxProjects: 'This demo already has eight projects.', newProjectAdded: 'An example project was added.',
      journal: 'Design notes', journalCategory: 'FIELD NOTES / 03', journalTitle: 'White space is part of the design.', journalSubtitle: 'A better reading experience often starts with less.',
      journalIntro: 'Every pause on a page tells a quiet story: what belongs together, what deserves attention, and where to look next.',
      journalText: 'Layout is more than putting content into boxes. Headings, paragraphs and supporting details need clear relationships. Establish the reading order first; let the grid express it, so the interface stays composed at different sizes.',
      journalTextLong: 'When content grows, text gets larger, or the same component moves into a narrower sidebar, it still needs a comfortable line length, consistent spacing and a complete reading order. SuperLongUnbreakableDesignSystemComponentIdentifier should not push the article beyond its track.',
      journalQuote: 'White space is not what is left over. It is a designed relationship.', journalSection: 'Give content room to breathe',
      journalFoot: 'Side by side when wide; in sequence when narrow. The visual layout changes, but its logic stays intact.',
      inThisArticle: 'In this article', readingTime: 'A 4-minute read', contentsOne: '01 · Reading rhythm', contentsTwo: '02 · Information groups', contentsThree: '03 · Natural reflow', bookmark: 'Save this article', bookmarked: 'Article saved', bookmarkDone: 'Local bookmark updated.',
      sourceComment: 'Current layout rules. Values stay synchronized with the canvas.', baseComment: 'Self-contained visual styling. No image or font dependencies.',
      htmlTitle: 'Layout Lens — {case}', exportHeader: 'Layout Lens / Standalone experiment', exportCaption: '{case} · {mode} · Resize the browser to keep testing',
      rowLabel: 'Row {n}'
    }
  };

  // Validate persisted values rather than trusting arbitrary localStorage input.
  function clamp(value, min, max, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
  }
  let storageOK = true;
  function restore() {
    const fresh = { ...DEFAULTS, width: window.matchMedia('(max-width: 730px)').matches ? 375 : 960 };
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) || 'null');
      if (!saved || saved.version !== 1) return fresh;
      return {
        ...fresh, case: CASES.includes(saved.case) ? saved.case : 'grid', mode: saved.mode === 'fixed' ? 'fixed' : 'fluid',
        width: clamp(saved.width, 320, 1200, fresh.width), gap: 2 * Math.round(clamp(saved.gap, 8, 32, 16) / 2),
        min: 10 * Math.round(clamp(saved.min, 160, 280, 220) / 10),
        lang: saved.lang === 'en' ? 'en' : 'zh', panel: saved.panel === 'code' ? 'code' : 'insight',
        long: saved.long === true, textZoom: saved.textZoom === true, guides: saved.guides === true,
        query: typeof saved.query === 'string' ? saved.query.slice(0, 120) : '', filter: saved.filter === true,
        tasks: clamp(saved.tasks, 4, 8, 4), bookmarked: saved.bookmarked === true
      };
    } catch (_) { storageOK = false; return fresh; }
  }
  const state = restore();
  const requestedLanguage = new URLSearchParams(location.search).get('lang');
  if (requestedLanguage === 'en' || requestedLanguage === 'zh') state.lang = requestedLanguage;
  function save() {
    try { localStorage.setItem(STORAGE, JSON.stringify(state)); }
    catch (_) { storageOK = false; $('[data-ll-t="localNote"]').textContent = t('storageUnavailable'); }
  }
  function t(key, vars = {}) {
    let value = TEXT[state.lang][key] ?? TEXT.zh[key] ?? key;
    if (Array.isArray(value)) return value;
    return value.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`));
  }
  function escape(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  const e = (key, vars) => escape(t(key, vars));
  let toastTimer;
  function toast(message) {
    const el = $('#ll-toast'); el.textContent = message; el.classList.add('is-visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('is-visible'), 3500);
  }

  // The same base CSS is injected once and included verbatim in standalone exports.
  const BASE_CSS = `
.lens-document { container: lens / inline-size; width: 100%; color: #263348; background: #fff; font-family: Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; font-size: calc(12px * var(--lens-text, 1)); line-height: 1.6; -webkit-font-smoothing: antialiased; }
.lens-document *, .lens-document *::before, .lens-document *::after { box-sizing: border-box; }
.lens-document [hidden] { display: none !important; }
.lens-document h2, .lens-document h3, .lens-document h4, .lens-document p { margin: 0; }
.lens-document button, .lens-document input { font: inherit; }
.lens-document button { cursor: pointer; }
.lens-document button:focus-visible, .lens-document input:focus-visible, .lens-document [tabindex]:focus-visible { outline: 3px solid #7389f5; outline-offset: 3px; }
.lens-topbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding: 17px 24px 13px; border-bottom: 1px solid #eef0f2; }
.lens-brand { display: flex; align-items: center; gap: 8px; color: #243047; font-size: 1.5em; font-weight: 850; letter-spacing: -.065em; line-height: 1; }
.lens-brand-mark { position: relative; display: inline-block; width: 18px; height: 18px; background: #34486a; border-radius: 50% 0 50% 50%; transform: rotate(-15deg); }
.lens-brand-mark::after { content: ""; position: absolute; top: 4px; left: 4px; width: 7px; height: 7px; border: 2px solid white; border-radius: 50%; }
.lens-nav { display: flex; flex-wrap: wrap; gap: 20px; color: #9ba3af; font-size: .66em; }
.lens-nav > span:first-child { color: #3c4a63; }
.lens-content { padding: 20px 24px 24px; }
.lens-gallery-heading { display: flex; align-items: end; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 19px; }
.lens-kicker { color: #9aa4b5; font-size: .58em; letter-spacing: .13em; }
.lens-gallery-heading h2 { margin-top: 4px; font-size: 1.85em; font-weight: 750; letter-spacing: -.04em; line-height: 1.5; overflow-wrap: anywhere; }
.lens-gallery-heading p { margin-top: 4px; color: #9aa5b5; font-size: .7em; }
.lens-collection { color: #a5aebe; font-size: .6em; }
.lens-gallery { display: grid; align-items: start; }
.lens-card { position: relative; border: 1px solid #e7ebf1; border-radius: 5px; background: white; }
.lens-card-content { padding: 11px 12px 13px; }
.lens-card h3 { font-size: 1.03em; font-weight: 650; line-height: 1.6; color: #39475d; }
.lens-card-meta { display: flex; justify-content: space-between; gap: 12px; margin-top: 6px; color: #a3adba; font-size: .61em; }
.lens-card-meta span:last-child { font-family: Consolas, monospace; color: #8492a6; }
.lens-art { position: relative; aspect-ratio: 2.45; overflow: hidden; background: #e7ecf4; border-radius: 4px 4px 0 0; isolation: isolate; }
.lens-art::before, .lens-art::after, .lens-shape { content: ""; position: absolute; display: block; }
.lens-art-0 { background: #596fea; }
.lens-art-0::before { width: 72%; aspect-ratio: 1; left: -12%; top: 17%; border: 21px solid #98a5ff; border-radius: 50%; }
.lens-art-0::after { width: 58%; aspect-ratio: 1; right: -1%; top: -47%; border: 21px solid #d5dbff; border-radius: 50%; }
.lens-art-0 .lens-shape { width: 47%; height: 1px; background: #c1cdff; transform: rotate(-45deg); right: 0; bottom: 20%; }
.lens-art-1 { background: #e6efb8; }
.lens-art-1::before { width: 45%; aspect-ratio: 1; left: 18%; top: 13%; background: #6f8051; border-radius: 50% 50% 6% 50%; transform: rotate(45deg); box-shadow: 12px 12px 0 #c7d991; }
.lens-art-1::after { width: 22%; aspect-ratio: 1; right: 19%; top: 16%; border-radius: 50%; background: #f7f8df; }
.lens-art-2 { background: #ece5f3; }
.lens-art-2::before { width: 53%; aspect-ratio: 1; left: 29%; top: 29%; background: #c6aed8; border-radius: 50% 50% 0 0; transform: rotate(-18deg); box-shadow: -25px 16px 0 #ddd0e7; }
.lens-art-2::after { width: 38%; height: 20%; left: 18%; top: 27%; background: #fdf9ff; transform: rotate(-18deg); }
.lens-art-3 { background: #dae5ee; }
.lens-art-3::before { width: 24%; height: 150%; left: 21%; top: -20%; border-radius: 60px; transform: rotate(30deg); background: #7494b3; box-shadow: 25px 0 0 #aac1d4, 50px 0 0 #eaf1f5; }
.lens-art-3::after { width: 9px; height: 9px; border-radius: 50%; background: #527696; right: 13%; top: 24%; }
.lens-art-4 { background: #efd7c6; }
.lens-art-4::before { width: 40%; aspect-ratio: 1; left: 30%; top: -12%; background: #bd7657; border-radius: 50%; box-shadow: 20px 22px 0 #d39e7b; }
.lens-art-4::after { width: 40%; height: 3px; background: #fbefe5; left: 14%; top: 49%; transform: rotate(-30deg); }
.lens-art-5 { background: #34415d; }
.lens-art-5::before { width: 36%; aspect-ratio: 1; border: 18px solid #adb9dc; border-radius: 50%; left: 16%; top: 20%; }
.lens-art-5::after { width: 31%; height: 48%; background: #d5daba; right: 15%; top: 17%; transform: rotate(24deg); }
.lens-project-intro { display: flex; align-items: end; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 22px; }
.lens-project-intro h2 { font-size: 2em; font-weight: 730; line-height: 1.5; letter-spacing: -.045em; }
.lens-project-intro p { color: #9ca7b7; font-size: .78em; margin-top: 4px; }
.lens-count { display: grid; place-items: center; width: 33px; height: 33px; color: #7b8cac; background: #f0f4fc; border: 1px solid #e4eafa; border-radius: 9px; font: 15px Consolas, monospace; }
.lens-toolbar { position: relative; padding: 13px; background: #f5f7fb; border: 1px solid #e6ebf3; border-radius: 7px; }
.lens-search { display: flex; position: relative; align-items: center; gap: 8px; padding: 10px 12px; min-height: 39px; border: 1px solid #e0e6f0; border-radius: 5px; background: white; }
.lens-document .lens-search svg { width: 14px; height: 14px; flex: 0 0 14px; color: #9daabc; fill: none; stroke: currentColor; stroke-width: 1.5; }
.lens-search input { display: block; width: 100%; min-width: 0; padding: 0; border: 0; color: #51617b; background: transparent; font-size: .85em; }
.lens-search input::placeholder { color: #a3afbf; }
.lens-toolbar > button { min-height: 39px; padding: 10px 13px; border: 1px solid #dee5f0; border-radius: 5px; background: #fff; color: #647b9b; font-size: .8em; }
.lens-toolbar > .lens-create { color: white; background: #576ed2; border-color: #576ed2; }
.lens-toolbar > button:hover { filter: brightness(.97); }
.lens-toolbar > button[aria-pressed="true"] { background: #e2e9ff; border-color: #9eafe7; color: #4764bb; }
.lens-task-list { margin-top: 21px; }
.lens-task { position: relative; display: flex; align-items: center; gap: 13px; padding: 17px 2px; border-bottom: 1px solid #edf0f6; }
.lens-task-icon { display: grid; place-items: center; width: 34px; height: 34px; flex: 0 0 34px; border-radius: 8px; color: #7a91c3; background: #edf2fd; font: 11px Consolas, monospace; }
.lens-task:nth-child(2n) .lens-task-icon { color: #829a7c; background: #f0f5e9; }
.lens-task-copy { flex: 1; min-width: 0; }
.lens-task-copy h3 { font-size: .94em; color: #52627b; font-weight: 550; line-height: 1.7; }
.lens-task-copy p { margin-top: 3px; color: #aeb7c4; font-size: .64em; }
.lens-task-status { flex-shrink: 0; padding: 3px 7px; color: #739183; background: #eef6f1; border-radius: 4px; font-size: .6em; }
.lens-task-status.is-active { color: #8294ba; background: #f0f4fc; }
.lens-empty { padding: 35px 8px; color: #9aa8ba; font-size: .9em; }
.lens-reading { display: grid; align-items: start; }
.lens-reading-article, .lens-reading-aside { position: relative; }
.lens-reading-article > .lens-kicker { margin-bottom: 12px; }
.lens-reading-article h2 { color: #3a4b65; font-size: 2.5em; letter-spacing: -.055em; line-height: 1.45; font-weight: 700; }
.lens-reading-deck { color: #9eabba; font-size: .8em; margin-top: 12px !important; padding-bottom: 18px; border-bottom: 1px solid #edf0f5; }
.lens-reading-body { color: #8090a6; font-size: .92em; line-height: 2; }
.lens-reading-body p { margin-top: 16px; }
.lens-reading-body h3 { color: #61748e; font-size: 1.1em; margin-top: 19px; font-weight: 600; }
.lens-reading-body blockquote { margin: 18px 0; padding: 13px 17px; border-left: 2px solid #b6c6e2; color: #758eaa; background: #f3f6fb; font-size: 1.06em; }
.lens-reading-aside { padding: 15px; background: #f3f6f4; border: 1px solid #e5ece8; border-radius: 5px; }
.lens-reading-aside .lens-art { border-radius: 3px; aspect-ratio: 1.45; margin-bottom: 15px; }
.lens-reading-aside h3 { color: #698276; font-size: 1.02em; font-weight: 650; }
.lens-reading-aside > p { margin-top: 5px; color: #9daf9f; font-size: .72em; }
.lens-reading-toc { display: flex; flex-direction: column; gap: 9px; margin-block: 18px; color: #8ca191; font-size: .78em; }
.lens-bookmark { width: 100%; padding: 9px 6px; color: #748f7d; background: #fff; border: 1px solid #dce7df; border-radius: 4px; font-size: .77em !important; }
.lens-bookmark[aria-pressed="true"] { background: #dcece1; }
.lens-document[data-guides="true"] [data-lens-item] { outline: 1.5px solid #758ced; outline-offset: -1px; }
.lens-document[data-guides="true"] [data-lens-item]::before { content: attr(data-lens-index); position: absolute; top: -1px; left: -1px; z-index: 2; padding: 1px 5px; color: #fff; background: #7388db; font: 9px/1.5 Consolas, monospace; pointer-events: none; }
.lens-document[data-guides="true"] .lens-gallery, .lens-document[data-guides="true"] .lens-toolbar, .lens-document[data-guides="true"] .lens-reading { background: repeating-linear-gradient(135deg, #edf0fd, #edf0fd 3px, #dce4ff 3px, #dce4ff 4px); }
.lens-document .lens-inspected { outline: 2px solid #4963d0 !important; outline-offset: -2px; }
@media (prefers-reduced-motion: reduce) { .lens-document *, .lens-document *::before, .lens-document *::after { transition: none !important; animation: none !important; } }
`;
  const styleElement = document.createElement('style');
  styleElement.id = 'layout-lens-preview-rules';
  document.head.appendChild(styleElement);
  const breakpoint = () => 48 + state.min + 360 + state.gap;
  function rules() {
    const adaptive = state.mode === 'fluid';
    const start = `/* ${t('sourceComment')} */\n`;
    if (state.case === 'grid') return start + `.lens-gallery {\n  display: grid;\n  grid-template-columns:\n    ${adaptive ? `repeat(auto-fit,\n      minmax(min(100%, ${state.min}px), 1fr))` : `repeat(3, ${state.min}px)`};\n  gap: ${state.gap}px;\n}\n\n.lens-card {\n  min-width: 0;\n}\n\n.lens-card h3 {\n  ${adaptive ? 'height: auto;\n  overflow: visible;\n  overflow-wrap: anywhere;' : 'height: 1.6em;\n  overflow: hidden;'}\n}`;
    if (state.case === 'flex') return start + `.lens-toolbar {\n  display: flex;\n  align-items: center;\n  flex-wrap: ${adaptive ? 'wrap' : 'nowrap'};\n  gap: ${state.gap}px;\n}\n\n.lens-search {\n  flex: 1 1 ${state.min}px;\n  min-width: ${adaptive ? '0' : `${state.min}px`};\n}\n\n.lens-toolbar > button {\n  flex: 0 0 auto;\n  ${adaptive ? 'max-width: 100%;\n  white-space: normal;\n  overflow-wrap: anywhere;' : 'white-space: nowrap;'}\n}\n\n.lens-task {\n  flex-wrap: ${adaptive ? 'wrap' : 'nowrap'};\n}\n\n.lens-task-copy h3 {\n  ${adaptive ? 'height: auto;\n  overflow: visible;\n  overflow-wrap: anywhere;' : 'height: 1.7em;\n  overflow: hidden;'}\n}`;
    return start + `.lens-reading {\n  display: grid;\n  grid-template-columns:\n    ${adaptive ? 'minmax(0, 1fr)' : '480px'} ${state.min}px;\n  gap: ${state.gap}px;\n}\n\n.lens-reading-article,\n.lens-reading-aside {\n  min-width: 0;\n  overflow-wrap: ${adaptive ? 'anywhere' : 'normal'};\n}` + (adaptive ? `\n\n/* .lens-document is the container. */\n.lens-document {\n  container: lens / inline-size;\n}\n\n@container lens (max-width: ${breakpoint()}px) {\n  .lens-reading {\n    grid-template-columns: minmax(0, 1fr);\n  }\n}` : '');
  }

  const art = (i, extra = '') => `<div class="lens-art lens-art-${i} ${extra}" aria-hidden="true"><i class="lens-shape"></i></div>`;
  function topbar(brand) {
    return `<div class="lens-topbar"><div class="lens-brand"><i class="lens-brand-mark" aria-hidden="true"></i>${escape(brand)}</div><div class="lens-nav"><span>${e('works')}</span><span>${e('about')}</span><span>${e('contact')}</span></div></div>`;
  }
  function galleryMarkup() {
    const names = t(state.long ? 'galleryLongNames' : 'galleryNames');
    const categories = t('galleryCategories');
    return `${topbar('FORMA®')}<div class="lens-content"><header class="lens-gallery-heading"><div><span class="lens-kicker">${e('selected')}</span><h2 data-lens-text>${e('galleryHeadline')}</h2><p>${e('gallerySub')}</p></div><span class="lens-collection">${e('collection')}</span></header><div class="lens-gallery">${names.map((name, i) => `<article class="lens-card" data-lens-item data-lens-index="${String(i + 1).padStart(2, '0')}" tabindex="0">${art(i)}<div class="lens-card-content"><h3 data-lens-text>${escape(name)}</h3><div class="lens-card-meta"><span>${escape(categories[i])}</span><span>↗ ${String(i + 1).padStart(2, '0')}</span></div></div></article>`).join('')}</div></div>`;
  }
  function flexMarkup() {
    const filterLabel = state.filter ? (state.long ? 'activeProjectsLong' : 'activeProjects') : (state.long ? 'allProjectsLong' : 'allProjects');
    const names = t(state.long ? 'taskLongNames' : 'taskNames');
    let shown = 0;
    const tasks = names.slice(0, state.tasks).map((name, i) => {
      if ((state.filter && i % 3 === 2) || (state.query && !name.toLowerCase().includes(state.query.toLowerCase()))) return '';
      shown++;
      return `<article class="lens-task" data-lens-item data-lens-index="${String(i + 1).padStart(2, '0')}"><span class="lens-task-icon" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><div class="lens-task-copy"><h3 data-lens-text>${escape(name)}</h3><p>FORMA STUDIO / 0${i + 1}</p></div><span class="lens-task-status ${i % 3 === 2 ? '' : 'is-active'}">${e(i % 3 === 2 ? 'completed' : 'inProgress')}</span></article>`;
    }).join('');
    return `${topbar('FORMA / space')}<div class="lens-content"><header class="lens-project-intro"><div><span class="lens-kicker">THE WORKSPACE</span><h2 data-lens-text>${e('workspace')}</h2><p>${e('workspaceSub')}</p></div><span class="lens-count">${state.tasks.toString().padStart(2, '0')}</span></header><div class="lens-toolbar"><label class="lens-search" data-lens-item data-lens-index="01"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8" cy="8" r="5"/><path d="m12 12 5 5"/></svg><input type="search" id="ll-example-search" maxlength="120" aria-label="${e('searchLabel')}" placeholder="${e('searchPlaceholder')}" value="${escape(state.query)}"></label><button type="button" class="lens-filter" data-lens-action="filter" data-lens-item data-lens-index="02" aria-pressed="${state.filter}">${e(filterLabel)} <span aria-hidden="true">⌄</span></button><button type="button" class="lens-create" data-lens-action="create" data-lens-item data-lens-index="03">＋ ${e(state.long ? 'newProjectLong' : 'newProject')}</button></div><div class="lens-task-list">${shown ? tasks : `<p class="lens-empty">${e('noProjects')}</p>`}</div></div>`;
  }
  function editorialMarkup() {
    return `${topbar('FORMA / journal')}<div class="lens-content"><div class="lens-reading"><article class="lens-reading-article" data-lens-item data-lens-index="01"><p class="lens-kicker">${e('journalCategory')}</p><h2 data-lens-text>${e('journalTitle')}</h2><p class="lens-reading-deck" data-lens-text>${e('journalSubtitle')}</p><div class="lens-reading-body"><p data-lens-text>${e('journalIntro')}</p><h3>${e('journalSection')}</h3><p data-lens-text>${e(state.long ? 'journalTextLong' : 'journalText')}</p><blockquote>${e('journalQuote')}</blockquote><p data-lens-text>${e('journalFoot')}</p></div></article><aside class="lens-reading-aside" data-lens-item data-lens-index="02">${art(1)}<h3>${e('inThisArticle')}</h3><p>${e('readingTime')}</p><div class="lens-reading-toc"><span>${e('contentsOne')}</span><span>${e('contentsTwo')}</span><span>${e('contentsThree')}</span></div><button type="button" class="lens-bookmark" data-lens-action="bookmark" aria-pressed="${state.bookmarked}">${e(state.bookmarked ? 'bookmarked' : 'bookmark')}</button></aside></div></div>`;
  }
  const preview = $('#ll-document');
  let contentKey = '', lastRules = '', raf = 0, displayScale = 1;
  function applyLanguage() {
    root.lang = state.lang === 'en' ? 'en' : 'zh-CN';
    $$('[data-ll-t]').forEach(el => { el.textContent = t(el.dataset.llT); });
    $$('[data-ll-html]').forEach(el => { el.innerHTML = t(el.dataset.llHtml); });
    $$('[data-ll-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.llLabel)); });
    $$('[data-ll-lang]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.llLang === state.lang)));
    if (!storageOK) $('[data-ll-t="localNote"]').textContent = t('storageUnavailable');
  }
  function render() {
    const key = JSON.stringify([state.case, state.lang, state.long, state.query, state.filter, state.tasks, state.bookmarked]);
    if (key !== contentKey) {
      const searchFocused = document.activeElement === $('#ll-example-search');
      const selection = searchFocused ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
      preview.innerHTML = state.case === 'grid' ? galleryMarkup() : state.case === 'flex' ? flexMarkup() : editorialMarkup();
      contentKey = key;
      if (searchFocused) {
        const search = $('#ll-example-search');
        search?.focus({ preventScroll: true });
        if (search && selection && selection[0] !== null) search.setSelectionRange(...selection);
      }
    }
    preview.classList.add('lens-document');
    preview.style.width = `${state.width}px`;
    preview.style.setProperty('--lens-text', state.textZoom ? '2' : '1');
    preview.dataset.guides = String(state.guides);
    preview.lang = root.lang;
    const css = rules();
    if (css !== lastRules) { styleElement.textContent = BASE_CSS + '\n' + css; lastRules = css; $('#ll-live-code').innerHTML = highlight(css); }
    $$('[data-ll-case]').forEach(el => { const selected = el.dataset.llCase === state.case; el.classList.toggle('is-selected', selected); el.setAttribute('aria-pressed', String(selected)); });
    $$('[data-ll-mode]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.llMode === state.mode)));
    $$('[data-ll-device]').forEach(el => el.setAttribute('aria-pressed', String(Number(el.dataset.llDevice) === state.width)));
    [['#ll-long', 'long'], ['#ll-text-zoom', 'textZoom'], ['#ll-guides', 'guides']].forEach(([id, field]) => $(id).setAttribute('aria-pressed', String(state[field])));
    [['#ll-gap', 'gap'], ['#ll-min', 'min'], ['#ll-width', 'width']].forEach(([id, field]) => {
      const input = $(id); input.value = state[field];
      input.style.setProperty('--fill', `${(state[field] - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100}%`);
    });
    $('#ll-gap-value').textContent = `${state.gap} px`; $('#ll-min-value').textContent = `${state.min} px`;
    $('#ll-min-label').textContent = t(state.case === 'grid' ? 'minGrid' : state.case === 'flex' ? 'minFlex' : 'minEditorial');
    if (document.activeElement !== $('#ll-width-number')) $('#ll-width-number').value = state.width;
    $('#ll-drag').setAttribute('aria-valuenow', state.width); $('#ll-drag').setAttribute('aria-valuetext', `${state.width} px`);
    selectPanel(state.panel, false);
    const points = state.case === 'grid' ? Array.from({ length: 6 }, (_, i) => 48 + (i + 2) * state.min + (i + 1) * state.gap).filter(n => n >= 320 && n <= 1200) : state.case === 'editorial' ? [breakpoint()] : [];
    $('#ll-breakpoints').innerHTML = points.map(n => `<i style="left:${(n - 320) / 880 * 100}%">${n}</i>`).join('');
    $('#ll-fix').disabled = state.mode === 'fluid';
    $('#ll-fix').innerHTML = `<span>${e(state.mode === 'fluid' ? 'fixedApplied' : 'applyFix')}</span><span aria-hidden="true">${state.mode === 'fluid' ? '✓' : '↗'}</span>`;
    if (!state.guides) $('#ll-measure-tip').hidden = true;
    if ($('#ll-code-dialog').open) renderSource();
    scheduleMeasure();
  }
  function update(patch, { persist = true } = {}) {
    Object.assign(state, patch);
    render(); if (persist) save();
  }
  function scheduleMeasure() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(fitAndMeasure);
  }
  function fitAndMeasure() {
    if (document.getElementById('view-lab').hidden) return;
    const canvas = $('#ll-canvas');
    const available = canvas.clientWidth - 46;
    if (available <= 0) return;
    displayScale = Math.min(1, available / state.width);
    preview.style.transform = `scale(${displayScale})`;
    const displayedWidth = state.width * displayScale;
    const shell = $('#ll-preview-shell');
    shell.style.width = `${displayedWidth}px`;
    shell.style.height = `${Math.ceil(preview.offsetHeight * displayScale)}px`;
    const ruler = $('#ll-ruler');
    ruler.style.width = `${displayedWidth}px`;
    const ticks = Array.from({ length: Math.floor(state.width / 200) + 1 }, (_, i) => i * 200);
    ruler.innerHTML = ticks.map(n => `<span style="position:absolute;left:${n / state.width * 100}%">${n}</span>`).join('');
    $('#ll-display-scale').textContent = t('displayScale', { n: Math.round(displayScale * 100), w: state.width });
    measure();
  }
  function rowCount(elements) {
    const rects = elements.map(el => el.getBoundingClientRect()).filter(r => r.width && r.height).sort((a, b) => a.top - b.top);
    let rows = 0, bottom = -Infinity;
    rects.forEach(rect => { if (rect.top >= bottom - 1) rows++; bottom = Math.max(bottom, rect.bottom); });
    return rows;
  }
  function measure() {
    // Measure layout pixels, not scaled display pixels. Hidden decorative art is excluded.
    const overflow = Math.max(0, preview.scrollWidth - preview.clientWidth);
    const textNodes = [...preview.querySelectorAll('[data-lens-text]')];
    const clipped = textNodes.filter(el => el.clientWidth && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2)).length;
    const items = [...preview.querySelectorAll('[data-lens-item]')].filter(el => el.offsetWidth && el.offsetHeight);
    let overlaps = 0;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (items[i].contains(items[j]) || items[j].contains(items[i])) continue;
        const a = items[i].getBoundingClientRect(), b = items[j].getBoundingClientRect();
        if ((Math.min(a.right, b.right) - Math.max(a.left, b.left)) / displayScale > 2 && (Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) / displayScale > 2) overlaps++;
      }
    }
    const issues = (overflow > 2 ? 1 : 0) + (clipped ? 1 : 0) + (overlaps ? 1 : 0);
    root.dataset.overflow = String(overflow); root.dataset.clipped = String(clipped); root.dataset.overlaps = String(overlaps);
    preview.classList.toggle('lens-has-issues', issues > 0);
    preview.parentElement.classList.toggle('has-issues', issues > 0);
    const rows = [
      ['overflow', overflow > 2, overflow > 2 ? t('overflowAmount', { n: Math.round(overflow) }) : t('none')],
      ['clipping', clipped > 0, clipped ? t('items', { n: clipped }) : t('intact')],
      ['overlap', overlaps > 0, overlaps ? t('items', { n: overlaps }) : t('none')]
    ];
    const auditHTML = rows.map(([label, bad, value]) => `<div class="ll-audit-row ${bad ? 'is-bad' : ''}"><i aria-hidden="true">${bad ? '!' : '✓'}</i><span>${e(label)}</span><strong>${escape(value)}</strong></div>`).join('');
    if ($('#ll-audit-rows').innerHTML !== auditHTML) $('#ll-audit-rows').innerHTML = auditHTML;
    $('#ll-audit-pill').classList.toggle('has-issues', issues > 0);
    $('#ll-audit-pill').textContent = issues ? `${issues} ${state.lang === 'en' ? 'ISSUES' : '项待检查'}` : 'LIVE';
    let count = 1, width = 0, diagram = [], nextNote = '', metricName = 'columns', widthName = 'cardWidth';
    const layoutNode = preview.querySelector(state.case === 'grid' ? '.lens-gallery' : state.case === 'flex' ? '.lens-toolbar' : '.lens-reading');
    const actualGap = Math.round(parseFloat(getComputedStyle(layoutNode).columnGap)) || 0;
    if (state.case === 'grid') {
      const gallery = preview.querySelector('.lens-gallery');
      const tracks = getComputedStyle(gallery).gridTemplateColumns.split(/\s+/).filter(track => parseFloat(track) > 0);
      count = tracks.length; width = preview.querySelector('.lens-card').offsetWidth;
      diagram = Array.from({ length: count }, () => state.mode === 'fluid' ? '1fr' : `${state.min}`);
      const next = 48 + (count + 1) * state.min + count * state.gap;
      nextNote = state.mode === 'fixed' ? t('gridFixedNote', { need: 48 + 3 * state.min + 2 * state.gap }) : next <= 1200 ? t('gridNext', { next, cols: count + 1 }) : t('gridLast');
    } else if (state.case === 'flex') {
      const toolbar = preview.querySelector('.lens-toolbar');
      count = rowCount([...toolbar.children]); width = preview.querySelector('.lens-search').offsetWidth;
      metricName = 'rows'; widthName = 'searchWidth';
      diagram = Array.from({ length: count }, (_, i) => t('rowLabel', { n: i + 1 }));
      nextNote = t('flexNext', { rows: count });
    } else {
      const reading = preview.querySelector('.lens-reading');
      count = getComputedStyle(reading).gridTemplateColumns.split(/\s+/).filter(track => parseFloat(track) > 0).length;
      width = preview.querySelector('.lens-reading-article').offsetWidth; widthName = 'proseWidth';
      diagram = count === 1 ? ['1fr'] : ['1fr', `${state.min}px`]; nextNote = t('editorialNote', { breakpoint: breakpoint() });
    }
    const modeKey = state.mode === 'fluid' ? 'Fluid' : 'Fixed';
    $('#ll-tech-label').textContent = state.case === 'grid' ? `GRID / ${state.mode === 'fluid' ? 'AUTO-FIT' : 'FIXED TRACKS'}` : state.case === 'flex' ? `FLEXBOX / ${state.mode === 'fluid' ? 'WRAP' : 'NOWRAP'}` : `CSS / ${state.mode === 'fluid' ? 'CONTAINER QUERY' : 'FIXED COLUMNS'}`;
    $('#ll-insight-title').textContent = t(`${state.case}${modeKey}Title`);
    $('#ll-explanation').innerHTML = t(`${state.case}${modeKey}Explanation`, { min: state.min, breakpoint: breakpoint() });
    $('#ll-metrics').innerHTML = `<div class="ll-metric"><strong>${count.toString().padStart(2, '0')}</strong><span>${e(metricName)}</span></div><div class="ll-metric"><strong>${width}<small>px</small></strong><span>${e(widthName)}</span></div><div class="ll-metric"><strong>${actualGap}<small>px</small></strong><span>${e('measuredGap')}</span></div>`;
    $('#ll-track-diagram').innerHTML = diagram.map((text, i) => `<i${state.case === 'editorial' && count === 2 ? ` style="flex:${i === 0 ? Math.max(width, 1) : state.min}"` : ''}>${escape(text)}</i>`).join('');
    $('#ll-breakpoint-note').textContent = nextNote;
    $('#ll-render-status').textContent = t(`${state.case}Status`, { n: count });
  }
  function highlight(code) {
    return code.split('\n').map(line => {
      if (line.trim().startsWith('/*') || line.trim().startsWith('*')) return `<span class="ll-code-token-comment">${escape(line)}</span>`;
      if (/^[.@]/.test(line)) return `<span class="ll-code-token-selector">${escape(line)}</span>`;
      const match = line.match(/^(\s*)([a-z-]+)(:)(.*)$/);
      return match ? `${match[1]}<span class="ll-code-token-property">${escape(match[2])}</span>:${escape(match[4])}` : escape(line);
    }).join('\n');
  }
  function selectPanel(panel, persist = true) {
    state.panel = panel;
    $$('[data-ll-panel]').forEach(button => { const active = button.dataset.llPanel === panel; button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; });
    $('#ll-panel-insight').hidden = panel !== 'insight'; $('#ll-panel-code').hidden = panel !== 'code';
    if (persist) save();
  }

  // Export a real, self-contained example, including working example controls.
  function fullCSS() {
    return `/* ${t('baseComment')} */\n${BASE_CSS}\n${rules()}\n\n.lens-document {\n  --lens-text: ${state.textZoom ? '2' : '1'};\n  max-width: ${state.width}px;\n  margin-inline: auto;\n}`;
  }
  function standaloneScript() {
    const payload = JSON.stringify(state).replace(/</g, '\\u003c');
    const strings = JSON.stringify(TEXT).replace(/</g, '\\u003c');
    return `(() => {\n'use strict';\nconst state = ${payload};\nconst TEXT = ${strings};\n${t.toString()}\n${escape.toString()}\nconst e = ${e.toString()};\nconst art = ${art.toString()};\n${topbar.toString()}\n${galleryMarkup.toString()}\n${flexMarkup.toString()}\n${editorialMarkup.toString()}\nconst preview = document.querySelector('.lens-document');\nconst render = () => {\n  const focused = document.activeElement?.id === 'll-example-search';\n  preview.innerHTML = state.case === 'grid' ? galleryMarkup() : state.case === 'flex' ? flexMarkup() : editorialMarkup();\n  if (focused) preview.querySelector('input')?.focus();\n};\npreview.addEventListener('click', event => {\n  const action = event.target.closest('[data-lens-action]')?.dataset.lensAction;\n  if (action === 'filter') state.filter = !state.filter;\n  else if (action === 'create') state.tasks = Math.min(8, state.tasks + 1);\n  else if (action === 'bookmark') state.bookmarked = !state.bookmarked;\n  else return;\n  render();\n});\npreview.addEventListener('input', event => {\n  if (event.target.id === 'll-example-search') { state.query = event.target.value.slice(0, 120); render(); }\n});\nconst range = document.getElementById('export-width');\nrange.addEventListener('input', () => {\n  preview.style.maxWidth = range.value + 'px';\n  document.getElementById('export-width-value').textContent = range.value + ' px';\n});\n})();`;
  }
  function fullHTML() {
    const name = t(`${state.case}Title`);
    const markup = state.case === 'grid' ? galleryMarkup() : state.case === 'flex' ? flexMarkup() : editorialMarkup();
    const exportStyle = `\nbody { margin: 0; padding: 24px; background: #f0f3f7; }\n.export-header { max-width: 1200px; margin: 0 auto 20px; color: #53637a; font: 12px/1.7 system-ui, sans-serif; }\n.export-header p { margin: 4px 0 12px; color: #8795a7; }\n.export-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }\n.export-controls input { width: min(350px, 60vw); accent-color: #435ce8; }\n.export-controls output { font-family: Consolas, monospace; }\n.lens-document { border: 1px solid #dce3ed; border-radius: 8px; overflow: hidden; }\n@media (max-width: 500px) { body { padding: 12px; } }`;
    return `<!doctype html>\n<html lang="${state.lang === 'en' ? 'en' : 'zh-CN'}">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${escape(t('htmlTitle', { case: name }))}</title>\n<style>\n${fullCSS()}\n${exportStyle}\n</style>\n</head>\n<body>\n<header class="export-header">\n  <strong>${e('exportHeader')}</strong>\n  <p>${escape(t('exportCaption', { case: name, mode: t(state.mode) }))}</p>\n  <div class="export-controls"><label for="export-width">${e('width')}</label><input type="range" id="export-width" min="320" max="1200" value="${state.width}"><output id="export-width-value" for="export-width">${state.width} px</output></div>\n</header>\n<div class="lens-document" data-guides="false">\n${markup}\n</div>\n<script>\n${standaloneScript().replace(/<\/script/gi, '<\\/script')}\n</script>\n</body>\n</html>`;
  }
  let sourceTab = 'css';
  function renderSource() {
    $$('[data-ll-source]').forEach(button => { const active = button.dataset.llSource === sourceTab; button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; });
    $('#ll-source-panel').setAttribute('aria-labelledby', `ll-source-tab-${sourceTab}`);
    $('#ll-full-code').textContent = sourceTab === 'css' ? fullCSS() : fullHTML();
  }
  async function copy(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const previous = document.activeElement;
        const area = document.createElement('textarea');
        area.value = text; area.style.cssText = 'position:fixed;top:0;left:-9999px;';
        const host = $('#ll-code-dialog').open ? $('#ll-code-dialog') : root;
        host.appendChild(area); area.select();
        let copied = false;
        try { copied = document.execCommand('copy'); } finally { area.remove(); previous?.focus({ preventScroll: true }); }
        if (!copied) throw new Error('Clipboard unavailable');
      }
      toast(t('copyDone'));
    } catch (_) { toast(t('copyFail')); }
  }
  function exportExperiment() {
    const blob = new Blob([fullHTML()], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `layout-lens-${state.case}-${state.mode}.html`;
    root.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000); toast(t('exportDone'));
  }

  // Short guided experiment. It stops on manual input or when leaving the lab.
  let tourIndex = -1, tourTimer = 0;
  function stopTour(notify = false) {
    clearTimeout(tourTimer); tourTimer = 0; tourIndex = -1;
    $('#ll-tour-banner').hidden = true;
    if (notify) toast(t('tourDone'));
  }
  function tourStep(index) {
    if (index >= 4) { stopTour(true); return; }
    clearTimeout(tourTimer); tourIndex = index;
    const steps = [
      { case: 'grid', mode: 'fluid', width: 960, min: 220, gap: 16, long: false, textZoom: false, guides: false, panel: 'insight' },
      { width: 375, mode: 'fluid', long: false },
      { width: 375, mode: 'fixed', long: true, guides: true },
      { mode: 'fluid', guides: true }
    ];
    update(steps[index]);
    $('#ll-tour-banner').hidden = false;
    $('#ll-tour-count').textContent = `0${index + 1} / 04`;
    $('#ll-tour-title').textContent = t(`tourTitle${index}`);
    $('#ll-tour-description').textContent = t(`tourDesc${index}`);
    $('#ll-tour-next').textContent = t(index === 3 ? 'finish' : 'nextStep');
    $('#ll-canvas').scrollTop = 0;
    tourTimer = setTimeout(() => tourStep(index + 1), index === 3 ? 7500 : 5500);
  }
  root.addEventListener('click', event => {
    if (tourIndex >= 0 && !event.target.closest('#ll-tour, #ll-tour-next, #ll-tour-close')) stopTour();
  }, true);
  root.addEventListener('pointerdown', event => {
    if (tourIndex >= 0 && event.target.matches('input, #ll-drag, #ll-drag *')) stopTour();
  }, true);
  $('#ll-tour').addEventListener('click', () => { if (tourIndex >= 0) stopTour(); else tourStep(0); });
  $('#ll-tour-next').addEventListener('click', () => tourStep(tourIndex + 1));
  $('#ll-tour-close').addEventListener('click', () => stopTour());

  $$('[data-ll-case]').forEach(button => button.addEventListener('click', () => {
    update({ case: button.dataset.llCase, panel: 'insight', query: '' });
    $('#ll-canvas').scrollTop = 0;
  }));
  $$('[data-ll-mode]').forEach(button => button.addEventListener('click', () => update({ mode: button.dataset.llMode })));
  $$('[data-ll-device]').forEach(button => button.addEventListener('click', () => { update({ width: Number(button.dataset.llDevice) }); $('#ll-canvas').scrollTop = 0; }));
  $$('[data-ll-lang]').forEach(button => button.addEventListener('click', () => { state.lang = button.dataset.llLang; applyLanguage(); update({}); }));
  [['#ll-gap', 'gap'], ['#ll-min', 'min'], ['#ll-width', 'width']].forEach(([id, field]) => {
    $(id).addEventListener('input', event => { stopTour(); update({ [field]: Number(event.target.value) }); });
  });
  function commitWidth() {
    const value = $('#ll-width-number').value.trim();
    const width = value ? clamp(value, 320, 1200, state.width) : state.width;
    $('#ll-width-number').value = width; update({ width });
  }
  $('#ll-width-number').addEventListener('change', commitWidth);
  $('#ll-width-number').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); commitWidth(); $('#ll-width-number').blur(); } });
  [['#ll-long', 'long'], ['#ll-text-zoom', 'textZoom'], ['#ll-guides', 'guides']].forEach(([id, field]) => $(id).addEventListener('click', () => update({ [field]: !state[field] })));
  $('#ll-reset').addEventListener('click', () => {
    const { case: current, lang } = state;
    update({ ...DEFAULTS, case: current, lang, width: window.matchMedia('(max-width: 730px)').matches ? 375 : 960 });
    $('#ll-canvas').scrollTop = 0; toast(t('resetDone'));
  });
  $('#ll-challenge').addEventListener('click', () => {
    update({ width: 375, mode: 'fixed', long: true, panel: 'insight' });
    $('#ll-canvas').scrollTop = 0; toast(t('fixedReady'));
  });
  $('#ll-fix').addEventListener('click', () => { update({ mode: 'fluid' }); toast(t('fixedDone')); });
  $$('[data-ll-panel]').forEach(button => button.addEventListener('click', () => selectPanel(button.dataset.llPanel)));
  $('#ll-copy-css').addEventListener('click', () => copy(rules()));
  $('#ll-open-code').addEventListener('click', () => { sourceTab = 'css'; renderSource(); $('#ll-code-dialog').showModal(); });
  $('#ll-close-code').addEventListener('click', () => $('#ll-code-dialog').close());
  $('#ll-code-dialog').addEventListener('click', event => { if (event.target === $('#ll-code-dialog')) { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); } });
  $$('[data-ll-source]').forEach(button => button.addEventListener('click', () => { sourceTab = button.dataset.llSource; renderSource(); }));
  $('#ll-copy-source').addEventListener('click', () => copy(sourceTab === 'css' ? fullCSS() : fullHTML()));
  $('#ll-export').addEventListener('click', exportExperiment); $('#ll-export-dialog').addEventListener('click', exportExperiment);

  function keyboardTabs(selector, activate) {
    const buttons = $$(selector);
    buttons.forEach((button, index) => button.addEventListener('keydown', event => {
      let next = null;
      if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = buttons.length - 1;
      if (next !== null) { event.preventDefault(); stopTour(); activate(buttons[next]); buttons[next].focus(); }
    }));
  }
  keyboardTabs('[data-ll-panel]', button => selectPanel(button.dataset.llPanel));
  keyboardTabs('[data-ll-source]', button => { sourceTab = button.dataset.llSource; renderSource(); });

  let drag = null;
  const handle = $('#ll-drag');
  handle.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault(); stopTour();
    drag = { id: event.pointerId, x: event.clientX, width: state.width, scale: displayScale };
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    // Centered frame: one display-pixel of edge movement changes total width by two.
    update({ width: clamp(drag.width + 2 * (event.clientX - drag.x) / drag.scale, 320, 1200, drag.width) });
  });
  const endDrag = () => { drag = null; };
  handle.addEventListener('pointerup', endDrag); handle.addEventListener('pointercancel', endDrag); handle.addEventListener('lostpointercapture', endDrag);
  handle.addEventListener('keydown', event => {
    const step = event.shiftKey ? 50 : 10;
    const key = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step }[event.key];
    let width = key ? state.width + key : event.key === 'Home' ? 320 : event.key === 'End' ? 1200 : null;
    if (width !== null) { event.preventDefault(); stopTour(); update({ width: clamp(width, 320, 1200, state.width) }); }
  });

  preview.addEventListener('click', event => {
    const action = event.target.closest('[data-lens-action]')?.dataset.lensAction;
    if (action === 'filter') update({ filter: !state.filter });
    else if (action === 'create') {
      if (state.tasks >= 8) toast(t('maxProjects'));
      else { update({ tasks: state.tasks + 1, filter: false, query: '' }); toast(t('newProjectAdded')); }
    } else if (action === 'bookmark') { update({ bookmarked: !state.bookmarked }); toast(t('bookmarkDone')); }
  });
  preview.addEventListener('input', event => { if (event.target.id === 'll-example-search') update({ query: event.target.value.slice(0, 120) }); });
  let inspected = null;
  function inspect(target) {
    if (!state.guides) return;
    const item = target.closest('[data-lens-item]');
    if (!item) return;
    if (inspected && inspected !== item) inspected.classList.remove('lens-inspected');
    inspected = item; item.classList.add('lens-inspected');
    const tip = $('#ll-measure-tip');
    const name = item.className.split(' ').find(cls => cls.startsWith('lens-') && cls !== 'lens-inspected') || item.tagName.toLowerCase();
    tip.textContent = `.${name}  ·  ${item.offsetWidth} × ${item.offsetHeight} px  ·  DOM ${item.dataset.lensIndex}`;
    tip.hidden = false;
  }
  preview.addEventListener('pointerover', event => inspect(event.target));
  preview.addEventListener('focusin', event => inspect(event.target));
  preview.addEventListener('pointerleave', () => { if (inspected) inspected.classList.remove('lens-inspected'); inspected = null; $('#ll-measure-tip').hidden = true; });

  document.addEventListener('layout:viewchange', event => {
    if (event.detail.view === 'lab') scheduleMeasure();
    else { stopTour(); cancelAnimationFrame(raf); }
  });
  window.addEventListener('resize', scheduleMeasure, { passive: true });
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe($('#ll-canvas'));
    observer.observe(preview);
  }
  if (document.fonts?.ready) document.fonts.ready.then(scheduleMeasure);
  applyLanguage(); render();
})();
