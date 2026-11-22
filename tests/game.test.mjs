import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createGame, makeAttempt, publicGame, getResults, resolveAnswer, normalize, key } from '../lib/game.ts';
const catalog=JSON.parse(fs.readFileSync(new URL('../data/catalog.json',import.meta.url),'utf8'));
const category=id=>catalog.find(c=>c.id===id);

test('750 categories and 7500 ranked answers',()=>{
  assert.equal(catalog.length,750);assert.equal(new Set(catalog.map(c=>c.id)).size,750);
  for(const c of catalog){assert.equal(c.answers.length,10);assert.deepEqual(c.answers.map(a=>a.rank).sort((a,b)=>a-b),[1,2,3,4,5,6,7,8,9,10]);assert.ok(c.source.url.startsWith('https://'));assert.ok(c.source.asOf);}
});
test('Arabic normalization and numeric parts retain identity',()=>{
  assert.equal(normalize('إِيــطَالِيَا'),'ايطاليا');assert.equal(normalize('GTA V'),'gta 5');assert.equal(normalize('GTA ٥'),'gta 5');assert.notEqual(normalize('GTA 2'),normalize('GTA 3'));
});
test('correct answer reveals its real slot, no live score, repeat is free',()=>{
  const c=category(47),g=createGame('ABC123',c.id,'solo',['أنت']);
  makeAttempt(g,c,catalog,0,'USA');const rank=c.answers.find(a=>a.nameEn==='United States').rank;
  assert.equal(g.found[0].rank,rank);assert.equal(g.players[0].errors,0);
  const out=publicGame(g,c,0,1);assert.equal(out.results,null);assert.ok(!JSON.stringify(out).includes('score'));assert.equal(out.slots.filter(s=>s.name).length,1);
  makeAttempt(g,c,catalog,0,'أمريكا');assert.equal(g.notice.kind,'repeat');assert.equal(g.found.length,1);assert.equal(g.players[0].errors,0);
});
test('minor typo requires confirmation and rejection costs nothing',()=>{
  const c=category(1),g=createGame('ABC123',1,'solo',['أنت']);
  makeAttempt(g,c,catalog,0,'Breaking Badd');assert.equal(g.notice.kind,'suggest');assert.equal(g.found.length,0);assert.equal(g.players[0].errors,0);
  makeAttempt(g,c,catalog,0,'','cancel');assert.equal(g.players[0].errors,0);assert.equal(g.pending,null);
  makeAttempt(g,c,catalog,0,'Breaking Badd');makeAttempt(g,c,catalog,0,'','confirm');assert.equal(g.found.length,1);assert.equal(g.players[0].errors,0);
});
test('series requests a part free; a specified wrong part is not rewritten',()=>{
  const c=category(9),g=createGame('ABC123',9,'solo',['أنت']);
  makeAttempt(g,c,catalog,0,'GTA');assert.equal(g.notice.kind,'clarify');assert.equal(g.players[0].errors,0);assert.equal(g.found.length,0);
  makeAttempt(g,c,catalog,0,'5');assert.equal(g.notice.kind,'correct');assert.equal(g.found[0].rank,2);
  const m=resolveAnswer('GTA 6',c,catalog);assert.notEqual(m.kind,'suggest');
});
test('fifth mistake ends round, revealing missing answers with found=false',()=>{
  const c=category(47),g=createGame('ABC123',47,'solo',['أنت']);
  for(let i=0;i<4;i++){makeAttempt(g,c,catalog,0,`zzzzzz${i}`);assert.equal(g.status,'playing');}
  makeAttempt(g,c,catalog,0,'zzzzzz4');assert.equal(g.status,'finished');assert.equal(g.players[0].errors,5);
  const out=publicGame(g,c,0,5);assert.equal(out.slots.filter(s=>s.name).length,10);assert.ok(out.slots.every(s=>!s.found));assert.equal(out.results.won,false);
  makeAttempt(g,c,catalog,0,'India');assert.equal(g.players[0].errors,5);assert.equal(g.found.length,0);
});
test('all ten correct completes solo',()=>{
  const c=category(95),g=createGame('ABC123',95,'solo',['أنت']);
  for(const a of c.answers)makeAttempt(g,c,catalog,0,a.nameEn);
  assert.equal(g.found.length,10);assert.equal(g.status,'finished');assert.equal(g.players[0].errors,0);assert.equal(getResults(g).won,true);
});
test('teams rank9=9, rank1=1, hidden until end; alternation and free repeat',()=>{
  const c=category(47),g=createGame('ABC123',47,'teams',['أول','ثاني']);g.current=0;
  makeAttempt(g,c,catalog,0,c.answers.find(a=>a.rank===9).nameEn);assert.equal(g.current,1);
  makeAttempt(g,c,catalog,1,c.answers.find(a=>a.rank===1).nameEn);assert.equal(g.current,0);
  assert.equal(publicGame(g,c,0,2).results,null);
  makeAttempt(g,c,catalog,0,c.answers.find(a=>a.rank===9).nameEn);assert.equal(g.current,0);assert.equal(g.players[0].errors,0);
  g.status='finished';g.reason='complete';const result=getResults(g);assert.equal(result.totals[0].score,9);assert.equal(result.totals[1].score,1);assert.equal(result.winner,0);
});
test('out-of-list correction can suggest an actual nonanswer',()=>{
  const c=category(47),g=createGame('ABC123',47,'solo',['أنت']);
  makeAttempt(g,c,catalog,0,'Afghanistann');assert.equal(g.notice.kind,'suggest');assert.equal(g.players[0].errors,0);
  makeAttempt(g,c,catalog,0,'','confirm');assert.equal(g.notice.kind,'wrong');assert.equal(g.players[0].errors,1);
});
test('cuisine answers are not confused with country entities',()=>{
  const c=category(36),g=createGame('ABC123',36,'solo',['أنت']);makeAttempt(g,c,catalog,0,'Italy');assert.equal(g.notice.kind,'correct');assert.equal(g.found[0].rank,1);
});
test('every ranked English name is identifiable or genuinely ambiguous',()=>{
  const failed=[];
  for(const c of catalog)for(const a of c.answers){const m=resolveAnswer(a.nameEn,c,catalog);if(m.kind==='unknown'||m.kind==='suggest')failed.push(`${c.id}: ${a.nameEn} => ${m.kind}`);else if(m.kind==='exact'&&key(m.entity)!==key(a))failed.push(`${c.id}: mismatched ${a.nameEn}`);}
  assert.deepEqual(failed,[]);
});
test('all 7500 answers can be reached with an explicit accepted name',()=>{
  const failed=[];
  for(const c of catalog)for(const a of c.answers){
    const queries=[a.nameEn,a.nameAr,...a.aliases,`${a.series||a.nameEn} ${a.part||a.year||''}`,`${a.nameAr} ${a.part||a.year||''}`];
    const reachable=queries.some(q=>{const m=resolveAnswer(q,c,catalog);return m.kind==='exact'&&key(m.entity)===key(a);});
    if(!reachable)failed.push(`${c.id}: ${a.nameEn}`);
  }
  assert.deepEqual(failed,[]);
});

