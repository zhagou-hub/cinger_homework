import {escapeHTML} from '../charts.js';
export const esc = escapeHTML;
export const num = (v, digits = 3) => Number(v).toFixed(digits);
export const text = (x, y, value, extra = '') => `<text x="${x}" y="${y}" ${extra}>${esc(String(value))}</text>`;
export const svg = (label, body, w, h, extra = '') => `<svg viewBox="0 0 ${w} ${h}" role="group" aria-label="${esc(label)}" ${extra}><title>${esc(label)}</title>${body}</svg>`;
export const focusButton = id => `<button class="ai-link ai-focus-trigger" data-focus="${id}" aria-label="放大查看${({history:'发展历程',concepts:'概念解析',tasks:'任务类别',representation:'数据表征',training:'模型训练',inference:'任务推理'})[id]}">放大查看 ⤢</button>`;
export const toolbar = (label, id) => `<div class="ai-toolbar"><strong>${label}</strong>${focusButton(id)}</div>`;
export function installFocusView(doc, onResize = () => {}) {
  const win = doc.defaultView, dialog = doc.createElement('dialog');
  dialog.className = 'ai-focus-dialog'; dialog.setAttribute('aria-label', '放大查看交互图形');
  dialog.innerHTML = '<div class="ai-focus-head"><span>课堂观察 · 保留当前数据与选择</span><button class="ai-button" data-close-focus>返回页面 · Esc</button></div><div class="ai-focus-content"></div>';
  doc.body.append(dialog);
  let target, placeholder, trigger, y, oldOverflow;
  const close = () => {
    if (!target) return;
    placeholder.replaceWith(target); target = null;
    doc.body.style.overflow = oldOverflow;
    win.scrollTo?.({top: y, behavior: 'instant'});
    (trigger?.isConnected ? trigger : doc.querySelector(`[data-focus="${dialog.dataset.visual}"]`))?.focus({preventScroll:true});
    onResize();
  };
  doc.addEventListener('click', e => {
    const open = e.target.closest('[data-focus]');
    if (open && !dialog.open) {
      trigger = open; y = win.scrollY; oldOverflow = doc.body.style.overflow;
      target = doc.getElementById(`${open.dataset.focus}-visual`);
      placeholder = doc.createElement('div'); placeholder.style.height = target.getBoundingClientRect().height + 'px';
      target.replaceWith(placeholder); dialog.querySelector('.ai-focus-content').append(target); dialog.dataset.visual = open.dataset.focus;
      doc.body.style.overflow = 'hidden'; dialog.showModal(); dialog.querySelector('[data-close-focus]').focus(); onResize();
    } else if (e.target.closest('[data-close-focus]')) dialog.close();
  });
  dialog.addEventListener('close', close);
  dialog.addEventListener('click', e => {if (e.target === dialog) {const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();}});
  return {dialog, close};
}
export function enableSVGKeyboard(doc) {
  doc.addEventListener('keydown', e => {
    if (e.target.matches('svg [role="button"]') && ['Enter',' '].includes(e.key)) {e.preventDefault();e.target.dispatchEvent(new doc.defaultView.MouseEvent('click', {bubbles:true}));}
  });
}
export function navigateTo(doc, id) {
  const focusDialog=doc.querySelector('.ai-focus-dialog');
  if(focusDialog?.open)focusDialog.close();
  const link = doc.querySelector(`[data-section-link="${id}"]`); link?.click();
  const node = doc.getElementById('ai-' + id); node?.focus({preventScroll:true});
  node?.classList.remove('ai-located'); void node?.offsetWidth; node?.classList.add('ai-located');
}
