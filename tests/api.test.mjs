import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const catalog=JSON.parse(fs.readFileSync(new URL('../data/catalog.json',import.meta.url),'utf8'));
async function call(action,body,token){
  const res=await fetch(`${base}/api/game`,{method:'POST',headers:{'Content-Type':'application/json',...(token?{'x-player-token':token}:{})},body:JSON.stringify({action,requestId:crypto.randomUUID(),...body})});
  return {status:res.status,data:await res.json()};
}
async function get(id,token){const res=await fetch(`${base}/api/game?id=${id}`,{headers:token?{'x-player-token':token}:{}});return{status:res.status,data:await res.json()};}
const lists=await(await fetch(`${base}/api/catalog`)).json();
assert.equal(lists.length,100);assert.ok(lists.every(c=>!('answers'in c)&&!('distractors'in c)));
let {data:solo,status}=await call('create',{categoryId:47,mode:'solo',names:['اختبار الفردي']});assert.equal(status,201);
assert.equal((await get(solo.game.id)).status,403);assert.ok(solo.game.slots.every(s=>s.name===null));assert.equal(solo.game.results,null);
let attempt=await call('guess',{id:solo.game.id,guess:'India',requestId:'repeat-test'},solo.token);assert.equal(attempt.data.game.foundCount,1);
let repeated=await call('guess',{id:solo.game.id,guess:'zzzzzz',requestId:'repeat-test'},solo.token);assert.equal(repeated.data.game.foundCount,1);assert.equal(repeated.data.game.players[0].errors,0);
for(let i=0;i<5;i++)attempt=await call('guess',{id:solo.game.id,guess:`zzzzzzz${i}`},solo.token);
assert.equal(attempt.data.game.status,'finished');assert.equal(attempt.data.game.players[0].errors,5);assert.equal(attempt.data.game.slots.filter(s=>s.name).length,10);assert.equal(attempt.data.game.slots.filter(s=>!s.found).length,9);
console.log('PASS solo: hidden answers, correct rank, idempotency, fifth-error reveal');
const host=(await call('create',{categoryId:47,mode:'online',names:['الأول']})).data;
assert.equal(host.game.status,'waiting');
const guest=(await call('join',{id:host.game.id,name:'الثاني'})).data;
assert.equal(guest.game.status,'playing');assert.equal(guest.game.categoryId,host.game.categoryId);
assert.equal((await call('join',{id:host.game.id,name:'الثالث'})).status,400);
let current=guest.game;const tokens=[host.token,guest.token],c=catalog.find(c=>c.id===47);
const notTurn=1-current.current;
assert.equal((await call('guess',{id:host.game.id,guess:'India'},tokens[notTurn])).status,409);
const ownerRanks=[[],[]];
for(const rank of [9,1,10,2,8,3,7,4,6,5]){
  const owner=current.current;ownerRanks[owner].push(rank);
  const answer=c.answers.find(a=>a.rank===rank);
  const result=await call('guess',{id:host.game.id,guess:answer.nameEn},tokens[owner]);assert.equal(result.status,200);current=result.data.game;
  const observed=await get(host.game.id,tokens[1-owner]);assert.deepEqual(observed.data.slots,current.slots);
  if(rank!==5){assert.equal(current.results,null);assert.ok(!JSON.stringify(current).includes('score'));}
}
assert.equal(current.status,'finished');
for(let i=0;i<2;i++)assert.equal(current.results.totals[i].score,ownerRanks[i].reduce((s,v)=>s+v,0));
assert.equal(current.results.totals.reduce((s,p)=>s+p.score,0),55);
assert.equal(current.categoryId,47);
const reconnect=await get(host.game.id,host.token);assert.equal(reconnect.data.status,'finished');assert.deepEqual(reconnect.data.results,current.results);
console.log('PASS online: two sessions, shared list, turn enforcement, no live scores, rank scoring, reconnect');
