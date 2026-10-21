const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const D=require('./data.js');

test('CSV accepts BOM, CRLF, quoted commas, escaped quotes and missing values',()=>{
  const rows=D.parseCSV('\uFEFFname,value,date\r\n"A, B",2,2024-02-29\r\n"C""D",,2024-03-01\r\n');
  assert.equal(rows.length,2);assert.equal(rows[0].name,'A, B');assert.equal(rows[1].name,'C"D');assert.equal(rows[1].value,'');
  const data=D.importCSV('name,value,date\nA,2,2024-02-29\nB,,2024-03-01','demo.csv');
  assert.equal(data.rows[1].value,null);assert.equal(data.fields.find(f=>f.key==='date').type,'date');
  assert.equal(data.rows[0].__month,'2024-02');assert.equal(data.rows[0].__weekday,'周四');
});
test('CSV rejects ambiguous headers, malformed records and oversized samples',()=>{
  for(const csv of ['a,a\n1,2','a,b\n1','a,b\n"1,2','a,\n1,2','__id,a\n1,2','a\n'])assert.throws(()=>D.parseCSV(csv));
  assert.throws(()=>D.parseCSV('a\n'+Array(5001).fill('1').join('\n')));
});
test('dates use validated calendar days; identifiers remain categories',()=>{
  assert.equal(D.parseDate('2023-02-29'),null);assert.equal(D.parseDate('2024-02-30'),null);
  assert.equal(D.parseDate('2024-02-29'),Date.UTC(2024,1,29));
  assert.equal(D.inferFields([{id:'1',v:'3'},{id:'2',v:''}])[0].type,'category');
});
test('statistics exclude nulls, use linear quantiles and reject undefined correlation',()=>{
  const s=D.stats([1,2,3,4,null,NaN]);
  assert.equal(s.n,4);assert.equal(s.mean,2.5);assert.equal(s.median,2.5);assert.equal(s.q1,1.75);assert.equal(s.q3,3.25);
  assert.equal(D.stats([]).mean,null);
  assert.equal(D.relationship([{x:1,y:2},{x:2,y:4},{x:3,y:6}], 'x','y').r,1);
  assert.equal(D.relationship([{x:1,y:2},{x:1,y:4},{x:1,y:6}], 'x','y').r,null);
  const constantY=D.relationship([{x:1,y:2},{x:2,y:2},{x:3,y:2}], 'x','y');
  assert.equal(constantY.r,null);assert.equal(constantY.slope,0);assert.equal(constantY.intercept,2);
  assert.equal(D.relationship([{x:1,y:2},{x:2,y:null}], 'x','y').r,null);
});
test('group averages preserve missing values and counts preserve records',()=>{
  const rows=[{g:'A',v:null},{g:'A',v:4},{g:'B',v:null}];
  assert.deepEqual(D.aggregate(rows,{group:'g',metric:'v',aggregate:'mean'}).map(g=>[g.label,g.value]),[['A',4]]);
  assert.deepEqual(D.aggregate(rows,{group:'g',metric:'v',aggregate:'count'}).map(g=>[g.label,g.value]),[['A',2],['B',1]]);
});
test('all course datasets load with verified counts, leap day and normalization',async()=>{
  const prior=global.fetch;
  global.fetch=async file=>({ok:true,text:()=>fs.readFile(path.resolve(__dirname,file),'utf8')});
  try{
    const [students,weather,states]=await Promise.all(['students','weather','states'].map(D.loadBuiltin));
    assert.equal(students.rows.length,80);assert.equal(students.rows.filter(r=>r['年龄']===17).length,31);assert.equal(students.rows.filter(r=>r['年龄']===18).length,49);
    assert.equal(weather.rows.length,366);assert.equal(new Set(weather.rows.map(r=>r.date)).size,366);assert(weather.rows.some(r=>r.date===Date.UTC(2024,1,29)));
    assert.equal(states.rows.length,50);const ca=states.rows.find(r=>r.state==='California');assert.equal(ca.burglary_rate,ca.burglary/ca.population*100000);
    const r=D.relationship(states.rows,'population','burglary').r;assert(r>0.8);
  }finally{global.fetch=prior;}
});
