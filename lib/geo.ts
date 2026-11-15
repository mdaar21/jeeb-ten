import { geoContains, geoDistance } from 'd3-geo';
import type { Feature, Geometry } from 'geojson';

export type Point = [number, number];
export type Difficulty = 'easy' | 'medium' | 'challenge';
export type GeoQuestion = { id: string; kind: 'country'|'city'|'landmark'; name: string; nameEn: string; lat: number; lon: number; countryId?: string; country: string; continent: string; region: 'arab'|'global'; difficulty: Difficulty; source: string; toleranceKm?: number };
export type GeoSettings = { mode: 'solo'|'teams'; difficulty: Difficulty|'mixed'; kind: GeoQuestion['kind']|'mixed'; region: 'world'|'arab'; roundCount: number; names: string[]; members: string[][] };
export type GeoGuess = { team: number; member: string; point: Point; distanceKm: number; points: number; actual: Point; inside: boolean };
export type GeoRound = { questionId: string; guesses: GeoGuess[]; hints: number[] };
export type GeoSession = { id: string; settings: GeoSettings; phase: 'aim'|'handoff'|'reveal'|'finished'; current: number; turns: number[]; rounds: GeoRound[] };
export type GeoState = { used: string[]; session: GeoSession|null };
export type CountryFeature = Feature<Geometry, {name?: string}>;
export const emptyGeoState = ():GeoState => ({used:[],session:null});
export const LEVELS = {mixed:'خلطة',easy:'سهل',medium:'متوسط',challenge:'تحدّي'} as const;
export const KINDS = {mixed:'كل الأماكن',country:'دول',city:'مدن',landmark:'معالم ووجهات'} as const;
export const currentRound = (session:GeoSession) => session.rounds[session.rounds.length-1];
export const currentMember = (session:GeoSession) => session.settings.members[session.current][session.turns[session.current]%session.settings.members[session.current].length];
export const totals = (session:GeoSession) => session.settings.names.map((name,team)=>({name,score:session.rounds.filter(r=>r.guesses.length===session.settings.names.length).reduce((sum,r)=>sum+(r.guesses.find(g=>g.team===team)?.points||0),0)}));
export function eligibleQuestions(state:GeoState,bank:GeoQuestion[],settings:Pick<GeoSettings,'difficulty'|'kind'|'region'>) {
  const seen=new Set(state.used);
  return bank.filter(q=>!seen.has(q.id)&&(settings.difficulty==='mixed'||q.difficulty===settings.difficulty)&&(settings.kind==='mixed'||q.kind===settings.kind)&&(settings.region==='world'||q.region==='arab'));
}
function draw(state:GeoState,bank:GeoQuestion[],settings:GeoSettings,random:()=>number) {
  let choices=eligibleQuestions(state,bank,settings);
  if(!choices.length)throw Error('خلّصت أسئلة هذا الاختيار! غيّر المستوى أو نوع الأماكن. سجلّك ما تصفّر.');
  if(settings.difficulty==='mixed'){
    const levels=(['easy','easy','easy','medium','medium','medium','challenge'] as Difficulty[]).filter(l=>choices.some(q=>q.difficulty===l));
    const level=levels[Math.min(levels.length-1,Math.floor(random()*levels.length))];choices=choices.filter(q=>q.difficulty===level);
  }
  const selected=choices[Math.min(choices.length-1,Math.floor(random()*choices.length))];
  state.used.push(selected.id);
  return {questionId:selected.id,guesses:[],hints:[]} as GeoRound;
}
export function startGeoSession(state:GeoState,bank:GeoQuestion[],input:GeoSettings,random=Math.random) {
  const settings=structuredClone(input);
  if(!['solo','teams'].includes(settings.mode)||!(settings.difficulty in LEVELS)||!(settings.kind in KINDS)||!['world','arab'].includes(settings.region))throw Error('اختر إعدادات الجولة.');
  settings.roundCount=Math.min(15,Math.max(1,Math.floor(settings.roundCount)||5));
  if(settings.mode==='teams'){
    if(settings.names.length!==2||settings.names.some(n=>!n.trim())||settings.members.length!==2||settings.members.some(m=>!m.length||m.length>30||m.some(n=>!n.trim())))throw Error('اكتب اسم كل فريق وأسماء لاعبيه.');
    settings.names=settings.names.map(n=>n.trim().slice(0,24));settings.members=settings.members.map(m=>m.map(n=>n.trim().slice(0,24)));
  }else{settings.names=['أنت'];settings.members=[['أنت']];}
  settings.roundCount=Math.min(settings.roundCount,eligibleQuestions(state,bank,settings).length);
  const first=draw(state,bank,settings,random);
  state.session={id:crypto.randomUUID(),settings,phase:'aim',current:0,turns:settings.names.map(()=>0),rounds:[first]};
  return state.session;
}
const radians=Math.PI/180,earthRadius=6371.0088;
export function distanceKm(a:Point,b:Point){return geoDistance(a,b)*earthRadius;}
const unit=(p:Point)=>[Math.cos(p[1]*radians)*Math.cos(p[0]*radians),Math.cos(p[1]*radians)*Math.sin(p[0]*radians),Math.sin(p[1]*radians)];
const dot=(a:number[],b:number[])=>a.reduce((s,v,i)=>s+v*b[i],0);
function nearestArc(p:Point,a:Point,b:Point):Point {
  const av=unit(a),bv=unit(b),pv=unit(p),n=[av[1]*bv[2]-av[2]*bv[1],av[2]*bv[0]-av[0]*bv[2],av[0]*bv[1]-av[1]*bv[0]],nn=dot(n,n);
  if(nn<1e-15)return distanceKm(p,a)<distanceKm(p,b)?a:b;
  const t=dot(pv,n)/nn,v=pv.map((x,i)=>x-t*n[i]),length=Math.sqrt(dot(v,v));
  if(length<1e-12)return a;
  const q:Point=[Math.atan2(v[1],v[0])/radians,Math.asin(Math.max(-1,Math.min(1,v[2]/length)))/radians];
  const arc=geoDistance(a,b);
  if(Math.abs(geoDistance(a,q)+geoDistance(q,b)-arc)<1e-7)return q;
  return distanceKm(p,a)<distanceKm(p,b)?a:b;
}
export function countryDistance(point:Point,feature:CountryFeature):{distanceKm:number;actual:Point;inside:boolean} {
  if(geoContains(feature,point))return{distanceKm:0,actual:point,inside:true};
  const geometry=feature.geometry;
  const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.type==='MultiPolygon'?geometry.coordinates:[];
  let best=Infinity,actual:Point=point;
  for(const polygon of polygons)for(const ring of polygon)for(let i=1;i<ring.length;i++){
    const candidate=nearestArc(point,ring[i-1] as Point,ring[i] as Point),distance=distanceKm(point,candidate);
    if(distance<best){best=distance;actual=candidate;}
  }
  return{distanceKm:best,actual,inside:false};
}
export function scoreGeoGuess(question:GeoQuestion,point:Point,countries:CountryFeature[]) {
  if(point.length!==2||point.some(v=>!Number.isFinite(v))||Math.abs(point[0])>180||Math.abs(point[1])>90)throw Error('حدد مكانًا على الكرة الأرضية.');
  const country=question.countryId?countries.find(f=>String(f.id)===question.countryId):undefined;
  const measured=question.kind==='country'&&country?countryDistance(point,country):{distanceKm:distanceKm(point,[question.lon,question.lat]),actual:[question.lon,question.lat] as Point,inside:false};
  const tolerance=question.toleranceKm??(question.kind==='country'?20:question.kind==='city'?75:40);
  const points=Math.max(0,Math.min(5000,Math.round(5000*Math.exp(-Math.max(0,measured.distanceKm-tolerance)/1800))));
  return {...measured,points};
}
export function submitGeoGuess(state:GeoState,bank:GeoQuestion[],countries:CountryFeature[],point:Point,sessionId:string,expectedTeam:number) {
  const session=state.session;if(!session||session.id!==sessionId||session.phase!=='aim'||session.current!==expectedTeam)return;
  const round=currentRound(session),question=bank.find(q=>q.id===round.questionId);if(!question)throw Error('السؤال غير متاح.');
  round.guesses.push({team:session.current,member:currentMember(session),point,...scoreGeoGuess(question,point,countries)});
  session.turns[session.current]++;
  if(round.guesses.length===session.settings.names.length)session.phase='reveal';
  else{session.current=1-session.current;session.phase='handoff';}
}
export function nextGeoRound(state:GeoState,bank:GeoQuestion[],random=Math.random) {
  const session=state.session;if(!session||session.phase!=='reveal')return;
  if(session.rounds.length>=session.settings.roundCount){session.phase='finished';return;}
  session.rounds.push(draw(state,bank,session.settings,random));session.current=session.settings.mode==='teams'?(session.rounds.length-1)%2:0;session.phase='aim';
}
