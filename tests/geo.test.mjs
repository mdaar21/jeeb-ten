import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {feature} from 'topojson-client';
import {distanceKm,scoreGeoGuess,emptyGeoState,startGeoSession,submitGeoGuess,nextGeoRound,currentRound,currentMember,eligibleQuestions,totals} from '../lib/geo.ts';
const bank=JSON.parse(fs.readFileSync(new URL('../data/geo-bank.json',import.meta.url)));
const atlas=JSON.parse(fs.readFileSync(new URL('../public/maps/world-110m.json',import.meta.url)));
const countries=feature(atlas,atlas.objects.countries).features;
const setup=(overrides={})=>({mode:'solo',difficulty:'mixed',kind:'mixed',region:'world',roundCount:5,names:['أ','ب'],members:[['علي','سارة'],['عمر']],...overrides});
const question=state=>bank.find(q=>q.id===currentRound(state.session).questionId);

test('large Arabic bank has unique stable place IDs, sourced coordinates and all levels',()=>{
  assert.ok(bank.length>=800);assert.equal(new Set(bank.map(q=>q.id)).size,bank.length);
  for(const q of bank){assert.match(q.id,/^Q\d+$/);assert.match(q.name,/[\u0600-\u06ff]/);assert.ok(Math.abs(q.lat)<=90&&Math.abs(q.lon)<=180);assert.ok(q.source.startsWith('https://'));}
  for(const kind of ['country','city','landmark'])assert.ok(bank.some(q=>q.kind===kind));
  for(const level of ['easy','medium','challenge'])assert.ok(bank.some(q=>q.difficulty===level));
  assert.ok(bank.filter(q=>q.region==='arab').length>=200);
});
test('geodesic distances cross the date line and scoring rewards proximity with a friendly margin',()=>{
  assert.ok(Math.abs(distanceKm([179,0],[-179,0])-222.39)<1);
  const q=bank.find(q=>q.kind==='city'),p=[q.lon,q.lat];
  assert.equal(scoreGeoGuess(q,p,countries).points,5000);
  const near=scoreGeoGuess(q,[q.lon+2,q.lat],countries),far=scoreGeoGuess(q,[q.lon+20,q.lat],countries);
  assert.ok(near.points>far.points);assert.ok(far.points>=0&&near.points<=5000);
  assert.throws(()=>scoreGeoGuess(q,[NaN,20],countries));
});
test('country points use actual territory, including Alaska, rather than a capital or center',()=>{
  const usa=bank.find(q=>q.kind==='country'&&q.countryId==='840');
  assert.equal(scoreGeoGuess(usa,[-149,64],countries).points,5000);
  assert.equal(scoreGeoGuess(usa,[-77,39],countries).points,5000);
  const border=scoreGeoGuess(usa,[-100,50],countries),remote=scoreGeoGuess(usa,[0,0],countries);
  assert.ok(border.distanceKm<150);assert.ok(border.points>remote.points);
});
test('every place is drawn only once across new sessions, both modes and reconstructed persisted state',()=>{
  let state=emptyGeoState();const seen=new Set();
  for(let i=0;i<bank.length;i++){
    startGeoSession(state,bank,setup({mode:i%2?'teams':'solo'}),()=>.43);
    const id=currentRound(state.session).questionId;assert.ok(!seen.has(id));seen.add(id);
    state=JSON.parse(JSON.stringify(state));
  }
  assert.equal(state.used.length,bank.length);assert.equal(eligibleQuestions(state,bank,setup()).length,0);
  assert.throws(()=>startGeoSession(state,bank,setup()),/ما تصفّر/);
  assert.equal(state.used.length,bank.length);
});
test('teams hide behind handoff, get the same target, alternate starters, rotate players and sum distance points',()=>{
  const state=emptyGeoState();startGeoSession(state,bank,setup({mode:'teams',roundCount:2,kind:'city'}),()=>.2);
  const id=state.session.id,q=question(state),firstQuestion=q.id;
  assert.equal(currentMember(state.session),'علي');
  submitGeoGuess(state,bank,countries,[q.lon,q.lat],id,0);
  assert.equal(state.session.phase,'handoff');assert.equal(currentRound(state.session).guesses.length,1);
  assert.deepEqual(totals(state.session).map(t=>t.score),[0,0]);
  submitGeoGuess(state,bank,countries,[q.lon,q.lat],id,0);assert.equal(currentRound(state.session).guesses.length,1);
  state.session.phase='aim';submitGeoGuess(state,bank,countries,[q.lon,q.lat],id,1);
  assert.equal(state.session.phase,'reveal');assert.equal(currentRound(state.session).questionId,firstQuestion);
  assert.deepEqual(totals(state.session).map(t=>t.score),[5000,5000]);
  nextGeoRound(state,bank,()=>.3);assert.notEqual(question(state).id,firstQuestion);assert.equal(state.session.current,1);
  const next=question(state);submitGeoGuess(state,bank,countries,[next.lon,next.lat],id,1);state.session.phase='aim';
  assert.equal(currentMember(state.session),'سارة');submitGeoGuess(state,bank,countries,[next.lon,next.lat],id,0);
  nextGeoRound(state,bank);assert.equal(state.session.phase,'finished');assert.deepEqual(totals(state.session).map(t=>t.score),[10000,10000]);
});
test('region and level filters preserve the global no-repeat history',()=>{
  const state=emptyGeoState(),settings=setup({difficulty:'easy',region:'arab',kind:'city'});
  startGeoSession(state,bank,settings,()=>.1);const selected=question(state);
  assert.equal(selected.region,'arab');assert.equal(selected.difficulty,'easy');assert.equal(selected.kind,'city');
  assert.ok(!eligibleQuestions(state,bank,setup()).some(q=>q.id===selected.id));
  assert.throws(()=>startGeoSession(state,bank,setup({mode:'teams',names:['','']})));
});
