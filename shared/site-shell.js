/* Global sections belong in the header; the sidebar contains the current section's children. */
(() => {
  'use strict';
  const root = new URL('../', document.currentScript.src);
  const url = path => new URL(path, root).href;
  const path = decodeURIComponent(location.pathname).slice(decodeURIComponent(root.pathname).length);
  const lesson = Number(document.body.dataset.lesson || path.match(/^lesson-0([1-5])\//)?.[1] || 0);
  const page = path.startsWith('chapters/') ? 'catalogue' : path.startsWith('lab/') ? 'lab' : path.startsWith('supplementary/') ? 'examples' : lesson ? 'lesson' : 'home';
  const section = page === 'catalogue' || page === 'lesson' ? 'chapters' : page === 'home' ? 'overview' : page;
  document.body.classList.add('has-site-shell', `site-page-${page}`);

  let content = document.querySelector('body > .page-shell');
  if (!content) {
    content = document.createElement('div');
    for (const node of [...document.body.childNodes]) {
      if (node.nodeType === 1 && ['SCRIPT', 'STYLE'].includes(node.tagName)) continue;
      content.append(node);
    }
    document.body.append(content);
  }
  content.classList.add('site-content');
  const localNav = document.body.dataset.lesson ? content.querySelector('.lesson-main > .chapter-nav') : null;
  const names = ['数据', '数据可视化流程', '色彩专题', '低维数据可视化', '时序数据可视化'];
  const englishNames = ['Data', 'Visualization Pipeline', 'Color', 'Low-dimensional Data', 'Time-series Data'];
  const labels = {
    overview:['课程首页','Course Home'], chapters:['课程讲解','Course Lectures'], lab:['交互实验室','Interactive Lab'], examples:['补充案例','Examples'],
    children:['栏目目录','SECTION CONTENTS'], intro:['课程介绍','Introduction'], structure:['课程内容','Course Structure'], labEntry:['交互实验入口','Interactive Experiments'], guide:['学习方法','Study Guide'],
    explore:['数据分析','Data Analysis'], encoding:['图形对照','Chart Comparison'], color:['色彩实验','Color Mapping'], progress:['学习进度','Learning Progress'], continue:['继续学习','Continue Learning'], source:['原版课程','Original Course']
  };
  const brand = `<a class="site-brand" href="${url('')}" aria-label="见数 · 可视化导论首页"><span class="site-brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>见数<small>VISUAL LEARNING</small></span></a>`;
  const header = document.createElement('header');
  header.className = 'site-global-header';
  header.innerHTML = `${brand}<nav class="site-top-nav" aria-label="主栏目">${[['overview',''],['chapters','lesson-01/'],['lab','lab/'],['examples','supplementary/']].map(([key,href]) => `<a href="${url(href)}" data-shell-label="${key}" ${section === key ? 'aria-current="page"' : ''}>${labels[key][0]}</a>`).join('')}</nav><div class="site-header-tools"><div class="site-language-slot"></div><a class="site-source-link" href="https://cinger007.github.io/vis/" target="_blank" rel="noopener"><span data-shell-label="source">原版课程</span> ↗</a></div>`;

  const sidebar = document.createElement('aside');
  sidebar.id = 'site-sidebar';
  sidebar.className = 'site-sidebar';
  sidebar.setAttribute('aria-label', '当前栏目子目录');
  function contextLink(href, key, i, extra = '') {
    return `<li><a class="site-context-link" href="${href}" ${extra}><span class="site-path-number">${String(i+1).padStart(2,'0')}</span><span data-shell-label="${key}">${labels[key][0]}</span></a></li>`;
  }
  let children;
  if (section === 'chapters') {
    children = `<ol class="site-course-path" aria-label="五章学习路径">${names.map((name,i) => `<li><a class="site-context-link" href="${url(`lesson-0${i+1}/`)}" data-lesson="${i+1}" ${lesson === i+1 ? 'aria-current="page"' : ''}><span class="site-path-number">${String(i+1).padStart(2,'0')}</span><span class="site-path-name" data-name-index="${i}">${name}</span></a></li>`).join('')}</ol>`;
  } else if (section === 'lab') {
    children = `<ol class="site-context-list">${['explore','encoding','color'].map((key,i) => contextLink(url(`lab/#${key}`),key,i,`data-lab-tab="${key}"`)).join('')}</ol>`;
  } else if (section === 'examples') {
    children = `<ol class="site-context-list">${names.map((name,i) => `<li><a class="site-context-link" href="${url(`supplementary/#examples-chapter-${i+1}`)}" data-example-chapter="${i+1}"><span class="site-path-number">${String(i+1).padStart(2,'0')}</span><span class="site-path-name" data-name-index="${i}">${name}</span></a></li>`).join('')}</ol>`;
  } else {
    children = `<ol class="site-context-list">${[['intro','course-title'],['structure','course-structure'],['labEntry','lab-title'],['guide','guide-title']].map(([key,id],i) => contextLink(url(`#${id}`),key,i,`data-home-anchor="${id}"`)).join('')}</ol>`;
  }
  sidebar.innerHTML = `<div class="site-context-heading"><span data-shell-label="children">栏目目录</span><h2 data-shell-label="${section}">${labels[section][0]}</h2></div><nav class="site-sub-nav" aria-label="子栏目">${children}</nav><div class="site-local-nav"></div><div class="site-progress"><div class="site-progress-heading"><span data-shell-label="progress">学习进度</span><strong id="progress-number">0 / 5</strong></div><progress id="course-progress" value="0" max="5" aria-label="已完成章节">0 / 5</progress><p id="progress-note">学习进度依据章节完成标记记录。</p><a id="continue-link" href="${url('lesson-01/')}"><span data-shell-label="continue">继续学习</span><span aria-hidden="true">↗</span></a></div>`;
  if (localNav) sidebar.querySelector('.site-local-nav').append(localNav);
  else sidebar.querySelector('.site-local-nav').remove();
  if (section === 'lab') {
    const experimentTabs = content.querySelector('.experiment-tabs');
    if (experimentTabs) sidebar.querySelector('.site-sub-nav').replaceChildren(experimentTabs);
  }
  document.body.prepend(header, ...(page === 'home' ? [] : [sidebar]));
  const oldLanguage = document.querySelector('.lang-switch');
  if (oldLanguage) { oldLanguage.classList.remove('lang-switch-floating'); header.querySelector('.site-language-slot').append(oldLanguage); }

  const toggle = document.createElement('button');
  toggle.type = 'button'; toggle.className = 'site-menu-toggle';
  toggle.setAttribute('aria-controls','site-sidebar'); toggle.setAttribute('aria-expanded','false');
  const overlay = document.createElement('button');
  overlay.type = 'button'; overlay.className = 'site-nav-overlay'; overlay.setAttribute('aria-label','关闭子目录'); overlay.hidden = true;
  const mobile = matchMedia('(max-width: 760px)');
  function closeMenu() { document.body.classList.remove('site-menu-open'); toggle.setAttribute('aria-expanded','false'); overlay.hidden = true; }
  toggle.addEventListener('click',() => { const open = !document.body.classList.contains('site-menu-open'); document.body.classList.toggle('site-menu-open',open); toggle.setAttribute('aria-expanded',String(open)); overlay.hidden = !open; });
  overlay.addEventListener('click',closeMenu);
  sidebar.addEventListener('click',event => {
    if (event.target.closest('[role="tab"]')) {
      document.querySelector('.site-content > main')?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
      if (mobile.matches) closeMenu();
      return;
    }
    const a = event.target.closest('a');
    if (!a) return;
    if (a.dataset.labTab) {
      const tab = document.getElementById(`tab-${a.dataset.labTab}`);
      if (tab) {
        event.preventDefault(); tab.click();
        document.querySelector('.experiment-tabs').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
      }
    }
    if (mobile.matches) closeMenu();
  });
  document.addEventListener('keydown',event => { if (event.key === 'Escape' && document.body.classList.contains('site-menu-open')) { closeMenu(); toggle.focus(); } });
  mobile.addEventListener('change',closeMenu);
  if (page !== 'home') document.body.append(overlay,toggle);

  function updateContext() {
    if (section === 'overview') {
      const selected = location.hash.slice(1) || 'course-title';
      sidebar.querySelectorAll('[data-home-anchor]').forEach(a => { if (a.dataset.homeAnchor === selected) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current'); });
    } else if (section === 'examples') {
      const groups = [['tableshow.html','newstudent.html'],['treelist.html','nssystem.html'],['sex_compare.html'],['crime1985.html','regression.html','colormap.html','mark.html','contour.html','contourd3.html'],['calendar.html','calendar1.html','calendar3.html']];
      const file = path.split('/').pop();
      const selected = Number(location.hash.match(/^#examples-chapter-(\d)$/)?.[1]) || groups.findIndex(group => group.includes(file))+1 || 1;
      sidebar.querySelectorAll('[data-example-chapter]').forEach(a => { if (Number(a.dataset.exampleChapter) === selected) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current'); });
    }
  }
  function updateProgress() {
    let state = {};
    try { state = JSON.parse(localStorage.getItem('vis-learning-v1') || '{}') || {}; } catch (_) {}
    const completed = [...new Set(Array.isArray(state.completed) ? state.completed.filter(n => Number.isInteger(n) && n > 0 && n < 6) : [])];
    sidebar.querySelector('#progress-number').textContent = `${completed.length} / 5`;
    sidebar.querySelector('#course-progress').value = completed.length;
    sidebar.querySelector('#course-progress').textContent = `${completed.length} / 5`;
    const last = Number.isInteger(state.lastLesson) && state.lastLesson > 0 && state.lastLesson < 6 ? state.lastLesson : 1;
    sidebar.querySelector('#continue-link').href = url(`lesson-0${last}/`);
    sidebar.querySelectorAll('.site-course-path a').forEach(a => a.classList.toggle('is-completed',completed.includes(Number(a.dataset.lesson))));
  }
  function updateLanguage() {
    let storedLocale = '';
    try { storedLocale = localStorage.getItem('wbl-locale') || ''; } catch (_) {}
    const queryLanguage = new URLSearchParams(location.search).get('lang');
    const queryLocale = queryLanguage === 'en' ? 'en-US' : queryLanguage === 'zh' ? 'zh-CN' : '';
    const english = (window.__i18n?.getLocale?.() || queryLocale || storedLocale || 'zh-CN').startsWith('en');
    [...header.querySelectorAll('[data-shell-label]'),...sidebar.querySelectorAll('[data-shell-label]')].forEach(el => { el.textContent = labels[el.dataset.shellLabel][english ? 1 : 0]; });
    sidebar.querySelectorAll('.site-path-name').forEach(el => { el.textContent = (english ? englishNames : names)[Number(el.dataset.nameIndex)]; });
    sidebar.querySelector('#progress-note').textContent = english ? 'Progress is based on chapter completion marks.' : '学习进度依据章节完成标记记录。';
    toggle.textContent = english ? '☰ Section Contents' : '☰ 子目录';
  }
  window.addEventListener('storage',updateProgress);
  window.addEventListener('pageshow',() => { updateProgress(); updateContext(); });
  window.addEventListener('vis:progresschange',updateProgress);
  window.addEventListener('hashchange',updateContext);
  document.addEventListener('vis:labchange',updateContext);
  document.addEventListener('wbl:localechange',updateLanguage);
  updateProgress(); updateLanguage(); updateContext();
  // Every page with the shared header receives the same language control.
  if (![...document.querySelectorAll('link[rel="stylesheet"]')].some(link => link.href === url('i18n.css'))) {
    const languageStyle = document.createElement('link'); languageStyle.rel = 'stylesheet'; languageStyle.href = url('i18n.css'); document.head.append(languageStyle);
  }
  if (![...document.scripts].some(script => script.src === url('i18n.js'))) {
    const languageScript = document.createElement('script'); languageScript.type = 'module'; languageScript.src = url('i18n.js'); document.head.append(languageScript);
  }
})();
