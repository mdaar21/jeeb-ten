import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createLocalGameService, ROUND_KEY } from '../lib/browser-game.ts';
const catalog=JSON.parse(fs.readFileSync(new URL('../data/catalog.json',import.meta.url),'utf8'));
function fixture(){const map=new Map();const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};return{map,storage,service:createLocalGameService(catalog,storage)};}
function start(service,mode='solo'){const result=service.request('create',{categoryId:101,mode,names:['فريق أ','فريق ب'],members:[['أحمد','سارة','علي'],['نورة','عمر']]});return{...result,conn:{id:result.game.id,token:result.token}};}

test('saved local round restores answers, teams and active member after a reload',()=>{
  const {service,storage}=fixture(),initial=start(service,'teams');
  const current=initial.game.current;
  const result=service.request('guess',{id:initial.game.id,guess:'Mario',requestId:'first'},initial.conn);
  assert.equal(result.game.foundCount,1);assert.equal(result.game.current,1-current);
  assert.equal(result.game.results,null);assert.ok(!JSON.stringify(result.game).includes('score'));
  assert.equal(result.game.players[current].activeMemberIndex,1);
  const restored=createLocalGameService(catalog,storage).readRound(initial.conn);
  assert.deepEqual(restored,result.game);assert.deepEqual(restored.players.map(p=>p.members.length),[3,2]);
  const retry=service.request('guess',{id:initial.game.id,guess:'Mario',requestId:'first'},initial.conn);
  assert.deepEqual(retry.game,result.game);
});

test('local solo ends on the fifth wrong guess and restores every missed answer',()=>{
  const {service,storage}=fixture(),initial=start(service);
  let result;
  for(let i=0;i<5;i++)result=service.request('guess',{id:initial.game.id,guess:`zzzzzz${i}`},initial.conn);
  assert.equal(result.game.status,'finished');assert.equal(result.game.players[0].errors,5);
  assert.ok(result.game.slots.every(s=>s.name&&!s.found));
  assert.deepEqual(createLocalGameService(catalog,storage).readRound(initial.conn),result.game);
});

test('failed browser storage leaves the previous round intact without consuming an attempt',()=>{
  const {service,map}=fixture(),initial=start(service),before=map.get(ROUND_KEY);
  const failing=createLocalGameService(catalog,{getItem:k=>map.get(k)||null,setItem:()=>{throw Error('quota');}});
  assert.throws(()=>failing.request('guess',{id:initial.game.id,guess:'zzzzzz'},initial.conn),/ما انخصمت محاولة/);
  assert.equal(map.get(ROUND_KEY),before);assert.equal(service.readRound(initial.conn).players[0].errors,0);
});

test('invalid saved sessions and incomplete team names are rejected',()=>{
  const {service,map}=fixture(),initial=start(service);
  assert.throws(()=>service.readRound({...initial.conn,token:'invalid'}));
  assert.throws(()=>service.request('create',{categoryId:101,mode:'teams',names:['',''],members:[['أ'],['ب']]}));
  map.set(ROUND_KEY,'{broken');assert.throws(()=>service.readRound(initial.conn));
});
