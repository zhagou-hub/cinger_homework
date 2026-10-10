/** All chart sections stay in the document; the local menu scrolls between them. */
export function initSectionNavigation(doc){
 const win=doc.defaultView,links=[...doc.querySelectorAll('[data-section-link]')];
 if(!links.length||doc.documentElement.dataset.sectionNavigation==='ready')return null;
 if(doc.body.hasAttribute('data-columns')&&!(doc.documentElement.dataset.ready==='true'&&doc.documentElement.dataset.columnsReady==='true'))return null;
 const entries=links.map(link=>({link,section:doc.getElementById(link.getAttribute('href').slice(1))})).filter(e=>e.section);
 const state={active:entries[0]?.link.dataset.sectionLink};
 const setActive=id=>{state.active=id;entries.forEach(({link})=>{if(link.dataset.sectionLink===id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});};
 const navigate=(id,scroll=true)=>{const item=entries.find(e=>e.link.dataset.sectionLink===id);if(!item)return;setActive(id);const url=new URL(win.location.href);url.hash=item.section.id;url.searchParams.delete('view');win.history.replaceState(null,'',url);if(scroll)item.section.scrollIntoView?.({behavior:win.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});};
 entries.forEach(({link,section})=>{section.hidden=false;link.addEventListener('click',e=>{e.preventDefault();navigate(link.dataset.sectionLink);});});
 let queued=false;
 const sync=()=>{queued=false;const header=doc.querySelector('.site-header')?.getBoundingClientRect().bottom||64,mobileMechanism=['mechanism','applications'].includes(doc.body.dataset.page)&&win.innerWidth<700,offset=mobileMechanism?Math.max(header+55,(doc.querySelector('.section-sidebar')?.getBoundingClientRect().bottom||header)+12):header+55;let current=entries[0];for(const e of entries){if(e.section.getBoundingClientRect().top<=offset+2)current=e;else break;}if(doc.body.dataset.page==='applications'&&win.scrollY+win.innerHeight>=doc.documentElement.scrollHeight-2)current=entries.at(-1);if(current)setActive(current.link.dataset.sectionLink);};
 const onScroll=()=>{if(!queued){queued=true;win.requestAnimationFrame(sync);}};
 win.addEventListener('scroll',onScroll,{passive:true});win.addEventListener('resize',onScroll);
 win.addEventListener('hashchange',()=>{const item=entries.find(e=>'#'+e.section.id===win.location.hash);if(item)navigate(item.link.dataset.sectionLink);});
 doc.documentElement.dataset.sectionNavigation='ready';
 const url=new URL(win.location.href),requested=entries.find(e=>'#'+e.section.id===url.hash)?.link.dataset.sectionLink||url.searchParams.get('view');
 if(requested)win.requestAnimationFrame(()=>navigate(requested));else setActive(state.active);
 return {state,navigate,sync};
}
