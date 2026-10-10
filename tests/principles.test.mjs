import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {predict, loss, train, boundary, lossSlice, oneHot, correctCount} from '../src/principles/model.js';
import {createPrincipleState} from '../src/principles/state.js';
import {initAI} from '../src/ai-explorer.js';
import {initApp} from '../src/app.js';
import {concepts,events,tasks} from '../src/data/ai-content.js';
import {computeGenerations,trainingDataScale} from '../src/data/mechanism-evidence.js';
import {initialNetwork,forwardNetwork,networkGradient,networkMetrics,networkHistory,newInputs} from '../src/principles/network-model.js';
const data=JSON.parse(await readFile(new URL('../src/data/principle-demo.json',import.meta.url),'utf8'));
const siteData=JSON.parse(await readFile(new URL('../src/data/datasets.json',import.meta.url),'utf8'));
const trainData=data.samples.filter(p=>p.split==='train'),testData=data.samples.filter(p=>p.split==='test');
const closeTo=(a,b)=>assert.ok(Math.abs(a-b)<1e-12,`${a} != ${b}`);
test('fixed data are balanced, uniquely identified, bounded and reproducible',()=>{
 assert.equal(new Set(data.samples.map(p=>p.id)).size,72);
 assert.ok(data.samples.every(p=>p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1));
 for(const rows of [trainData,testData])assert.equal(rows.filter(p=>p.label===0).length,rows.length/2);
 const h=train(trainData,data.config);assert.deepEqual(h,train(trainData,data.config));
 assert.equal(h.length,201);closeTo(h[0].loss,Math.log(2));assert.ok(h.at(-1).loss<h[0].loss);
 for(const t of h)closeTo(t.loss,loss(t,trainData));
 assert.ok(h.every((t,i)=>!i||t.loss<=h[i-1].loss));
 assert.ok(Number.isFinite(loss({w1:1e5,w2:-1e5,b:1e5},trainData)));
});
test('historical inspection, evaluation and inference never change the training head',()=>{
 const app=createPrincipleState(data);for(let i=0;i<12;i++)app.step();
 const original=JSON.stringify(app.state.trainingHistory),head=app.state.modelSnapshot;
 app.inspect(4);assert.equal(app.observed().epoch,4);correctCount(app.observed(),testData);
 app.customInput(.99,.01);predict(app.state.inferenceSnapshot,app.state.inferenceInput);
 assert.equal(JSON.stringify(app.state.trainingHistory),original);assert.equal(app.state.modelSnapshot,head);
 app.step();assert.equal(app.observed().epoch,13);assert.equal(app.state.trainingHistory.length,14);
});
test('frozen inference requires an explicit commit and resets have distinct scope',()=>{
 const app=createPrincipleState(data),frozen=app.state.inferenceSnapshot,original=JSON.stringify(data.samples);
 assert.equal(frozen.epoch,200);assert.equal(app.state.inferenceSyncStatus,'ready');
 app.step();assert.equal(app.state.inferenceSnapshot,frozen);assert.equal(app.state.inferenceSyncStatus,'needs-sync');
 app.customInput(.1,.9);assert.equal(app.state.inferenceSyncStatus,'needs-sync');
 app.inspect(0);app.commit();assert.equal(app.state.inferenceSnapshot.epoch,1);assert.equal(app.state.inspectedEpoch,null);
 app.step();assert.equal(app.state.inferenceSnapshot.epoch,1);assert.equal(app.state.inferenceSyncStatus,'needs-sync');
 app.resetTraining();assert.equal(app.state.trainingHistory.length,1);assert.equal(app.state.inferenceSyncStatus,'needs-sync');
 app.resetDemo();assert.equal(app.state.inferenceSnapshot.epoch,200);assert.equal(app.state.inferenceSyncStatus,'ready');
 assert.equal(JSON.stringify(data.samples),original);
 for(let i=0;i<202;i++)app.step();assert.equal(app.state.trainingHistory.length,201);
});
test('contributions, sigmoid and loss slices agree with actual model calculations',()=>{
 const h=train(trainData,data.config),theta=h.at(-1);
 for(const input of [...testData,{x:0,y:0},{x:1,y:1}]){const r=predict(theta,input);closeTo(r.contributions.reduce((a,b)=>a+b,0),r.z);closeTo(r.scoreA+r.scoreB,1);closeTo(r.scoreB,1/(1+Math.exp(-r.z)));assert.equal(r.prediction,r.scoreB>=.5?1:0);}
 const rows=lossSlice(h[4],h[5],trainData);assert.equal(rows.length,61);closeTo(rows[0].s,-.5);closeTo(rows.at(-1).s,2);
 closeTo(rows.find(p=>Math.abs(p.s)<1e-10).loss,h[4].loss);closeTo(rows.find(p=>Math.abs(p.s-1)<1e-10).loss,h[5].loss);
 const flat=lossSlice(theta,theta,trainData);assert.ok(flat.every(p=>p.loss===flat[0].loss));
 assert.deepEqual(oneHot(2,6),[0,0,1,0,0,0]);
});
test('precise boundaries handle zero weights, vertical lines and absent isolines',()=>{
 assert.equal(boundary({w1:0,w2:0,b:0}),null);
 assert.deepEqual(boundary({w1:2,w2:0,b:-1}),[{x:.5,y:0},{x:.5,y:1}]);
 assert.equal(boundary({w1:1,w2:0,b:2}),null);
 const theta=train(trainData,data.config).at(-1);
 for(const q of [.2,.5,.8])for(const p of boundary(theta,q)||[])closeTo(predict(theta,p).scoreB,q);
});
function setup(page='mechanism',suffix=''){
 return readFile(new URL(`../${page}.html`,import.meta.url),'utf8').then(html=>{
  const dom=new JSDOM(html,{url:`http://localhost/${page}.html${suffix}`,pretendToBeVisual:true}),doc=dom.window.document;
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
  dom.window.scrollTo=()=>{};dom.window.HTMLElement.prototype.scrollIntoView=function(){};
  initApp(doc,siteData);const app=initAI(doc,data);
  const click=s=>{const n=doc.querySelector(s);assert.ok(n,'Missing '+s);n.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));};
  const input=(s,v,type='input')=>{const n=doc.querySelector(s);n.value=v;n.dispatchEvent(new dom.window.Event(type,{bubbles:true}));};
  return {dom,doc,app,click,input};
 });
}
test('network backpropagation agrees with finite differences and training reduces error',()=>{
 const model=initialNetwork(),gradient=networkGradient(model),paths=[...model.weights.flatMap((r,j)=>r.map((_,i)=>['weights',j,i])),...model.biases.map((_,j)=>['biases',j]),...model.outputWeights.map((_,j)=>['outputWeights',j]),['outputBias']];
 const get=(obj,path)=>path.reduce((v,k)=>v[k],obj);
 const change=(obj,path,delta)=>{const parent=path.slice(0,-1).reduce((v,k)=>v[k],obj);parent[path.at(-1)]+=delta;};
 for(const path of paths){const plus=structuredClone(model),minus=structuredClone(model),epsilon=1e-5;change(plus,path,epsilon);change(minus,path,-epsilon);const numerical=(networkMetrics(plus).loss-networkMetrics(minus).loss)/(2*epsilon);assert.ok(Math.abs(numerical-get(gradient,path))<1e-9,`Gradient ${path}`);}
 const history=networkHistory();assert.equal(history.at(-1).epoch,350);assert.ok(history.every((r,i)=>!i||r.error<history[i-1].error));assert.ok(history.at(-1).error<.02);
 assert.deepEqual(model,initialNetwork());
});
test('mechanism offers manual learning and inference steps with no automatic advancement',async()=>{
 const t=await setup();
 assert.match(t.doc.querySelector('#training-visual').textContent,/向前计算.*比较结果.*向后反馈.*更新权重/s);
 assert.match(t.doc.querySelector('#inference-visual').textContent,/接收新输入.*隐藏层计算.*形成输出.*连接权重始终固定/s);
 assert.equal(t.doc.querySelectorAll('[data-nn-toggle]').length,0);
 assert.equal(t.doc.querySelectorAll('#training-visual input,#training-visual select,#inference-visual input,#inference-visual select').length,0);
 const training=t.doc.querySelector('#training-visual').innerHTML,inference=t.doc.querySelector('#inference-visual').innerHTML;
 t.click('[data-representation="text"]');t.click('[data-token="4"]');t.click('#reset-demo');
 assert.equal(t.app.state.representationMode,'image');assert.deepEqual(t.app.state.selectedPixel,{x:7,y:7});
 await new Promise(resolve=>setTimeout(resolve,3000));
 assert.equal(t.doc.querySelector('#training-visual').innerHTML,training);assert.equal(t.doc.querySelector('#inference-visual').innerHTML,inference);
 t.dom.window.close();
});
test('manual steps update weights only at the update stage and allow accurate backward inspection',async()=>{
 const t=await setup(),root=t.doc.querySelector('#training-visual'),wire=()=>root.querySelector('[data-edge="0,0"]').dataset.weight,original=wire();
 assert.ok(root.querySelector('[data-nn-prev]').disabled);
 t.click('[data-nn-next="training"]');assert.equal(t.app.networks.state.training.phase,1);assert.equal(wire(),original);
 t.click('[data-nn-next="training"]');assert.equal(t.app.networks.state.training.phase,2);assert.equal(wire(),original);assert.match(root.querySelector('.nn-signal').getAttribute('marker-start'),/backward-arrow/);
 t.click('[data-nn-next="training"]');assert.equal(t.app.networks.state.training.phase,3);assert.notEqual(wire(),original);assert.equal(root.querySelector('.nn-error>strong').textContent,t.app.networks.history[1].error.toFixed(3));
 const updated=wire();t.click('[data-nn-prev="training"]');assert.equal(wire(),original);t.click('[data-nn-next="training"]');assert.equal(wire(),updated);
 t.click('[data-nn-next="training"]');assert.equal(t.app.networks.state.training.round,1);assert.equal(wire(),updated);
 t.click('[data-nn-phase="training"][data-phase-index="1"]');assert.equal(t.app.networks.state.training.phase,1);assert.equal(t.app.networks.state.training.round,1);
 t.app.networks.goTo('training',39);assert.ok(root.querySelector('[data-nn-next]').disabled);assert.equal(root.querySelector('.nn-error>strong').textContent,t.app.networks.history.at(-1).error.toFixed(3));
 t.click('[data-nn-reset="training"]');assert.equal(wire(),original);assert.equal(t.app.networks.state.training.step,0);
 t.dom.window.close();
});
test('manual inference reveals computed signals and never alters trained weights',async()=>{
 const t=await setup(),root=t.doc.querySelector('#inference-visual'),weights=()=>[...root.querySelectorAll('.nn-wire')].map(n=>n.dataset.weight),fixed=weights(),originalModel=JSON.stringify(t.app.networks.finalModel);
 assert.equal(root.querySelector('.nn-result>strong').textContent,'—');t.click('[data-nn-next="inference"]');
 assert.equal(root.querySelector('[data-neuron="output,0"] .nn-value').textContent,'·');t.click('[data-nn-next="inference"]');
 assert.equal(root.querySelector('.nn-result>strong').textContent,forwardNetwork(t.app.networks.finalModel,newInputs[0]).output.toFixed(2));
 for(let step=0;step<12;step++){t.app.networks.goTo('inference',step);assert.deepEqual(weights(),fixed);}
 assert.equal(JSON.stringify(t.app.networks.finalModel),originalModel);assert.ok(root.querySelector('[data-nn-next]').disabled);
 t.click('[data-nn-reset="inference"]');assert.equal(t.app.networks.state.inference.inputIndex,0);assert.deepEqual(weights(),fixed);
 t.dom.window.close();
});
test('distinct growth graphics preserve exact compute capacity and proportional data areas',async()=>{
 const t=await setup(),compute=[...t.doc.querySelectorAll('.capacity-grid')],tokens=[...t.doc.querySelectorAll('.data-bubble')];
 assert.equal(compute.length,3);assert.equal(tokens.length,3);
 compute.forEach((grid,i)=>{const amount=[...grid.querySelectorAll('b')].reduce((sum,n)=>sum+parseFloat(n.style.width)/100*10,0);assert.ok(Math.abs(amount-computeGenerations[i].tflops)<1e-9);});
 tokens.forEach((bubble,i)=>assert.ok(Math.abs((parseFloat(bubble.style.getPropertyValue('--diameter'))/100)**2*15-trainingDataScale[i].trillionTokens)<1e-9));
 assert.equal(computeGenerations.at(-1).tflops,989.5);assert.ok(trainingDataScale.at(-1).lowerBound);
 assert.match(t.doc.querySelector('#compute-visual figure').getAttribute('aria-label'),/稠密FP16.*每格表示10 TFLOPS/);
 assert.match(t.doc.querySelector('#data-growth-visual').textContent,/超过 15 万亿/);
 assert.equal(t.doc.querySelectorAll('#compute-visual .ai-note,#data-growth-visual .ai-note,#compute-visual details,#data-growth-visual details,#compute-visual a,#data-growth-visual a,#compute-visual .mechanism-takeaway,#data-growth-visual .mechanism-takeaway').length,0);
 assert.equal(t.doc.querySelectorAll('#ai-representation > .ai-stage').length,2);
 t.dom.window.close();
});
test('representation selections match the image matrix and repeated token identity',async()=>{
 const t=await setup();t.click('[data-pixel="8,8"]');assert.equal(t.app.state.selectedPixel.x,8);assert.match(t.doc.querySelector('.pixel-readout').textContent,new RegExp(String(data.representation.pixels[8][8])));
 t.click('#expand-pixels');assert.equal(t.doc.querySelectorAll('[id^="grid-pixel-"]').length,256);
 t.click('[data-representation="text"]');t.click('[data-token="4"]');assert.equal(t.doc.querySelector('.one-hot .selected strong').textContent,'1');assert.match(t.doc.querySelector('.one-hot').textContent,/0/);
 const before=t.doc.querySelector('.one-hot').innerHTML;t.click('[data-token="0"]');assert.equal(t.doc.querySelector('.one-hot').innerHTML,before);
 t.dom.window.close();
});
test('all AI focus views preserve selection, return the live stage and restore focus',async()=>{
 for(const page of ['understand','mechanism']){
  const t=await setup(page);
  for(const button of [...t.doc.querySelectorAll('[data-focus]')]){const id=button.dataset.focus,state=JSON.stringify(t.app.state);button.click();assert.ok(t.doc.querySelector('.ai-focus-dialog').open);assert.ok(t.doc.querySelector(`.ai-focus-content #${id}-visual`));t.click('[data-close-focus]');assert.equal(JSON.stringify(t.app.state),state);assert.ok(t.doc.querySelector(`#ai-${id} #${id}-visual`));assert.equal(t.doc.activeElement.dataset.focus,id);}
  t.dom.window.close();
 }
});
test('all concept and event identifiers resolve and legacy URLs route to current chapters',async()=>{
 assert.equal(concepts.length,22);assert.equal(events.length,9);assert.equal(tasks.length,4);
 for(const c of concepts){for(const r of c.relations)assert.ok(concepts.some(v=>v.id===r.to));for(const id of c.relatedEventIds)assert.ok(events.some(v=>v.id===id));for(const id of c.relatedTaskIds)assert.ok(tasks.some(v=>v.id===id));}
 for(const [page,legacy,target] of [['understand','factors','concepts'],['understand','criteria','tasks'],['understand','capability','history'],['mechanism','division','representation'],['mechanism','bottleneck','representation'],['mechanism','flow','representation'],['mechanism','compute','compute'],['mechanism','origins','origins']]){
  const t=await setup(page,'?view='+legacy);await new Promise(resolve=>t.dom.window.requestAnimationFrame(resolve));assert.equal(t.dom.window.location.hash,'#ai-'+target);t.dom.window.close();
 }
 const t=await setup('understand');const positions=[...t.doc.querySelectorAll('.cloud-word')].map(n=>n.getAttribute('style'));t.click('[data-concept="deep"]');assert.deepEqual([...t.doc.querySelectorAll('.cloud-word')].map(n=>n.getAttribute('style')),positions);assert.match(t.doc.querySelector('.local-relations').textContent,/属于.*机器学习/);t.dom.window.close();
});

