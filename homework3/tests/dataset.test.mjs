import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {penguins,RAW_CSV} from '../dist/data/penguins.js';
import * as E from '../dist/engine.js';
test('bundled real dataset retains exact upstream CSV and documented missing markers',()=>{
 const raw=readFileSync(new URL('../dist/data/penguins.csv',import.meta.url));
 assert.equal(createHash('sha256').update(raw).digest('hex'),'f204db2c753b0937caac3cb35258562c14f073e4bbc76be24b4c51ce22767a93');
 assert.equal(RAW_CSV,raw.toString());
 const rows=penguins();assert.equal(rows.length,344);assert.equal(E.columns(rows).length,8);
 assert.equal(E.profile(rows).reduce((n,c)=>n+c.missing,0),19);
 assert.equal(E.dedupe(rows).length,344);
 assert.deepEqual(Object.fromEntries(E.groupBy(rows,'species','year','count').map(g=>[g.key,g.value])),{Adelie:152,Gentoo:124,Chinstrap:68});
 assert.deepEqual([...new Set(rows.map(r=>r.year))],[2007,2008,2009]);
 assert.equal(E.parseCSV('code\nNA')[0].code,'NA'); // Import behavior is not globally changed.
});
test('real measurements retain known range and paired-observation count',()=>{
 const rows=penguins(),s=E.describe(rows.map(r=>r.body_mass_g));
 assert.equal(s.count,342);assert.equal(s.min,2700);assert.equal(s.max,6300);
 assert.ok(Math.abs(E.correlation(rows,'flipper_length_mm','body_mass_g')-0.871201767306011)<1e-12);
 const changed=penguins();changed[0].body_mass_g=0;assert.equal(penguins()[0].body_mass_g,3750);
});
