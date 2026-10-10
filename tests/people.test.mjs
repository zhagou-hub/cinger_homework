import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {initPeopleExplorer,treemapLayout,provinces,usageColor} from '../src/people-explorer.js';
const data=JSON.parse(await readFile(new URL('../src/data/people-insights.json',import.meta.url),'utf8'));
const html=await readFile(new URL('../people.html',import.meta.url),'utf8');
function setup(){const dom=new JSDOM(html,{pretendToBeVisual:true});let tasks=0;const explorer=initPeopleExplorer(dom.window.document,data,()=>tasks++);return {dom,doc:dom.window.document,explorer,get tasks(){return tasks;}};}
test('new data preserves published values, coverage and missingness',()=>{
 assert.equal(data.world.countries.length,147);assert.equal(new Set(data.world.countries.map(c=>c.id)).size,147);
 assert.equal(data.world.countries.find(c=>c.id==='CHN').q2_2026,17.5);
 assert.equal(data.world.countries.find(c=>c.id==='ARE').q2_2026,73.3);
 const shapeIds=new Set(data.world.geometry.map(g=>g.id));for(const c of data.world.countries)assert.ok(shapeIds.has(c.id),c.id);
 assert.equal(data.usage.topics.length,20);assert.equal(Math.round(data.usage.topics.reduce((n,t)=>n+t.value,0)*100)/100,98.67);
 assert.equal(data.usage.topics[0].value,22.72);assert.equal(data.china.groups[0].n,608);
 assert.equal(new Set(provinces.map(p=>p[0])).size,34);assert.equal(new Set(provinces.map(p=>`${p[1]},${p[2]}`)).size,34);
 for(const g of data.china.groups){assert.equal(g.ranking.length,10);for(const name of g.ranking)assert.ok(provinces.some(p=>p[0]===name));}
 assert.equal(usageColor(null),'#dedfda');assert.notEqual(usageColor(0),usageColor(null));
});
test('treemap encodes relative areas without overlaps or silently rewriting percentages',()=>{
 for(const [width,height] of [[860,470],[300,450]]){
  const boxes=treemapLayout(data.usage.topics,width,height),total=data.usage.coverage;
  for(const box of boxes){assert.ok(box.x>=0&&box.y>=0);assert.ok(box.x+box.w<=width+1e-6&&box.y+box.h<=height+1e-6);assert.ok(Math.abs(box.w*box.h/(width*height)-box.value/total)<1e-8);}
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert.ok(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)<1e-6||Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)<1e-6);}
 }
});
test('world period, search, selection and unmeasured regions remain distinct',()=>{
 const t=setup(),d=t.doc;assert.match(d.querySelector('#world-detail').textContent,/17.5/);
 const period=d.querySelector('#world-period');period.value='h1_2025';period.dispatchEvent(new t.dom.window.Event('change',{bubbles:true}));assert.match(d.querySelector('#world-detail').textContent,/15.4/);
 const search=d.querySelector('#world-search');search.value='Singapore';search.dispatchEvent(new t.dom.window.Event('input',{bubbles:true}));assert.equal(d.querySelectorAll('#world-ranking button').length,1);
 d.querySelector('#world-ranking button').click();assert.match(d.querySelector('#world-detail').textContent,/58.6/);
 d.querySelector('#world-map [aria-disabled=true]').dispatchEvent(new t.dom.window.MouseEvent('click',{bubbles:true}));assert.equal(t.explorer.state.country,'SGP');
 search.value='NoSuchCountryXYZ';search.dispatchEvent(new t.dom.window.Event('input',{bubbles:true}));assert.match(d.querySelector('#world-ranking').textContent,/没有匹配/);t.dom.window.close();
});
test('all people charts persist, topics drill down, province groups retain missing ranks',()=>{
 const t=setup(),d=t.doc;t.explorer.showView('usage');assert.equal(d.querySelectorAll('.people-view:not([hidden])').length,4);
 const id=data.usage.topics.find(t=>t.original==='Education & Learning').id;d.querySelector(`[data-topic="${id}"]`).click();assert.match(d.querySelector('#usage-detail').textContent,/13.23/);
 t.explorer.showView('china');assert.equal(d.querySelectorAll('.province-tile').length,34);assert.equal(d.querySelector('.province-tile[data-province=北京]').dataset.rank,'3');
 d.querySelector('[data-china-group=tool]').click();assert.equal(d.querySelector('.province-tile[data-province=北京]').dataset.rank,'0');d.querySelector('.province-tile[data-province=北京]').click();assert.match(d.querySelector('#china-detail').textContent,/未公布位次/);assert.match(d.querySelector('#china-sample').textContent,/231/);
 t.explorer.showView('tasks');assert.equal(t.tasks,1);assert.equal(d.querySelectorAll('.people-view:not([hidden])').length,4);t.dom.window.close();
});
