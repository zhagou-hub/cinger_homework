import test from 'node:test';
import assert from 'node:assert/strict';
import {fieldDetails} from '../dist/field-details.js';

test('changing fields changes displayed values and missing counts while retaining source row identities',()=>{
 const rows=[{bill:39.1,mass:3750},{bill:null,mass:3800},{bill:40.3,mass:null}];
 const bill=fieldDetails(rows,'bill'),mass=fieldDetails(rows,'mass');
 assert.deepEqual(bill.records.map(r=>r.value),[39.1,null,40.3]);
 assert.deepEqual(mass.records.map(r=>r.value),[3750,3800,null]);
 assert.equal(bill.missing,1);assert.equal(mass.missing,1);
 assert.equal(bill.records[0].row,rows[0]);assert.equal(mass.records[0].index,0);
 assert.equal(bill.stats.mean,39.7);assert.equal(mass.stats.mean,3775);
});

test('field ordering and pagination never discard rows and keep missing positions traceable',()=>{
 const rows=[{x:3},{x:null},{x:1},{x:2},{x:null}];
 const sorted=fieldDetails(rows,'x',{order:'desc',pageSize:3});
 assert.deepEqual(sorted.records.map(r=>r.index),[0,3,2]);
 assert.deepEqual(fieldDetails(rows,'x',{order:'desc',pageSize:3,page:9}).records.map(r=>r.index),[1,4]);
 const missingFirst=fieldDetails(rows,'x',{order:'missingFirst'});
 assert.deepEqual(missingFirst.records.map(r=>r.index),[1,4,0,2,3]);
 assert.equal(missingFirst.total,5);assert.deepEqual(rows.map(r=>r.x),[3,null,1,2,null]);
});
