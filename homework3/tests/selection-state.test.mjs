import test from 'node:test';
import assert from 'node:assert/strict';
import * as V from '../dist/visual-engine.js';
import {penguins} from '../dist/data/penguins.js';

test('reported missing-value and numeric-range conflict filters to zero without losing source records',()=>{
 const rows=penguins(),missing=[{key:'bill_depth_mm',op:'missing'},{key:'bill_length_mm',op:'missing'},{key:'sex',op:'missing'}];
 assert.equal(V.selectRows(rows,missing).length,2);
 const selection=V.selectRows(rows,[...missing,{key:'flipper_length_mm',op:'range',value:[219.2,225.1],inclusive:false}]);
 assert.equal(selection.length,0);assert.equal(rows.length,344);
 assert.deepEqual(V.numericSelectionState(rows,selection,'bill_length_mm'),{reason:'no_matches',total:344,matched:0,totalValid:342,valid:0,missing:0});
 assert.equal(V.numericSelectionState(rows,V.selectRows(rows,[]),'bill_length_mm').valid,342);
});
test('empty matches, missing values in the selection and a source without numbers are distinct states',()=>{
 const rows=penguins(),missing=V.selectRows(rows,[{key:'bill_length_mm',op:'missing'}]);
 const state=V.numericSelectionState(rows,missing,'bill_length_mm');assert.equal(state.reason,'no_numeric_selection');assert.equal(state.matched,2);assert.equal(state.missing,2);assert.equal(state.totalValid,342);
 assert.equal(V.numericSelectionState([],[],'x').reason,'empty_dataset');
 assert.equal(V.numericSelectionState([{x:null}],[{x:null}],'x').reason,'no_numeric_source');
 assert.equal(V.numericSelectionState(rows,rows,'bill_length_mm').reason,'ready');
});
test('visual filters toggle atomically and preserve unrelated conditions and typed categories',()=>{
 const base=[{key:'sex',op:'missing'}],pair={filters:[{key:'species',op:'exact',value:'Adelie'},{key:'island',op:'exact',value:'Dream'}]},next=V.toggleVisualFilters(base,pair);
 assert.equal(next.length,3);assert.deepEqual(V.toggleVisualFilters(next,pair),base);assert.equal(base.length,1);
 const range={key:'x',op:'range',value:[1,2],inclusive:true};assert.equal(V.toggleVisualFilters([range],range).length,0);
 assert.deepEqual(V.toggleVisualFilters([{key:'x',op:'exact',value:1}],{key:'x',op:'exact',value:'1'}),[{key:'x',op:'exact',value:'1'}]);
 const rows=penguins(),step1=V.toggleVisualFilters([],{key:'bill_length_mm',op:'missing'}),step2=V.toggleVisualFilters(step1,{key:'flipper_length_mm',op:'range',value:[219.2,225.1]});
 assert.equal(V.selectRows(rows,step2).length,0);assert.equal(V.selectRows(rows,step1).length,2);
});
