import test from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../dist/prepare-engine.js';
import {penguins} from '../dist/data/penguins.js';
import * as E from '../dist/engine.js';
test('missing preview reports real changes without modifying the working dataset',()=>{
 const rows=penguins(),cols=E.columns(rows),d=P.defaultPrepareDrafts(rows,cols),r=P.previewPrepare(rows,cols,'missing',d.missing);
 assert.equal(r.indices.length,2);assert.equal(r.changedCells,2);assert.equal(r.removedRows,0);assert.equal(r.noChange,false);
 assert.equal(E.profile(rows).reduce((n,c)=>n+c.missing,0),19);assert.equal(E.profile(r.after).reduce((n,c)=>n+c.missing,0),17);
 const drop=P.previewPrepare(rows,cols,'missing',{...d.missing,method:'drop'});assert.equal(drop.after.length,342);assert.equal(drop.removedRows,2);
 assert.throws(()=>P.previewPrepare(rows,cols,'missing',{...d.missing,method:'custom',value:''}),/VALUE/);
});
test('duplicates retain first occurrences and report exact removed positions, including shared references',()=>{
 const first={a:1},rows=[first,first,{a:'1'},{a:1}],r=P.previewPrepare(rows,['a'],'duplicates',{});
 assert.deepEqual(r.indices,[1,3]);assert.deepEqual(r.after,[first,{a:'1'}]);assert.equal(r.removedRows,2);assert.equal(rows.length,4);
 assert.equal(P.duplicateGroups(rows,['a']).groups[0].first,0);
 assert.equal(P.previewPrepare([{a:1},{a:2}],['a'],'duplicates',{}).noChange,true);
});
test('rename preview preserves order and values; type conversion counts actual changed cells',()=>{
 const rows=[{id:'001',value:'3'},{id:'002',value:'bad'},{id:'003',value:null}],cols=['id','value'];
 const r=P.previewPrepare(rows,cols,'rename',{column:'value',name:'measurement',type:'keep'});
 assert.deepEqual(r.afterCols,['id','measurement']);assert.equal(r.renamed,true);assert.equal(r.changedCells,0);assert.equal(r.after[0].measurement,'3');assert.equal(rows[0].value,'3');
 const convert=P.previewPrepare(rows,cols,'rename',{column:'value',name:'measurement',type:'number'});assert.equal(convert.changedCells,2);assert.deepEqual(convert.after.map(r=>r.measurement),[3,null,null]);
 assert.throws(()=>P.previewPrepare(rows,cols,'rename',{column:'value',name:'id',type:'keep'}),/COLUMN_NAME/);
});
test('calculated field preview handles division by zero, missing inputs and name collisions',()=>{
 const rows=[{a:6,b:2},{a:3,b:0},{a:null,b:2}],cols=['a','b'],d={a:'a',b:'b',op:'/',constant:'100',name:'ratio'},r=P.previewPrepare(rows,cols,'calculate',d);
 assert.deepEqual(r.after.map(r=>r.ratio),[3,null,null]);assert.equal(r.addedColumns,1);assert.equal(r.changedCells,1);assert.equal(Object.hasOwn(rows[0],'ratio'),false);
 assert.throws(()=>P.previewPrepare(rows,cols,'calculate',{...d,name:'a'}),/COLUMN_NAME/);
 const drafts=P.defaultPrepareDrafts(rows,cols);drafts.rename={column:'old',name:'b',type:'keep'};assert.equal(P.reconcilePrepareDrafts(rows,cols,drafts).rename.column,'b');
 assert.equal(P.defaultPrepareDrafts([{name:'A'}],['name']).missing.method,'drop');
});
