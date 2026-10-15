import test from 'node:test';
import assert from 'node:assert/strict';
import * as V from '../dist/visual-engine.js';
import * as E from '../dist/engine.js';

test('histogram bins partition values exactly, including the maximum and constants',()=>{
 const rows=[-3,-2,-1,0,1,2,3,null].map(x=>({x})),bins=V.binsFor([rows],'x',3),counts=V.countBins(rows,'x',bins);
 assert.equal(counts.reduce((s,b)=>s+b.value,0),7);
 for(const b of counts)assert.equal(V.selectRows(rows,[{key:'x',op:'range',value:[b.start,b.end],inclusive:b.inclusive}]).length,b.value);
 const same=[{x:7},{x:7}];assert.equal(V.countBins(same,'x',V.binsFor([same],'x'))[0].value,2);
 assert.deepEqual(V.binsFor([[{x:null}]],'x'),[]);
});
test('before and after comparisons use shared boundaries and preserve counts',()=>{
 const a=[{x:1},{x:null},{x:5}],b=E.fillMissing(a,'x','mean'),bins=V.binsFor([a,b],'x');
 assert.equal(V.countBins(a,'x',bins).reduce((n,b)=>n+b.value,0),2);
 assert.equal(V.countBins(b,'x',bins).reduce((n,b)=>n+b.value,0),3);
 assert.equal(a[1].x,null);
});
test('typed category selection, missing selection and composed brush ranges',()=>{
 const rows=[{a:1,b:10},{a:'1',b:20},{a:null,b:30},{a:2,b:40}];
 assert.deepEqual(V.selectRows(rows,[{key:'a',op:'exact',value:1}]),[rows[0]]);
 assert.deepEqual(V.selectRows(rows,[{key:'a',op:'exact',value:null}]),[rows[2]]);
 assert.deepEqual(V.selectRows(rows,[{key:'a',op:'range',value:[1,2],inclusive:true},{key:'b',op:'range',value:[20,40],inclusive:true}]),[rows[3]]);
});
test('boxplot marks potential outliers without deleting them',()=>{
 const rows=[1,2,3,4,100,null].map(x=>({x})),s=V.outliers(rows,'x');
 assert.deepEqual(V.selectRows(rows,[{key:'x',op:'outlier',value:[s.lower,s.upper]}]),[{x:100}]);
 assert.equal(rows.length,6);assert.equal(V.outliers([],'x').lower,null);
});
test('calendar aggregation respects Monday weeks and rejects invalid/missing dates',()=>{
 assert.equal(V.period('2025-01-01','week'),'2024-12-30');
 assert.equal(V.period('2025-01-06','week'),'2025-01-06');
 assert.equal(V.period(null),null);assert.equal(V.period('bad'),null);
 const rows=[{d:'2025-02-01',x:5},{d:'2025-01-01',x:2},{d:'2025-01-02',x:3},{d:null,x:9}];
 assert.deepEqual(V.timeGroups(rows,'d','x','sum','month'),[{key:'2025-01',value:5,count:2},{key:'2025-02',value:5,count:1}]);
 assert.equal(V.selectRows(rows,[{key:'d',op:'period',unit:'month',value:'2025-01'}]).length,2);
});
test('join reports source coverage and expansion while preserving unmatched left rows',()=>{
 const left=[{id:1,x:'L'},{id:2,x:'M'},{id:null,x:'N'}],right=[{key:1,x:'a'},{key:1,x:'b'},{key:null,x:'ignored'}];
 const r=V.join(left,right,'id','key');assert.equal(r.matched,1);assert.equal(r.unmatched,2);assert.equal(r.extra,1);assert.equal(r.rows.length,4);
 assert.deepEqual(r.rows[0],{id:1,x:'L',x_right:'a'});assert.equal(r.rows[3].x_right,null);
 assert.equal(V.join(left,right,'id','key','inner').rows.length,2);
 assert.equal(left[0].x,'L');
});
test('join keeps numeric/text keys distinct, avoids column collisions, and caps expansion',()=>{
 const r=V.join([{id:1,x:1,x_right:2}],[{id:'1',x:9},{id:1,x:8}],'id','id');
 assert.equal(r.rows[0].x_right_right,8);
 assert.throws(()=>V.join(Array.from({length:150},()=>({id:1})),Array.from({length:150},()=>({id:1,x:2})),'id','id'),/LIMIT/);
});
