import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js';
test('CSV handles BOM, CRLF, quotes, embedded newlines, identifiers and missing values',()=>{
 const r=E.parseCSV('\uFEFFid,note,value\r\n001,"a,b",3\r\n002,"a ""quote""\nand newline",\r\n');
 assert.deepEqual(r,[{id:'001',note:'a,b',value:3},{id:'002',note:'a "quote"\nand newline',value:null}]);
});
test('CSV rejects malformed rows and duplicate headers',()=>{
 assert.throws(()=>E.parseCSV('x,x\n1,2'),/HEADERS/);
 assert.throws(()=>E.parseCSV('x,y\n1'),/CSV_WIDTH/);
 assert.throws(()=>E.parseCSV('x\n"oops'),/CSV_QUOTE/);
 assert.throws(()=>E.parseCSV('x,y\n'),/EMPTY/);
});
test('TSV parses independently of commas',()=>assert.deepEqual(E.parseCSV('x\ty\nA,B\t2','\t'),[{x:'A,B',y:2}]));
test('JSON unions heterogeneous keys and rejects nested cells',()=>{
 assert.deepEqual(E.validate([{a:1},{b:2}]),[{a:1,b:null},{a:null,b:2}]);
 assert.throws(()=>E.validate([{a:{x:1}}]),/JSON_NESTED/);
 assert.throws(()=>E.validate([null]),/JSON_ROWS/);
 assert.throws(()=>E.validate([]),/EMPTY/);
});
test('descriptive stats use sample std and linear quantiles; no invented empty means',()=>{
 const d=E.describe([1,2,3,4,null,'8']);assert.equal(d.mean,2.5);assert.equal(d.q1,1.75);assert.equal(d.median,2.5);assert.equal(d.q3,3.25);assert.ok(Math.abs(d.std-Math.sqrt(5/3))<1e-12);
 assert.equal(E.describe([]).mean,null);assert.equal(E.describe([1]).std,null);assert.equal(E.describe([]).sum,0);
});
test('AND filters and sorting preserve missing-last semantics in both directions',()=>{
 const r=[{x:4},{x:null},{x:2},{x:8}];assert.deepEqual(E.sortRows(r,'x','desc').map(x=>x.x),[8,4,2,null]);
 assert.deepEqual(E.filterRows(E.filterRows(r,'x','gt',2),'x','lt',8),[{x:4}]);
 assert.equal(E.filterRows(r,'x','missing','').length,1);
});
test('deduplication compares all selected values and fill leaves source immutable',()=>{
 const r=[{a:1,b:null},{a:1,b:null},{a:3,b:8}];assert.equal(E.dedupe(r).length,2);
 assert.equal(E.fillMissing(r,'b','mean')[0].b,8);assert.equal(r[0].b,null);
 assert.throws(()=>E.fillMissing([{a:null}],'a','median'),/NO_NUMERIC/);
});
test('groupby retains missing keys and counts only present metric cells',()=>{
 const r=[{k:'a',v:2},{k:'a',v:null},{k:null,v:3}];assert.deepEqual(E.groupBy(r,'k','v'),[{key:'a',value:2,count:2},{key:null,value:3,count:1}]);
 assert.equal(E.groupBy(r,'k','v','count')[0].value,1);
});
test('pivot preserves dimension types and computes missing cell aggregates correctly',()=>{
 const r=[{r:'East',c:'A',v:2},{r:'East',c:'A',v:4},{r:'West',c:'B',v:10}];
 const p=E.pivot(r,'r','c','v','mean');assert.deepEqual(p,{keys:['A','B'],rows:[{key:'East',values:[3,null]},{key:'West',values:[null,10]}]});
 assert.throws(()=>E.pivot(Array.from({length:81},(_,i)=>({r:'x',c:i,v:1})),'r','c','v','sum'),/LIMIT/);
});
test('calculated columns propagate missing values and reject duplicate names',()=>{
 const r=[{a:10,b:2},{a:null,b:2},{a:10,b:0}];assert.deepEqual(E.compute(r,'c','a','/','b').map(r=>r.c),[5,null,null]);
 assert.throws(()=>E.compute(r,'a','a','+','b'),/COLUMN_NAME/);
 assert.equal(E.compute(r,'p','a','*','',100)[0].p,1000);
});
test('Pearson pairwise deletion and constant columns',()=>{
 assert.equal(E.correlation([{a:1,b:2},{a:2,b:4},{a:3,b:null}],'a','b'),1);
 assert.equal(E.correlation([{a:1,b:2},{a:1,b:4}],'a','b'),null);
 assert.equal(E.correlation([{a:1,b:2},{a:2,b:1}],'a','b'),-1);
});
test('histogram contains every value including its maximum and constant series',()=>{
 const h=E.histogram([0,1,2,3,4,null].map(x=>({x})),'x',4);assert.equal(h.reduce((a,b)=>a+b.value,0),5);assert.equal(h.at(-1).value,2);
 assert.deepEqual(E.histogram([{x:5},{x:5}],'x').map(b=>b.value),[2]);
});
test('CSV export quotes safely and mitigates spreadsheet formula injection',()=>{
 const out=E.csv([{x:'=SUM(A1)',y:-3,z:'<script>'}]);assert.match(out,/'=SUM/);assert.match(out,/"-3"/);
 assert.equal(E.parseCSV(E.csv([{name:'a,b',v:2}]))[0].name,'a,b');
});
test('dangerous-looking keys are treated as data, not object prototype writes',()=>{
 const r=E.parseCSV('__proto__,constructor\nhello,2');assert.equal(Object.getPrototypeOf(r[0]),Object.prototype);assert.equal(r[0].__proto__,'hello');
});
