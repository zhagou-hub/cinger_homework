// Page Layout Course · lightweight bilingual switcher
const I18N = {
  'zh-CN': {
    'site.brand': '页面布局课程',
    'nav.lang.label': '切换语言',
    'tab.explain': '📖 讲解',
    'tab.code': '⌨️ 关键代码',
    'tab.demo': '▶️ 演示',
    'top.principles': '布局准则',
    'top.flow': '文档流',
    'top.responsive': '响应式',
    'top.audit': '布局检查',
    'sec-06-1.title': '6.1 布局先于代码',
    'sec-06-2.title': '6.2 文档流与盒模型',
    'sec-06-3.title': '6.3 Flexbox 一维布局',
    'sec-06-4.title': '6.4 Grid 二维布局',
    'sec-06-5.title': '6.5 响应式不是缩小',
    'sec-06-6.title': '6.6 可靠页面的最终检查'
  },
  'en-US': {
    'site.brand': 'Page Layout Course',
    'nav.lang.label': 'Switch language',
    'tab.explain': '📖 Explain',
    'tab.code': '⌨️ Key Code',
    'tab.demo': '▶️ Demo',
    'top.principles': 'Principles',
    'top.flow': 'Normal Flow',
    'top.responsive': 'Responsive',
    'top.audit': 'Layout Audit',
    'sec-06-1.title': '6.1 Layout Before Code',
    'sec-06-2.title': '6.2 Normal Flow & Box Model',
    'sec-06-3.title': '6.3 One-Dimensional Flexbox',
    'sec-06-4.title': '6.4 Two-Dimensional Grid',
    'sec-06-5.title': '6.5 Responsive Is Not Shrinking',
    'sec-06-6.title': '6.6 Final Resilience Checks'
  }
};

const STORAGE_KEY = 'layout-course-locale';
const DEFAULT_LOCALE = 'zh-CN';
let currentLocale = DEFAULT_LOCALE;

function readUrlLocale() {
  const value = new URLSearchParams(location.search).get('lang');
  if (value === 'en') return 'en-US';
  if (value === 'zh') return 'zh-CN';
  return null;
}

function readStoredLocale() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return I18N[value] ? value : null;
  } catch (_) {
    return null;
  }
}

function t(key) {
  return I18N[currentLocale]?.[key] || I18N[DEFAULT_LOCALE]?.[key] || key;
}

function applyLocale(locale) {
  currentLocale = I18N[locale] ? locale : DEFAULT_LOCALE;
  try { localStorage.setItem(STORAGE_KEY, currentLocale); } catch (_) {}

  document.documentElement.lang = currentLocale === 'en-US' ? 'en' : 'zh-CN';
  document.title = currentLocale === 'en-US' ? 'Page Layout Course' : '页面布局课程教学网站';

  document.querySelectorAll('[data-i18n]').forEach(element => {
    const value = t(element.dataset.i18n);
    if (value) element.textContent = value;
  });

  document.querySelectorAll('[data-lang]').forEach(element => {
    element.hidden = element.dataset.lang !== currentLocale;
  });

  document.querySelectorAll('[data-lang-btn]').forEach(button => {
    button.classList.toggle('active', button.dataset.langBtn === currentLocale);
  });

  document.querySelectorAll('.lang-switch').forEach(element => {
    element.setAttribute('aria-label', t('nav.lang.label'));
  });

  document.querySelectorAll('[data-i18n-href="lecture"]').forEach(link => {
    link.href = currentLocale === 'en-US' ? './lecture-en.md' : './lecture.md';
  });

  document.dispatchEvent(new CustomEvent('wbl:localechange', { detail: { locale: currentLocale } }));
}

function buildLanguageSwitch() {
  const wrapper = document.createElement('div');
  wrapper.className = 'lang-switch';
  wrapper.setAttribute('role', 'group');
  wrapper.innerHTML = `
    <button type="button" data-lang-btn="zh-CN" aria-label="中文">中</button>
    <button type="button" data-lang-btn="en-US" aria-label="English">EN</button>
  `;

  wrapper.addEventListener('click', event => {
    const button = event.target.closest('[data-lang-btn]');
    if (!button) return;
    const locale = button.dataset.langBtn;
    applyLocale(locale);

    const params = new URLSearchParams(location.search);
    if (locale === 'en-US') params.set('lang', 'en');
    else params.delete('lang');
    const query = params.toString();
    history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
  });

  return wrapper;
}

function init() {
  currentLocale = readUrlLocale() || readStoredLocale() || DEFAULT_LOCALE;
  const topbar = document.querySelector('.course-topbar');
  if (topbar) topbar.appendChild(buildLanguageSwitch());
  applyLocale(currentLocale);
}

window.__i18n = {
  setLocale: applyLocale,
  getLocale: () => currentLocale,
  t
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
