/* Only an explicit button click marks a chapter complete. No accounts or network storage. */
(() => {
  'use strict';
  const key = 'vis-learning-v1';
  const lesson = Number(document.body.dataset.lesson);
  if (!Number.isInteger(lesson) || lesson < 1 || lesson > 5) return;
  const emptyState = () => ({ completed: [], lastLesson: lesson, lastVisited: new Date().toISOString() });
  function readState() {
    try {
      const stored = JSON.parse(localStorage.getItem(key));
      if (!stored || typeof stored !== 'object') return emptyState();
      return {
        completed: [...new Set(Array.isArray(stored.completed) ? stored.completed.filter(n => Number.isInteger(n) && n >= 1 && n <= 5) : [])].sort((a, b) => a - b),
        lastLesson: Number.isInteger(stored.lastLesson) && stored.lastLesson >= 1 && stored.lastLesson <= 5 ? stored.lastLesson : lesson,
        lastVisited: typeof stored.lastVisited === 'string' ? stored.lastVisited : new Date().toISOString()
      };
    } catch (_) { return emptyState(); }
  }
  let state = readState();
  let storageAvailable = true;
  function saveState() {
    try { localStorage.setItem(key, JSON.stringify(state)); storageAvailable = true; }
    catch (_) { storageAvailable = false; }
  }
  state.lastLesson = lesson;
  state.lastVisited = new Date().toISOString();
  saveState();

  const bar = document.createElement('div');
  bar.className = 'learning-bar';
  const home = document.createElement('a');
  home.className = 'learning-home';
  home.href = '../#chapters';
  const status = document.createElement('span');
  status.className = 'learning-status';
  status.setAttribute('role', 'status');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'learning-complete';
  bar.append(home, status, button);
  const header = document.querySelector('.lesson-header');
  if (!header) return;
  header.after(bar);

  function render() {
    const completed = state.completed.includes(lesson);
    const english = document.documentElement.lang.startsWith('en');
    home.textContent = english ? '← All chapters' : '← 返回课程目录';
    button.textContent = english ? (completed ? '✓ Completed · undo' : 'Mark chapter complete') : (completed ? '✓ 本章已学 · 点击撤销' : '标记本章已学');
    button.setAttribute('aria-pressed', String(completed));
    status.textContent = english
      ? `${state.completed.length} / 5 chapters completed · ${storageAvailable ? 'Saved in this browser' : 'Storage unavailable; progress lasts for this page only'}`
      : `已完成 ${state.completed.length} / 5 章 · ${storageAvailable ? '进度保存在当前浏览器' : '浏览器存储不可用，仅本页暂存'}`;
  }
  button.addEventListener('click', () => {
    // Merge other-tab updates before changing only this chapter.
    if (storageAvailable) state = readState();
    state.completed = state.completed.includes(lesson)
      ? state.completed.filter(n => n !== lesson)
      : [...state.completed, lesson].sort((a, b) => a - b);
    state.lastLesson = lesson;
    state.lastVisited = new Date().toISOString();
    saveState();
    render();
    window.dispatchEvent(new CustomEvent('vis:progresschange', { detail: state }));
  });
  document.addEventListener('wbl:localechange', render);
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    state = readState();
    render();
  });
  render();
})();
