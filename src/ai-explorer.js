import {initIntro} from './intro/controller.js';
import {initPrinciples} from './principles/controller.js';
import {initSectionNavigation} from './section-navigation.js';
import {installFocusView,enableSVGKeyboard} from './visual/ui.js';

export function initAI(doc, data) {
  const app=doc.body.dataset.page==='understand'?initIntro(doc):initPrinciples(doc,data);
  installFocusView(doc,()=>app.redraw?.());enableSVGKeyboard(doc);
  const url=new URL(doc.defaultView.location.href),view=url.searchParams.get('view');
  const aliases=doc.body.dataset.page==='understand'?{factors:'concepts',criteria:'tasks',capability:'history',writing:'history',innovation:'history',resources:'tasks'}:{flow:'representation',division:'representation',bottleneck:'representation',knowledge:'representation',collaboration:'training',conditions:'inference'};
  if(view&&aliases[view]){url.searchParams.set('view',aliases[view]);doc.defaultView.history.replaceState(null,'',url);}
  const sectionIds=doc.body.dataset.page==='understand'?['history','concepts','tasks']:['origins','compute','representation','training','inference'];
  const hashId=url.hash.replace(/^#(?:ai-|learn-)?/,'');
  if(hashId&&(aliases[hashId]||sectionIds.includes(hashId))){url.hash='ai-'+(aliases[hashId]||hashId);doc.defaultView.history.replaceState(null,'',url);}
  doc.documentElement.dataset.columnsReady='true';
  // Either order of module loading is supported; shared app initialization owns site menus.
  initSectionNavigation(doc);
  return app;
}
if(typeof document!=='undefined'&&document.body.hasAttribute('data-ai')) {
  const ready=document.body.dataset.page==='mechanism'?fetch(new URL('./data/principle-demo.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();}):Promise.resolve(null);
  ready.then(data=>{window.aiExplorer=initAI(document,data);}).catch(error=>{console.error('AI visualization initialization failed',error);document.querySelector('.reading-content').insertAdjacentHTML('afterbegin','<p class="load-error" role="alert">交互图形暂未加载，请刷新重试。</p>');});
}
