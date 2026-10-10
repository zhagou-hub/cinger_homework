import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {applicationView,legacyApplicationView} from '../src/applications/routes.js';

test('old destinations still map to the current application sections',async()=>{
 for(const [page,view,target] of [['industries',null,'manufacturing'],['industries','agriculture','agriculture'],['industries','service','service'],['value',null,'service'],['value','efficiency','service'],['value','quality','service'],['value','innovation','science']])assert.equal(legacyApplicationView(page,view),target);
 assert.equal(applicationView('unknown'),'manufacturing');
 for(const page of ['industries','value']){
  const html=await readFile(new URL('../'+page+'.html',import.meta.url),'utf8');
  assert.ok(html.includes('data-app-fallback'));
  assert.ok(html.includes('applications-redirect.js'));
 }
});
