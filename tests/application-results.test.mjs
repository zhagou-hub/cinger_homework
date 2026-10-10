import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {initApplications,manufacturingChart,agricultureChart,serviceChart,scienceChart} from '../src/applications-explorer.js';
import {applicationImpacts as data,impactSources} from '../src/data/application-impacts.js';
import {initApp} from '../src/app.js';
const chart=markup=>new JSDOM(markup).window.document;

test('industrial outcomes retain disclosed quality, material cost and time-to-market changes',()=>{
 assert.deepEqual(data.manufacturing.metrics.map(m=>m.changePct),[-66,-12.5,-46]);
 const doc=chart(manufacturingChart());assert.equal(doc.querySelectorAll('[data-chart-detail]').length,3);
 assert.match(doc.body.textContent,/-66%/);assert.match(doc.body.textContent,/产品上市周期/);assert.doesNotMatch(doc.body.textContent,/PR-AUC|准确率/);
});
test('agricultural outcomes preserve yield and sale-price gains alongside input reductions',()=>{
 assert.deepEqual(data.agriculture.metrics.map(m=>m.changePct),[21,8,-9,-5]);
 const doc=chart(agricultureChart());assert.equal(doc.querySelectorAll('[data-chart-detail]').length,4);
 assert.match(doc.body.textContent,/每英亩辣椒产量/);assert.match(doc.body.textContent,/\+21%/);assert.match(doc.body.textContent,/-9%/);assert.doesNotMatch(doc.body.textContent,/WDI|NDVI|标准差/);
 assert.match(data.agriculture.boundary,/组合项目/);
});
test('service impact uses the published 2025 estimates and preserves overlapping worker groups',()=>{
 assert.deepEqual(data.service.metrics.map(m=>m.changePct),[15,30]);
 const doc=chart(serviceChart());assert.equal(doc.querySelectorAll('[data-chart-detail]').length,2);assert.match(doc.body.textContent,/新人及低技能员工/);
 assert.match(data.service.boundary,/部分质量指标下降/);assert.match(impactSources.find(s=>s.id===data.service.source).method,/不能加总/);
});
test('scientific knowledge expansion keeps the actual catalogues and candidate counts distinct from experiments',()=>{
 assert.deepEqual(data.science.metrics.map(m=>[m.before,m.after]),[[48000,421000],[1000,52000],[9,24]]);
 const doc=chart(scienceChart());assert.equal(doc.querySelectorAll('[data-chart-detail]').length,3);
 assert.match(doc.body.textContent,/421,000/);assert.match(doc.body.textContent,/约 52 倍/);assert.match(doc.body.textContent,/对数刻度/);
 assert.match(data.science.boundary,/仍需实验验证/);assert.match(impactSources.find(s=>s.id===data.science.source).method,/稳定边界重算/);
});
test('each scene has one outcome graph and an accessible matching source, with no demo controls',async()=>{
 const html=await readFile(new URL('../applications.html',import.meta.url),'utf8'),dom=new JSDOM(html,{url:'http://localhost/applications.html',pretendToBeVisual:true}),doc=dom.window.document;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 initApp(doc,{});initApplications(doc);
 assert.deepEqual([...doc.querySelectorAll('[data-section-link]')].map(a=>a.dataset.sectionLink),['manufacturing','agriculture','service','science']);
 assert.equal(doc.querySelectorAll('.result-figure svg').length,4);assert.equal(doc.querySelectorAll('.result-controls,input,select,.effect-card,.analysis-stat-strip').length,0);
 for(const scene of Object.keys(data)){
  const mount=doc.querySelector('#'+scene+'-mount');assert.equal(mount.querySelectorAll('svg').length,1);
  const mark=mount.querySelector('[data-chart-detail]');mark.dispatchEvent(new dom.window.FocusEvent('focusin',{bubbles:true}));assert.equal(mount.querySelector('.result-selection').textContent,mark.dataset.chartDetail);
  const button=mount.querySelector('[data-source]');assert.equal(button.dataset.source,data[scene].source);button.click();assert.ok(doc.querySelector('#source-dialog').open);assert.match(doc.querySelector('#source-dialog-content').textContent,new RegExp(impactSources.find(s=>s.id===button.dataset.source).name.split(' · ')[0]));doc.querySelector('.dialog-close').click();
 }
 dom.window.close();
});
