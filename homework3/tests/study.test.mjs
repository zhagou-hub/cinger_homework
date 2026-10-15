import test from 'node:test';
import assert from 'node:assert/strict';
import {buildStudy,reconcileStudy,studyExport} from '../dist/study-engine.js';
import {columns} from '../dist/engine.js';
import {penguins} from '../dist/data/penguins.js';

test('penguin investigation connects group differences, within-group correlations and stratified means',()=>{
 const rows=penguins(),s=buildStudy(rows,columns(rows),{},true);
 assert.deepEqual(s.config,{dimension:'species',metric:'body_mass_g',related:'flipper_length_mm',split:'sex',interval:'month'});
 assert.equal(s.total,344);assert.equal(s.stats.count,342);assert.equal(s.paired.length,342);
 assert.equal(s.top.key,'Gentoo');assert.equal(s.top.mean,5076.016260162602);
 assert.ok(s.correlation>.87&&s.correlation<.88);
 assert.ok(s.groups.every(g=>g.correlation<s.correlation));
 assert.equal(s.comparable.length,2);assert.equal(s.retainedLead,2);
 assert.equal(s.splitAll.find(x=>x.key===null).total,11);
 assert.equal(s.strata.reduce((n,g)=>n+g.cells.reduce((a,b)=>a+b.total,0),0),344);
 assert.equal(s.shown[0].records[0].row,rows[0]);
});
test('changing study fields recomputes every angle without modifying or filtering source records',()=>{
 const rows=penguins(),copy=structuredClone(rows),s=buildStudy(rows,columns(rows),{metric:'bill_length_mm',dimension:'island',related:'bill_depth_mm',split:'species'},true);
 assert.equal(s.total,344);assert.equal(s.shownRows,344);assert.equal(s.config.dimension,'island');
 assert.equal(s.stats.max,59.6);assert.equal(s.groups.length,3);assert.ok(s.splitLevels.some(c=>c.key==='Gentoo'));
 assert.deepEqual(rows,copy);
 const next=reconcileStudy(rows,columns(rows),{metric:'body_mass_g',dimension:'removed',related:'body_mass_g',split:''},true);
 assert.equal(next.dimension,'species');assert.notEqual(next.related,next.metric);assert.equal(next.split,'');
});
test('arbitrary imported numeric, categorical, constant and empty datasets have honest fallbacks',()=>{
 const rows=[{team:'A',score:0,effort:1},{team:'A',score:10,effort:1},{team:'B',score:null,effort:1}];
 const s=buildStudy(rows,columns(rows));assert.equal(s.config.metric,'score');assert.equal(s.stats.count,2);assert.equal(s.correlation,null);assert.equal(s.groups[1].mean,null);assert.equal(s.groups[1].count,0);
 const text=buildStudy([{city:'a',role:'x'},{city:'b',role:'y'}],['city','role']);assert.equal(text.config.metric,'');assert.equal(text.config.related,'');assert.equal(text.shownRows,2);
 const nums=buildStudy([{x:1,y:2},{x:2,y:4}],['x','y']);assert.equal(nums.config.dimension,'');assert.equal(nums.correlation,1);
 const empty=buildStudy([],[]);assert.equal(empty.total,0);assert.equal(empty.stats.count,0);
});
test('time comparisons retain missing-date coverage and category truncation keeps full denominators',()=>{
 const rows=[{date:'2024-01-01',value:2},{date:'2024-01-20',value:4},{date:'2024-03-01',value:8},{date:null,value:5}];
 const s=buildStudy(rows,columns(rows));assert.equal(s.time,true);assert.deepEqual(s.shown.map(g=>g.key),['2024-01','2024-03']);assert.equal(s.shown[0].mean,3);assert.equal(s.shownRows,3);assert.equal(s.total,4);
 const many=Array.from({length:20},(_,i)=>({group:'g'+i,metric:i,split:'s'+i%6}));
 const m=buildStudy(many,columns(many),{dimension:'group',metric:'metric',split:'split'});assert.equal(m.groups.length,20);assert.equal(m.shown.length,8);assert.equal(m.stats.count,20);assert.equal(m.splitAll.length,6);
 const exported=studyExport(m);assert.equal(exported.filter(r=>r.scope==='group').reduce((n,r)=>n+r.rows,0),20);assert.equal(exported.filter(r=>r.scope==='stratum').reduce((n,r)=>n+r.rows,0),20);
});
