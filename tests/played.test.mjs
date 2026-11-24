import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAYED_KEY, readPlayed, markPlayed, clearPlayed, pickSurprise } from '../lib/played.ts';
const memory=()=>{const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),m};};
const blocked={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');},removeItem(){throw new Error('blocked');}};
test('played key is separate from the round key',()=>{assert.notEqual(PLAYED_KEY,'jeeb-ten-round-v3');});
test('mark persists, dedupes, and reads back',()=>{
  const s=memory();assert.deepEqual(readPlayed(s),[]);markPlayed(3,s);markPlayed(7,s);markPlayed(3,s);
  assert.deepEqual(readPlayed(s),[3,7]);assert.equal(s.m.has('jeeb-ten-round-v3'),false);
});
test('corrupt stored value is ignored',()=>{const s=memory();s.setItem(PLAYED_KEY,'{oops');assert.deepEqual(readPlayed(s),[]);s.setItem(PLAYED_KEY,'{"a":1}');assert.deepEqual(readPlayed(s),[]);});
test('clear removes only the played history',()=>{const s=memory();s.setItem('jeeb-ten-round-v3','keep');markPlayed(1,s);clearPlayed(s);assert.deepEqual(readPlayed(s),[]);assert.equal(s.getItem('jeeb-ten-round-v3'),'keep');});
test('blocked storage never throws',()=>{assert.deepEqual(readPlayed(blocked),[]);assert.deepEqual(markPlayed(1,blocked),[]);clearPlayed(blocked);assert.deepEqual(readPlayed(null),[]);});
test('surprise never returns a played category while an unplayed one exists',()=>{
  const pool=[1,2,3,4].map(id=>({id}));
  for(let i=0;i<200;i++){const r=pickSurprise(pool,[1,2,4]);assert.equal(r.pick.id,3);assert.equal(r.exhausted,false);}
  for(const rnd of [()=>0,()=>0.999,Math.random]){assert.equal(pickSurprise(pool,[2],rnd).pick.id!==2,true);}
});
test('surprise falls back to the whole pool with exhausted flag',()=>{
  const pool=[{id:1},{id:2}];const r=pickSurprise(pool,[1,2,9]);assert.ok(r.exhausted);assert.ok(pool.includes(r.pick));
  assert.deepEqual(pickSurprise([],[1]),{pick:null,exhausted:false});
});
