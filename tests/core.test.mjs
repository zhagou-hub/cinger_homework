import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {initApp,filterOccupations} from '../src/app.js';
import {effectInterval,series} from '../src/charts.js';
const data=JSON.parse(await readFile(new URL('../src/data/datasets.json',import.meta.url),'utf8'));
const peopleData=JSON.parse(await readFile(new URL('../src/data/people-insights.json',import.meta.url),'utf8'));
const pages=['understand','mechanism','applications','people','futures','sources'];
const documents=Object.fromEntries(await Promise.all(pages.map(async page=>[page,await readFile(new URL(`../${page}.html`,import.meta.url),'utf8')])));
function setup(page='people'){
 const dom=new JSDOM(documents[page],{url:`http://localhost/${page}.html`,pretendToBeVisual:true});
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const app=initApp(dom.window.document,data,peopleData),doc=dom.window.document;
 const click=selector=>{const node=doc.querySelector(selector);assert.ok(node,`Missing ${selector}`);node.click();};
 const input=(selector,value,type='input')=>{const node=doc.querySelector(selector);node.value=value;node.dispatchEvent(new dom.window.Event(type,{bubbles:true}));};
 return {dom,doc,...app,click,input};
}
test('each navigation destination is a separate initialized document',()=>{
 for(const page of pages){
  const t=setup(page);
  assert.equal(t.doc.querySelectorAll('main section[id]').length,1);
  assert.equal(t.doc.querySelector('main section[id]').id,page);
  assert.equal(t.doc.documentElement.dataset.ready,'true');
  assert.equal(t.doc.querySelectorAll('.hero,.section-heading,.concept-intro,.large-quote,.section-stamp').length,0);
  assert.deepEqual([...t.doc.querySelectorAll('#main-nav a')].map(a=>a.getAttribute('href')),pages.slice(0,5).map(p=>`./${p}.html`));
  const active=t.doc.querySelector('#main-nav [aria-current="page"]');
  assert.equal(active?.dataset.page,page==='sources'?undefined:page);
  if(page!=='sources')assert.ok(t.doc.querySelectorAll('[data-section-link],[data-app-view]').length>=3);
  t.dom.window.close();
 }
});
test('public datasets meet handoff counts, uniqueness and units',()=>{
 assert.equal(data.occupations.length,427);assert.equal(data.occupations.reduce((n,o)=>n+o.tasks.length,0),3265);
 assert.equal(new Set(data.occupations.flatMap(o=>o.tasks.map(t=>`${o.code}/${t.id}`))).size,3265);
 assert.equal(data.manufacturing.length*7,105);assert.equal(data.agriculture.length,8);
 assert.deepEqual(data.adoption.map(r=>r.adoption_pct),[17.7,36.5]);
 assert.equal(data.purposes.length,7);assert.ok(data.purposes.reduce((n,r)=>n+r.share_pct,0)>100);
 assert.equal(data.energy.length,16);assert.equal(data.energy.filter(r=>r.Historical!==null).length,5);
 for(const s of series)assert.equal(data.energy.filter(r=>r[s.key]!==null).length,12);
});
test('occupation search in Chinese, English, code and categories',()=>{
 for(const q of ['数据录入','Data Entry','4132'])assert.equal(filterOccupations(data.occupations,q)[0].code,'4132');
 assert.equal(filterOccupations(data.occupations,'definitely-no-such-occupation').length,0);
 assert.ok(filterOccupations(data.occupations,'','4 - Clerical support workers').every(o=>o.code.startsWith('4')));
});
test('occupation filtering, task drilldown, empty and deselected states',()=>{
 const t=setup();assert.match(t.doc.querySelector('#occupation-detail').textContent,/数据录入员/);
 t.input('#occupation-search','2512');assert.equal(t.state.selected,'2512');
 assert.equal(t.doc.querySelectorAll('.scatter-hit').length,1);
 const occupation=data.occupations.find(o=>o.code==='2512');
 assert.deepEqual([...t.doc.querySelectorAll('#occupation-detail .task-item p')].map(n=>n.textContent).sort(),occupation.tasks.map(t=>t.text).sort());
 t.click('#deselect-occupation');assert.equal(t.state.selected,null);assert.match(t.doc.querySelector('#occupation-detail').textContent,/选择一种职业/);
 t.input('#occupation-search','无此职业xyz');assert.equal(t.doc.querySelectorAll('.scatter-hit').length,0);assert.match(t.doc.querySelector('#occupation-detail').textContent,/没有匹配职业/);
 t.click('#clear-filters');assert.equal(t.doc.querySelectorAll('.scatter-hit').length,427);assert.equal(t.state.selected,'4132');t.dom.window.close();
});
test('comparison limit, removal and clearing',()=>{
 const t=setup();for(const code of ['2166','4222','2411','2513']){t.input('#occupation-search',code);t.click('[data-add-compare]');}
 assert.equal(t.state.compare.length,5);assert.match(t.doc.querySelector('.toast').textContent,/最多比较/);
 t.click('[data-remove-compare="4132"]');assert.equal(t.state.compare.length,4);
 t.click('#clear-comparison');assert.equal(t.state.compare.length,0);assert.match(t.doc.querySelector('#comparison-chart').textContent,/至少 2/);t.dom.window.close();
});
test('archived industry datasets preserve values after application migration',()=>{
 assert.equal(data.manufacturing.find(r=>r.category==='Screw').Student_teacher,0.358);
 const rows=data.agriculture.filter(r=>r.year===2023&&r.growth_stage==='V8-V11');
 assert.ok(Math.abs(rows.find(r=>r.field==='A').wdi-rows.find(r=>r.field==='B').wdi-.02)<1e-12);
 assert.equal(data.service.find(r=>r.metric==='resolution_rate').effect,.0132);
});
test('95% intervals use matched coefficient and SE, without hiding sign uncertainty',()=>{
 for(const r of data.service){const result=effectInterval(r.effect,r.standard_error,r.unit);assert.equal(result.lo,r.effect-1.96*r.standard_error);assert.equal(result.hi,r.effect+1.96*r.standard_error);}
 const rate=data.service.find(r=>r.metric==='resolution_rate');assert.ok(effectInterval(rate.effect,rate.standard_error,'share').lo<0);
});
test('energy year, visibility, historical states and all-hidden state are synchronized',()=>{
 const t=setup('futures');assert.match(t.doc.querySelector('#energy-cards').textContent,/946/);
 t.input('#energy-year','2035');assert.match(t.doc.querySelector('#energy-cards').textContent,/1719/);assert.match(t.doc.querySelector('#energy-chart').textContent,/2035/);
 t.input('#energy-year','2022');assert.match(t.doc.querySelector('#energy-cards').textContent,/324/);assert.equal(t.doc.querySelectorAll('.energy-card').length,1);
 t.input('#energy-year','2030');for(const cb of t.doc.querySelectorAll('[data-energy]')){cb.checked=false;cb.dispatchEvent(new t.dom.window.Event('change',{bubbles:true}));}
 assert.equal(t.doc.querySelectorAll('[data-series]').length,0);assert.match(t.doc.querySelector('#energy-explanation').textContent,/隐藏全部/);t.dom.window.close();
});
test('all source controls resolve to populated, accessible dialogs',()=>{
 const t=setup('sources');for(const button of t.doc.querySelectorAll('#sources-grid [data-source]')){button.click();assert.ok(t.doc.querySelector('#source-dialog').open);assert.ok(t.doc.querySelector('#source-dialog-title'));assert.ok(t.doc.querySelectorAll('#source-dialog-content a').length);}
 t.click('.dialog-close');assert.equal(t.doc.querySelector('#source-dialog').open,false);t.dom.window.close();
});
