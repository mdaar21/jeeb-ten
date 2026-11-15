import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.TEST_ORIGIN||'http://127.0.0.1:5174';
const catalog=JSON.parse(fs.readFileSync(new URL('../data/catalog.json',import.meta.url),'utf8'));
async function call(action,body,token){const res=await fetch(`${base}/api/game`,{method:'POST',headers:{'Content-Type':'application/json',...(token?{'x-player-token':token}:{})},body:JSON.stringify({action,requestId:crypto.randomUUID(),...body})});return{status:res.status,data:await res.json()};}
async function get(id,token){const res=await fetch(`${base}/api/game?id=${id}`,{headers:token?{'x-player-token':token}:{}});return{status:res.status,data:await res.json()};}
const lists=await(await fetch(`${base}/api/catalog`)).json();assert.equal(lists.length,200);assert.equal(lists.filter(c=>c.difficulty==='easy').length,100);assert.ok(lists.every(c=>!('answers'in c)&&!('distractors'in c)));
assert.equal((await call('create',{categoryId:47,mode:'online'})).status,400);
assert.equal((await call('join',{id:'ABC234',name:'اسم'})).status,400);
assert.equal((await call('create',{categoryId:47,mode:'teams',names:['أ','ب'],members:[[],['سارة']]})).status,400);
const solo=(await call('create',{categoryId:47,mode:'solo'})).data;assert.equal((await get(solo.game.id)).status,403);assert.ok(solo.game.slots.every(s=>s.name===null));
let attempt=await call('guess',{id:solo.game.id,guess:'India',requestId:'same-request'},solo.token);assert.equal(attempt.data.game.foundCount,1);
const duplicate=await call('guess',{id:solo.game.id,guess:'zzzzzz',requestId:'same-request'},solo.token);assert.equal(duplicate.data.game.players[0].errors,0);
for(let i=0;i<5;i++)attempt=await call('guess',{id:solo.game.id,guess:`zzzzzzz${i}`},solo.token);
assert.equal(attempt.data.game.status,'finished');assert.equal(attempt.data.game.players[0].errors,5);assert.equal(attempt.data.game.slots.filter(s=>s.name).length,10);
console.log('PASS solo: hidden answers, idempotency, fifth-error reveal; old online endpoints rejected');
const setup={categoryId:47,mode:'teams',names:['الصقور','النجوم'],members:[['أحمد','علي','عمر'],['سارة','هدى']]};
const match=(await call('create',setup)).data;let current=match.game;
assert.equal(current.mode,'teams');assert.deepEqual(current.players.map(p=>p.name),setup.names);assert.deepEqual(current.players.map(p=>p.members),setup.members);
const ranks=[[],[]],c=catalog.find(c=>c.id===47),turns=[0,0];
for(const rank of [9,1,10,2,8,3,7,4,6,5]){
  const owner=current.current;assert.equal(current.players[owner].activeMember,setup.members[owner][turns[owner]%setup.members[owner].length]);
  ranks[owner].push(rank);turns[owner]++;
  const res=await call('guess',{id:match.game.id,guess:c.answers.find(a=>a.rank===rank).nameEn},match.token);assert.equal(res.status,200);current=res.data.game;
  if(rank!==5){assert.equal(current.results,null);assert.ok(!JSON.stringify(current).includes('score'));}
}
assert.equal(current.status,'finished');assert.equal(current.categoryId,47);assert.equal(current.results.totals.reduce((s,p)=>s+p.score,0),55);
for(let i=0;i<2;i++)assert.equal(current.results.totals[i].score,ranks[i].reduce((s,v)=>s+v,0));
const restored=await get(match.game.id,match.token);assert.deepEqual(restored.data.results,current.results);assert.deepEqual(restored.data.players.map(p=>p.members),setup.members);
console.log('PASS same-device teams: names, unequal rosters, member rotation, shared list, hidden scores, rank weighting, restore');