test('milestones update the same chart and route filtering selects a matching event',async()=>{
 const t=await setup('understand');
 assert.equal(t.doc.querySelectorAll('#history-visual svg').length,1);
 assert.equal(t.doc.querySelectorAll('.timeline-node').length,events.length);
 for(const e of events){
  t.click(`[data-event="${e.id}"]`);
  assert.equal(t.doc.querySelector('.milestone-chart .milestone-insight').dataset.selectedEvent,e.id);
  assert.match(t.doc.querySelector('.milestone-date').textContent,new RegExp(String(e.year)));
 }
 t.click('[data-method="知识与搜索"]');assert.equal(t.app.state.selectedEventId,'r1');
 t.click('#event-next');assert.equal(t.app.state.selectedEventId,'deepblue');assert.ok(t.doc.querySelector('#event-next').disabled);
 t.click('[data-event="chatgpt"]');assert.equal(t.app.state.highlightedMethod,'');
 assert.equal(t.doc.querySelectorAll('#history-visual svg').length,1);t.dom.window.close();
});

test('task mind map keeps all branches visible and updates explanations by mouse or keyboard',async()=>{
 const t=await setup('understand');
 for(const task of tasks){
  const branch=t.doc.querySelector(`.task-map-branch[data-task="${task.id}"]`);
  branch.dispatchEvent(new t.dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
  assert.equal(t.app.state.selectedTaskId,task.id);
  assert.equal(t.doc.querySelectorAll('.task-map-branch').length,4);
  assert.equal(t.doc.querySelector('.task-map-insight strong').textContent,task.name);
  assert.equal(t.doc.querySelectorAll('.task-map-branch[aria-pressed="true"]').length,1);
 }
 t.dom.window.close();
});