test('team members rotate after resolved turns; clarification and repeats are free',()=>{
  const c=category(9),g=createGame('ABC123',9,'teams',['الصقور','النجوم'],[['أحمد','علي','عمر'],['سارة','هدى']]);g.current=0;
  makeAttempt(g,c,catalog,0,'GTA');assert.equal(g.players[0].turns,0);assert.equal(g.current,0);
  makeAttempt(g,c,catalog,0,'5');assert.equal(g.found[0].member,'أحمد');assert.equal(g.players[0].turns,1);assert.equal(g.current,1);
  makeAttempt(g,c,catalog,1,'Minecraft');assert.equal(g.found[1].member,'سارة');assert.equal(g.current,0);
  let out=publicGame(g,c,0,2);assert.equal(out.players[0].activeMember,'علي');assert.equal(out.players[1].activeMember,'هدى');
  makeAttempt(g,c,catalog,0,'GTA 5');assert.equal(g.players[0].turns,1);assert.equal(g.current,0);
  makeAttempt(g,c,catalog,0,'zzzzzzzz');assert.equal(g.players[0].turns,2);assert.equal(g.players[0].errors,1);assert.equal(g.current,1);
  out=publicGame(g,c,0,3);assert.equal(out.players[0].activeMember,'عمر');assert.equal(out.results,null);
});
test('location clarification accepts a city reply without losing a guess',()=>{
  const c=category(195),target=c.answers.find(a=>a.series==='Disneyland'&&a.part==='Paris');assert.ok(target);
  const g=createGame('ABC123',195,'solo',[]);
  makeAttempt(g,c,catalog,0,'Disneyland');assert.equal(g.notice.kind,'clarify');assert.equal(g.players[0].errors,0);
  makeAttempt(g,c,catalog,0,'Paris');assert.equal(g.notice.kind,'correct');assert.equal(g.found[0].rank,target.rank);assert.equal(g.players[0].errors,0);
});

test('team turns have a 30 second limit: timeout counts a mistake, passes the turn and can end the round',()=>{
  const c=category(47),g=createGame('TIME01',c.id,'teams',['أ','ب'],[['س'],['ص']]);
  const first=g.current,realNow=Date.now;
  try{
    makeAttempt(g,c,catalog,first,'','timeout');
    assert.equal(g.players[first].errors,0,'too early: ignored');
    Date.now=()=>realNow()+31000;
    makeAttempt(g,c,catalog,1-first,'','timeout');
    assert.equal(g.players[1-first].errors,0,'only the active team can time out');
    makeAttempt(g,c,catalog,first,'','timeout');
    assert.equal(g.players[first].errors,1);assert.equal(g.current,1-first);assert.deepEqual(g.players[first].wrong,['انتهى الوقت']);
    const out=publicGame(g,c,0,1);assert.equal(out.timer.limit,30);
    Date.now=()=>realNow()+70000;
    g.players[1-first].errors=4;makeAttempt(g,c,catalog,1-first,'','timeout');
    assert.equal(g.status,'finished');assert.equal(g.reason,'mistakes');
  }finally{Date.now=realNow;}
  const solo=createGame('TIME02',c.id,'solo',['أنت']);assert.equal(publicGame(solo,c,0,0).timer,null);
});
