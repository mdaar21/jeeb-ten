import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createGame,makeAttempt,resolveAnswer} from '../lib/game.ts';
import {SECTIONS,sectionFor} from '../lib/catalog-sections.ts';
const catalog=JSON.parse(fs.readFileSync(new URL('../data/catalog.json',import.meta.url),'utf8'));
const category=id=>catalog.find(c=>c.id===id);
function correct(id,queries){
  const c=category(id),g=createGame('aliases',id,'solo',[]);
  for(const query of queries){makeAttempt(g,c,catalog,0,query);assert.ok(['correct','repeat'].includes(g.notice.kind),`${id} ${query}: ${g.notice.kind}`);assert.equal(g.players[0].errors,0);}
  assert.equal(g.found.length,1);
}
test('Saudi short Arabic names and English aliases reveal the same ranked country',()=>{
  for(const id of [65,66])correct(id,['السعوديه','السعودية','سعودية','المملكة العربية السعودية','Saudi Arabia','Kingdom of Saudi Arabia','KSA','saudiarabia']);
});
test('Reddit transliterations, split words and English work in every relevant list',()=>{
  for(const id of [70,72,187])correct(id,['ريد ات','ريدت','ريديت','رديت','Reddit','REDDIT','Red dit']);
});
test('common Arabic words, English plurals and alternate spellings are accepted',()=>{
  correct(255,['Tomato','Tomatoes','طماط','بندورة']);
  correct(300,['Cat','Cats','قطة','قطه','بسه']);
  correct(212,['Computer mouse','Mouse','Mice','ماوس','فأرة']);
  correct(240,['Keyboard','Gaming keyboard','كيبورد','لوحة مفاتيح']);
  correct(370,['Mohamed Henedy','Mohamed Henedi','محمد هنيدي','هنيدي']);
});
test('a transposed typo asks for confirmation and does not consume the team turn',()=>{
  const c=category(187),g=createGame('typo',187,'teams',['أ','ب']);g.current=0;
  makeAttempt(g,c,catalog,0,'Reddti');assert.equal(g.notice.kind,'suggest');assert.equal(g.current,0);assert.equal(g.players[0].errors,0);
  makeAttempt(g,c,catalog,0,'','confirm');assert.equal(g.notice.kind,'correct');assert.equal(g.current,1);assert.equal(g.players[0].errors,0);
});
test('different editions and places are not silently merged by broad aliases',()=>{
  const c=category(9),g=createGame('parts',9,'solo',[]);
  makeAttempt(g,c,catalog,0,'GTA');assert.equal(g.notice.kind,'clarify');assert.equal(g.players[0].errors,0);
  makeAttempt(g,c,catalog,0,'2');assert.notEqual(g.notice.kind,'correct');assert.equal(g.players[0].errors,1);
  const cities=category(410);assert.notEqual(resolveAnswer('FC Barcelona',cities,catalog).kind==='exact'&&resolveAnswer('FC Barcelona',cities,catalog).entity.nameEn==='Barcelona',true);
});
test('all 7500 canonical Arabic names are recognized or clarified without a wrong guess',()=>{
  const failures=[];
  for(const c of catalog)for(const a of c.answers){const match=resolveAnswer(a.nameAr,c,catalog);if(!['exact','clarify'].includes(match.kind))failures.push(`${c.id}: ${a.nameAr} => ${match.kind}`);}
  assert.deepEqual(failures,[]);
});
test('750 unique categories keep all original IDs and group into ten usable sections',()=>{
  assert.deepEqual(catalog.map(c=>c.id),Array.from({length:750},(_,i)=>i+1));
  assert.equal(catalog.filter(c=>c.difficulty==='easy').length,650);
  for(const s of SECTIONS)assert.ok(catalog.some(c=>c.difficulty==='easy'&&sectionFor(c)===s.id),s.id);
  const sets=catalog.filter(c=>c.id>200).map(c=>c.answers.map(a=>a.nameEn.toLowerCase()).sort().join('|'));
  assert.equal(new Set(sets).size,550);
});
