import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {initApp} from '../src/app.js';
import {initColumns,calculateScenario} from '../src/column-explorer.js';
import {initSectionNavigation} from '../src/section-navigation.js';
import {initAI} from '../src/ai-explorer.js';

const read=async name=>JSON.parse(await readFile(new URL('../src/data/'+name,import.meta.url),'utf8'));
const [data,insights,protein]=await Promise.all(['datasets.json','column-insights.json','protein-structure.json'].map(read));
const principleData=await read('principle-demo.json');
const pages=['understand','mechanism','futures'];
const html=Object.fromEntries(await Promise.all(pages.map(async p=>[p,await readFile(new URL('../'+p+'.html',import.meta.url),'utf8')])));
function setup(page,view=''){
 const dom=new JSDOM(html[page],{url:`http://localhost/${page}.html${view?'?view='+view:''}`,pretendToBeVisual:true}),doc=dom.window.document;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 // JSDOM does not implement the browser's focus/click helpers on SVG groups.
 dom.window.SVGElement.prototype.focus=function(){};
 initApp(doc,data);const app=doc.body.hasAttribute('data-ai')?initAI(doc,principleData):initColumns(doc,data,insights,protein);
 const click=s=>{const n=doc.querySelector(s);assert.ok(n,'Missing '+s);n.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));};
 const input=(s,v,type='input')=>{const n=doc.querySelector(s);n.value=v;n.dispatchEvent(new dom.window.Event(type,{bubbles:true}));};
 return {dom,doc,app,click,input};
}
test('side navigation keeps all chart sections visible and updates scroll targets',()=>{
 const expected={understand:['history','concepts','tasks'],mechanism:['origins','compute','representation','training','inference'],futures:['energy','barriers','scenario']};
 for(const [page,views] of Object.entries(expected)){
  const t=setup(page),calls=[];t.dom.window.HTMLElement.prototype.scrollIntoView=function(){calls.push(this.id);};
  assert.equal(t.doc.querySelectorAll('.reading-section:not([hidden])').length,views.length);
  t.click(`[data-section-link="${views[1]}"]`);const link=t.doc.querySelector(`[data-section-link="${views[1]}"]`);
  assert.equal(t.dom.window.location.hash,link.getAttribute('href'));assert.deepEqual(calls,[link.getAttribute('href').slice(1)]);
  assert.equal(t.doc.querySelectorAll('[data-section-link][aria-current=location]').length,1);
  assert.equal(t.doc.querySelectorAll('.reading-section:not([hidden])').length,views.length);t.dom.window.close();
 }
});
test('AI history, concepts and tasks connect through explicit identifiers',()=>{
 const a=setup('understand');a.click('[data-event="transformer"]');
 assert.match(a.doc.querySelector('.milestone-insight').textContent,/注意力/);
 a.click('[data-locate-concept="transformer"]');assert.equal(a.app.state.selectedConceptId,'transformer');
 assert.match(a.doc.querySelector('.concept-summary').textContent,/神经网络架构/);
 a.click('[data-locate-task="generation"]');assert.equal(a.app.state.selectedTaskId,'generation');
 assert.match(a.doc.querySelector('.task-map-insight').textContent,/根据提示与条件产生新内容/);a.dom.window.close();
});
test('legacy section URLs scroll after charts are ready and manual scrolling updates the menu',()=>{
 const dom=new JSDOM('<body data-columns><header class="site-header"></header><a href="#first" data-section-link="first">一</a><a href="#second" data-section-link="second">二</a><article id="first"></article><article id="second"></article></body>',{url:'http://localhost/value.html?view=second&year=2030',pretendToBeVisual:true}),doc=dom.window.document,frames=[],calls=[];
 dom.window.requestAnimationFrame=fn=>{frames.push(fn);};dom.window.matchMedia=()=>({matches:true});
 dom.window.HTMLElement.prototype.scrollIntoView=function(options){calls.push({id:this.id,behavior:options.behavior});};
 assert.equal(initSectionNavigation(doc),null);doc.documentElement.dataset.ready='true';doc.documentElement.dataset.columnsReady='true';
 const nav=initSectionNavigation(doc);frames.splice(0).forEach(fn=>fn());assert.deepEqual(calls,[{id:'second',behavior:'auto'}]);assert.equal(dom.window.location.hash,'#second');assert.equal(dom.window.location.search,'?year=2030');
 doc.querySelector('.site-header').getBoundingClientRect=()=>({bottom:64});doc.querySelector('#first').getBoundingClientRect=()=>({top:-400});doc.querySelector('#second').getBoundingClientRect=()=>({top:500});nav.sync();assert.equal(nav.state.active,'first');
 doc.querySelector('#second').getBoundingClientRect=()=>({top:90});dom.window.dispatchEvent(new dom.window.Event('scroll'));frames.splice(0).forEach(fn=>fn());assert.equal(nav.state.active,'second');dom.window.close();
});
test('archived customer-support estimates retain original uncertainty',()=>{
 const rate=data.service.find(r=>r.metric==='resolution_rate');
 assert.equal(rate.effect*100,1.32);assert.ok(rate.effect-1.96*rate.standard_error<0);
 assert.equal(data.service.find(r=>r.metric==='average_handle_time').effect,-3.746);
});
test('frozen datasets retain published denominators, scores and structure',()=>{
 assert.deepEqual(insights.capability.map(c=>c.gain),[18.8,48.9,67.3]);
 assert.equal(insights.barriers.items.length,8);assert.equal(insights.barriers.groups.length,4);
 const expert=insights.barriers.items.find(c=>c.id==='expertise');assert.deepEqual([expert.all,expert.small,expert.medium,expert.large],[70.3,70.9,69.2,65.1]);
 assert.equal(protein.points.length,142);assert.equal(new Set(protein.points.map(p=>p.residue)).size,142);
 assert.ok(protein.points.every(p=>['x','y','z','confidence'].every(k=>Number.isFinite(p[k]))&&p.confidence>=0&&p.confidence<=100));
 const t=setup('futures');t.input('#barrier-group','large','change');t.click('[data-col-bar="privacy"]');
 assert.match(t.doc.querySelector('#barriers-view .column-stat').textContent,/58.8/);assert.match(t.doc.querySelector('#barriers-view .column-aside').textContent,/曾考虑采用/);t.dom.window.close();
});
test('structure confidence remains the original prediction field',()=>{
 assert.equal(protein.points.filter(p=>p.confidence>=90).length,141);
 assert.equal(Math.min(...protein.points.map(p=>p.confidence)),65.38);
});
test('scenario arithmetic covers baseline, no adoption, full adoption and costly review',()=>{
 const defaults={tasks:100,manual:12,coverage:60,assist:2,review:3,call:.5,wage:45};
 const r=calculateScenario(defaults);assert.equal(r.baselineMinutes,1200);assert.equal(r.aidedMinutes,780);assert.equal(r.savedHours,7);assert.equal(r.savedCost,285);
 const noAI=calculateScenario({...defaults,coverage:0});assert.equal(noAI.savedHours,0);assert.equal(noAI.savedCost,0);assert.equal(noAI.apiCost,0);
 const allAI=calculateScenario({...defaults,coverage:100});assert.equal(allAI.aidedMinutes,500);assert.equal(allAI.aidedCost,425);
 const costly=calculateScenario({...defaults,review:12});assert.ok(costly.savedHours<0);assert.ok(costly.savedCost<0);
 const zero=calculateScenario({...defaults,tasks:0});assert.equal(zero.baselineCost,0);assert.equal(zero.aidedCost,0);assert.equal(zero.savedHours,0);
 assert.ok(Object.values(calculateScenario({...defaults,tasks:Infinity})).filter(v=>typeof v==='number').every(Number.isFinite));
});
test('scenario edits update the result and invalid inputs preserve the last valid setting',()=>{
 const t=setup('futures');assert.match(t.doc.querySelector('#scenario-results').textContent,/7.00 小时/);
 t.input('#scenario-coverage','0');assert.match(t.doc.querySelector('#scenario-results').textContent,/0.00 小时/);assert.match(t.doc.querySelector('#scenario-results .column-analysis').textContent,/两方案人工占用时间相同，核算费用相同/);
 const previous=t.doc.querySelector('#scenario-results').textContent;t.input('#scenario-tasks','-4');assert.equal(t.doc.querySelector('#scenario-results').textContent,previous);assert.match(t.doc.querySelector('#scenario-validation').textContent,/有效数字/);
 t.click('[data-scenario-preset="review"]');assert.match(t.doc.querySelector('#scenario-results').textContent,/增加的人工时间/);t.dom.window.close();
});
