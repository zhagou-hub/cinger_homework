import test from 'node:test';
import assert from 'node:assert/strict';
import {auditDataset,categoryOverview,timeOverview} from '../dist/data-overview.js';
import {penguins} from '../dist/data/penguins.js';
import * as E from '../dist/engine.js';

test('real-data overview separates incomplete records from empty cells and conserves category/year counts',()=>{
 const rows=penguins(),a=auditDataset(rows);
 assert.equal(a.total,344);assert.equal(a.complete,333);assert.equal(a.missingRows.length,11);assert.equal(a.missingCells,19);assert.equal(a.duplicates.length,0);
 assert.equal(a.missingFields[0].key,'sex');assert.equal(a.missingFields[0].missing,11);
 const c=categoryOverview(rows,'species');assert.equal(c.all.reduce((n,g)=>n+g.count,0),344);assert.equal(c.all.find(g=>g.key==='Adelie').count,152);
 const time=timeOverview(rows,a.timeFields.find(f=>f.key==='year'));assert.equal(time.start,'2007');assert.equal(time.end,'2009');assert.equal(time.all.reduce((n,g)=>n+g.count,0),344);
 assert.deepEqual(rows,penguins());
});
test('quality audit preserves typed duplicates, excludes identifier/year outlier flags, and counts each affected row once',()=>{
 const rows=[{id:1,year:2000,x:1,c:'A'},{id:2,year:2001,x:1,c:'A'},{id:3,year:2002,x:1,c:'A'},{id:4,year:2003,x:1,c:'A'},{id:5,year:2020,x:100,c:'A'},{id:5,year:2020,x:100,c:'A'},{id:'5',year:2020,x:100,c:null}];
 const a=auditDataset(rows);assert.deepEqual(a.duplicates,[5]);assert.equal(a.complete,6);assert.equal(a.missingCells,1);assert.equal(a.constants[0].key,'c');assert.ok(a.ranges.every(r=>r.key!=='id'&&r.key!=='year'));
 const flagged=auditDataset([{a:1,b:1},{a:1,b:1},{a:1,b:1},{a:1,b:1},{a:100,b:100}]);assert.equal(flagged.outlierRows.length,1);assert.deepEqual(flagged.outlierRows[0].keys,['a','b']);assert.equal(flagged.outlierRows[0].index,4);
});
test('date coverage and truncated category overview retain missing rows and all denominators',()=>{
 const rows=Array.from({length:10},(_,i)=>({group:'g'+i,date:i===9?null:`202${i%3}-01-02`}));
 const c=categoryOverview(rows,'group');assert.equal(c.shown.length,6);assert.equal(c.rest,4);assert.equal(c.shown.reduce((n,g)=>n+g.count,0)+c.rest,10);
 const withMissing=categoryOverview([...rows,{group:null}],'group');assert.ok(withMissing.shown.some(g=>g.key===null));assert.equal(withMissing.shown.reduce((n,g)=>n+g.count,0)+withMissing.rest,11);
 const a=auditDataset(rows),time=timeOverview(rows,a.timeFields[0]);assert.equal(time.valid,9);assert.equal(time.missing,1);assert.equal(time.start,'2020-01-02');assert.equal(time.end,'2022-01-02');
 const numeric=categoryOverview([{x:1},{x:'1'},{x:null}],'x');assert.equal(numeric.all.length,3);
 const empty=auditDataset([],['a']);assert.equal(empty.complete,0);assert.equal(empty.missingCells,0);assert.equal(empty.outlierRows.length,0);
 const allMissing=auditDataset([{x:null},{x:null}]);assert.equal(allMissing.complete,0);assert.equal(allMissing.missingCells,2);
});
