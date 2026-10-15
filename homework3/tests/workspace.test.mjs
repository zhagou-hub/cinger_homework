import test from 'node:test';
import assert from 'node:assert/strict';
import {DatasetWorkspace,initialConfig} from '../dist/workspace.js';
test('datasets with identical names keep separate values, filters, history and chart settings',()=>{
 const w=new DatasetWorkspace(),a={dataset:'same.csv',rows:[{v:1}],original:[{v:1}],filters:[{key:'v',op:'gt',value:0}],history:['first'],undo:[],chartX:'v',chartType:'hist'};
 const aId=w.add(a),bId=w.add({...a,rows:[{v:20}],filters:[],history:[],chartType:'bar'});
 assert.notEqual(aId,bId);a.rows[0].v=99;
 assert.equal(w.get(aId).rows[0].v,1);const next=w.get(aId);next.rows[0].v=3;next.history.push('edit');w.save(aId,next);
 assert.equal(w.get(bId).rows[0].v,20);assert.deepEqual(w.get(bId).history,[]);assert.equal(w.get(aId).chartType,'hist');assert.equal(w.get(bId).chartType,'bar');
 const snapshot=w.get(aId);snapshot.filters.length=0;assert.equal(w.get(aId).filters.length,1);
 assert.deepEqual(w.list().map(d=>d.name),['same.csv','same.csv']);assert.throws(()=>w.get('missing'),/DATASET/);
});
test('schema-based defaults work for unrelated numeric, text-only and dated datasets',()=>{
 const numeric=initialConfig([{id:1,category:'a',height:10,weight:20},{id:2,category:'b',height:15,weight:30}]);
 assert.equal(numeric.chartType,'scatter');assert.equal(numeric.chartX,'height');assert.equal(numeric.chartY,'weight');assert.equal(numeric.chartColor,'category');
 const text=initialConfig([{name:'a',city:'X'},{name:'b',city:'X'}]);assert.equal(text.chartType,'bar');assert.equal(text.chartAgg,'count');assert.equal(text.groupSpec.fn,'count');
 const time=initialConfig([{day:'2026-01-01',amount:3},{day:'2026-01-02',amount:9}]);assert.equal(time.chartType,'line');assert.equal(time.chartX,'day');assert.equal(time.chartY,'amount');
 const mixed=initialConfig([{name:'a',value:null},{name:'b',value:3}]);assert.equal(mixed.chartType,'bar');assert.equal(mixed.chartY,'value');
});
