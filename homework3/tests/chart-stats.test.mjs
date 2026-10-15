import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../dist/chart-stats.js';
import {createVisuals} from '../dist/extra-charts.js';

test('missing-map buckets cover every row exactly and conserve all missing counts',()=>{
 const rows=Array.from({length:103},(_,i)=>({x:i%4?i:null,y:i%5?'v':null})),{buckets}=C.missingTiles(rows,['x','y'],12);
 assert.ok(buckets.length<=12);assert.equal(buckets[0].start,0);assert.equal(buckets.at(-1).end,103);
 assert.equal(buckets.reduce((n,b)=>n+b.end-b.start,0),103);
 for(let i=1;i<buckets.length;i++)assert.equal(buckets[i-1].end,buckets[i].start);
 assert.equal(buckets.reduce((n,b)=>n+b.values[0],0),26);assert.equal(buckets.reduce((n,b)=>n+b.values[1],0),21);
});
test('grouped boxes use numeric observations, linear quantiles and observed whiskers',()=>{
 const rows=[1,2,3,4,100,null].map(x=>({g:'A',x}));const [s]=C.groupedBoxes(rows,'g','x');
 assert.equal(s.count,5);assert.equal(s.sourceCount,6);assert.equal(s.q1,2);assert.equal(s.median,3);assert.equal(s.q3,4);assert.equal(s.low,1);assert.equal(s.high,4);assert.deepEqual(s.outliers,[100]);
 const types=C.groupedBoxes([{g:1,x:3},{g:'1',x:9}],'g','x');assert.equal(types.length,2);
});
test('contingency counts are typed, include missing categories and report limited coverage',()=>{
 const rows=[{a:1,b:'X'},{a:'1',b:'X'},{a:1,b:'Y'},{a:null,b:'X'},{a:1,b:null}];
 const all=C.contingency(rows,'a','b');assert.equal(all.x.length,3);assert.equal(all.shown,5);assert.equal(all.cells.reduce((n,g)=>n+g.values.reduce((a,b)=>a+b,0),0),5);
 const limited=C.contingency(rows,'a','b',1,1);assert.equal(limited.total,5);assert.equal(limited.shown,1);assert.equal(limited.xTotal,3);
});
test('cleaning comparisons distinguish new columns from observed zero missing values',()=>{
 const result=C.missingComparison([{a:null},{a:2}],[{a:1,new:4},{a:2,new:8}],['a'],['a','new']);
 assert.deepEqual(result.find(d=>d.key==='a'),{key:'a',before:1,after:0});assert.equal(result.find(d=>d.key==='new').before,null);
});
test('drawing samples consist of original observations and preserve endpoints',()=>{
 const rows=Array.from({length:1000},(_,x)=>({x,y:2*x,year:2007,id:x})),sample=C.evenlySample(rows,300);
 assert.equal(sample.length,300);assert.equal(sample[0],rows[0]);assert.equal(sample.at(-1),rows.at(-1));assert.ok(sample.every(r=>rows.includes(r)));
 assert.deepEqual(C.numericFields(rows,Object.keys(rows[0])),['x','y']);
});
test('new SVG plots handle constant values, missing groups and empty selections without invalid coordinates',()=>{
 const rows=[{x:1,y:2,g:null,h:'A'},{x:1,y:2,g:'G',h:'B'},{x:null,y:2,g:'G',h:'A'}];
 const marks=[],v=createVisuals({t:(a)=>a,esc:s=>String(s??'').replace(/[<>"&]/g,''),label:k=>k,val:v=>v??'Missing',fmt:v=>v===null?'—':String(v),short:String,color:['#123456','#789abc'],mark:f=>{marks.push(f);return 'data-act="test"';},getRows:()=>rows});
 const html=[v.qualityMap(rows,['x','y']),v.qualityChange(rows,rows,['x','y'],['x','y']),v.groupBoxes(rows,'g','x'),v.stacked(rows,'g','h'),v.categoryHeatmap(rows,'g','h'),v.parallel(rows,rows,['x','y'],'g'),v.scatterMatrix(rows,['x','y'],'g'),v.scatterMatrix([],['x','y'],'g')].join('');
 assert.ok(!/NaN|Infinity|\[object Object\]/.test(html));assert.ok(marks.some(f=>f.filters?.length===2));assert.ok(html.includes('Missing'));assert.ok(!v.groupBoxes([],'g','x').includes('<svg'));
});
