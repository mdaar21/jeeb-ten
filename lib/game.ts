import { answerIndex, answerNames, compact, editDistance, foldAnswer, identityFor, looseForms } from './answer-matching.ts';
export type Answer = {
  id: string; rank: number; nameAr: string; nameEn: string; aliases: string[];
  series?: string; part?: string; year?: string;
};
export type Category = {
  id: number; title: string; group: string; icon: string; description: string; metric: string;
  source: { title: string; url: string; asOf: string; checkedAt: string };
  rankingType?: 'editorial' | 'source'; difficulty?: 'easy' | 'standard'; region?: 'arab' | 'global'; domain?: string; section?: string;
  answers: Answer[]; distractors?: Omit<Answer, 'rank'>[];
};
export type Entity = Omit<Answer, 'rank'>;
export type Notice = { kind: 'correct' | 'wrong' | 'repeat' | 'clarify' | 'suggest' | 'info'; text: string; name?: string };
export type Player = { name: string; token: string; errors: number; wrong: string[]; members: string[]; turns: number };
export type Game = {
  id: string; categoryId: number; mode: 'solo' | 'teams';
  status: 'playing' | 'finished'; players: Player[]; current: number;
  found: { rank: number; player: number; member?: string }[];
  pending: { player: number; entityKey: string; name: string } | null;
  clarifying: { player: number; query: string } | null;
  notice: Notice | null; reason: 'complete' | 'mistakes' | null;
  requests: string[]; created: number;
};

const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
export function normalize(text: string): string {
  return String(text).toLowerCase().normalize('NFKC')
    .replace(/[٠-٩]/g, c => String(arabicDigits.indexOf(c)))
    .replace(/[۰-۹]/g, c => String(persianDigits.indexOf(c)))
    .replace(/\b(viii|vii|iii|vi|iv|ii|ix|v|x)\b/g, s => ({ ii: '2', iii: '3', iv: '4', v: '5', vi: '6', vii: '7', viii: '8', ix: '9', x: '10' }[s] || s))
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}
export function key(entity: Entity): string {
  return normalize(entity.nameEn || entity.nameAr) + (entity.year ? ':' + entity.year : '');
}
const seriesLabels = [
  ['grand theft auto', 'gta', 'قراند', 'جراند', 'جراند ثفت اوتو', 'غراند ثفت اوتو'],
  ['red dead', 'red dead redemption', 'rdr', 'ريد ديد', 'ريد ديد ريدمبشن'],
  ['god of war', 'قود اوف وار', 'غود اوف وار', 'جود اوف وار'],
  ['call of duty', 'cod', 'كود', 'كول اوف ديوتي'],
  ['fifa', 'فيفا', 'ea sports fc', 'اف سي'],
  ['harry potter', 'هاري بوتر'], ['star wars', 'ستار وورز', 'حرب النجوم'],
  ['stranger things', 'سترينجر ثينقز', 'سترينجر ثينغز'],
  ['squid game', 'لعبة الحبار'], ['the last of us', 'ذا لاست اوف اس'],
];

export function domain(id: number): string {
  if ([21,41,42,43,44,45,46,47,49,53,59,61,62,65,66,67,68,69,75,79].includes(id)) return 'countries';
  if ([3,9].includes(id)) return 'video-games';
  if ([2,5,7,10,12].includes(id)) return 'films';
  if ([1,4,13].includes(id)) return 'television';
  if ([40,48,50].includes(id)) return 'cities';
  if ([73,74].includes(id)) return 'languages';
  if ([22,23,25,27,28,29,31,33,35].includes(id)) return 'athletes';
  if (id === 15) return 'artists';
  if ([14,17].includes(id)) return 'songs';
  if ([37,38].includes(id)) return 'dishes';
  return `category-${id}`;
}
const poolCache=new WeakMap<Category[],Map<string,Entity[]>>();
export function entityPool(category:Category,catalog:Category[]):Entity[]{
  const scope=category.domain||domain(category.id),cache=poolCache.get(catalog)||new Map<string,Entity[]>();
  poolCache.set(catalog,cache);const existing=cache.get(scope);if(existing)return existing;
  const map=new Map<string,Entity>();
  for(const list of catalog.filter(c=>(c.domain||domain(c.id))===scope))for(const entity of [...list.answers,...(list.distractors||[])]){
    const identity=identityFor(entity,scope),old=map.get(identity);
    map.set(identity,{...entity,aliases:[...new Set([...(old?.aliases||[]),...(old?[old.nameAr,old.nameEn]:[]),...entity.aliases])]});
  }
  const pool=[...map.values()];cache.set(scope,pool);return pool;
}
export type Match={kind:'exact'|'suggest';entity:Entity}|{kind:'clarify'|'unknown';text:string};
export function resolveAnswer(raw:string,category:Category,catalog:Category[]):Match{
  const q=foldAnswer(raw),scope=category.domain||domain(category.id),pool=entityPool(category,catalog),index=answerIndex(pool,scope);
  if(!q)return{kind:'clarify',text:'اكتب اسمًا أوضح عشان نقدر نتحقق منه.'};
  const media=['video-games','films','television'].includes(scope);
  let matches=index.exact.get(compact(q))||[];
  if(!matches.length){const alternatives=looseForms(q);if(q.startsWith('ال')&&q.length>3)alternatives.push(q.slice(2));matches=[...new Set(alternatives.flatMap(form=>index.exact.get(compact(form))||index.loose.get(form.startsWith('words:')?form:compact(form))||[]).concat(index.loose.get(compact(q))||[]))];}
  const families=new Map(matches.map(e=>[identityFor(e,scope),e]));
  const representative=(entity:Entity)=>category.answers.find(a=>identityFor(a,scope)===identityFor(entity,scope))||entity;
  if(families.size===1){const entity=representative([...families.values()][0]);if((entity.part||entity.year)&&q===foldAnswer(entity.series||''))return{kind:'clarify',text:'تقصد أي جزء أو موسم؟ حدده، بدون خصم محاولة.'};return{kind:'exact',entity};}
  if(families.size>1){
    const canonical=matches.filter(e=>[e.nameEn,e.nameAr].some(name=>compact(name)===compact(q)));
    if(!media&&new Set(canonical.map(e=>identityFor(e,scope))).size===1)return{kind:'exact',entity:representative(canonical[0])};
    const local=category.answers.filter(a=>families.has(identityFor(a,scope)));
    if(!media&&!['countries','cities','athletes','actors','clubs','parks'].includes(scope)&&local.length===1)return{kind:'exact',entity:local[0]};
    return{kind:'clarify',text:media?'الاسم يطابق أكثر من إصدار. حدّد الجزء أو الموسم أو السنة، بدون خصم محاولة.':scope==='parks'?'تقصد أي فرع أو مدينة؟ حدده، بدون خصم محاولة.':'الاسم يطابق أكثر من إجابة. حدده أكثر، بدون خصم محاولة.'};
  }
  if(compact(q).length<2)return{kind:'clarify',text:'اكتب اسمًا أوضح عشان نقدر نتحقق منه.'};
  if(pool.some(e=>e.series&&foldAnswer(e.series)===q)||(media&&seriesLabels.some(group=>group.map(foldAnswer).includes(q))))return{kind:'clarify',text:scope==='parks'?'تقصد أي فرع أو مدينة؟ اكتب اسمها، بدون خصم محاولة.':'تقصد أي جزء أو موسم؟ اكتب اسمه أو رقمه، وما نحسبها غلطة.'};
  if(compact(q).length>=4&&!/\d/.test(q)){
    const words=q.split(' '),partial=pool.filter(e=>answerNames(e,scope).some(n=>words.every(w=>n.split(' ').includes(w))&&n!==q));
    if(partial.length>1)return{kind:'clarify',text:'الاسم مختصر ويطابق أكثر من خيار. حدده أكثر، بدون خصم محاولة.'};
    if(partial.length===1)return{kind:'suggest',entity:representative(partial[0])};
  }
  const cq=compact(q),numbers=(q.match(/\d+/g)||[]).join(',');
  const ranked=pool.map(entity=>{let score=0;for(const name of answerNames(entity,scope)){
    if((name.match(/\d+/g)||[]).join(',')!==numbers)continue;
    const candidate=compact(name),length=Math.max(cq.length,candidate.length);if(length<3)continue;
    const maximum=length<9?1:length<17?2:length<29?3:4;
    const edits=editDistance(cq,candidate,maximum),similarity=1-edits/length;
    if(edits<=maximum&&similarity>=(length<5?.74:.78))score=Math.max(score,similarity);
  }return{entity:representative(entity),score};}).filter(r=>r.score>0).sort((a,b)=>b.score-a.score);
  if(ranked[0]&&(!ranked[1]||ranked[0].score-ranked[1].score>=.055))return{kind:'suggest',entity:ranked[0].entity};
  if(ranked.length>1)return{kind:'clarify',text:'الاسم قريب من أكثر من إجابة. وضّحه شوي، وما نحسبها غلطة.'};
  return{kind:'unknown',text:'هالإجابة مو ضمن العشرة في هذه القائمة.'};
}

export function activeMember(player: Player): string { return player.members[player.turns % player.members.length]; }
export function createGame(id: string, categoryId: number, mode: Game['mode'], names: string[], members: string[][] = []): Game {
  const players = (mode === 'teams' ? [names[0] || 'الفريق الأول', names[1] || 'الفريق الثاني'] : ['أنت'])
    .map((name,i) => ({ name: name.trim().slice(0, 24) || 'فريق', token: crypto.randomUUID(), errors: 0, wrong: [] as string[],
      members: members[i]?.map(m=>m.trim().slice(0,24)).filter(Boolean).slice(0,30) || [mode==='solo'?'أنت':'لاعب 1'], turns: 0 }));
  for(const p of players)if(!p.members.length)p.members=['لاعب 1'];
  return { id, categoryId, mode, status: 'playing',
    players, current: mode === 'teams' ? crypto.getRandomValues(new Uint8Array(1))[0] % 2 : 0,
    found: [], pending: null, clarifying: null, notice: null, reason: null, requests: [], created: Date.now() };
}
export function getResults(game: Game) {
  const totals = game.players.map((p, i) => ({ name: p.name, members: p.members, found: game.found.filter(f => f.player === i).length,
    score: game.found.filter(f => f.player === i).reduce((sum, f) => sum + f.rank, 0), errors: p.errors }));
  let winner: number | null = null;
  if (game.mode !== 'solo') {
    if (game.reason === 'mistakes') winner = game.players.findIndex(p => p.errors < 5);
    else if (totals[0].score !== totals[1]?.score) winner = totals[0].score > totals[1].score ? 0 : 1;
  }
  return { totals, winner, won: game.mode === 'solo' ? game.found.length === 10 : undefined };
}
function settle(game: Game, category: Category, player: number, raw: string, entity?: Entity) {
  const target = entity && category.answers.find(a => identityFor(a, category.domain || domain(category.id)) === identityFor(entity, category.domain || domain(category.id)) ||
    (!a.year && !entity.year && normalize(a.nameEn || a.nameAr) === normalize(entity.nameEn || entity.nameAr)));
  game.pending = null;
  game.clarifying = null;
  if (target && game.found.some(f => f.rank === target.rank)) {
    game.notice = { kind: 'repeat', text: 'سبق وانكشفت هالإجابة. جرّب اسمًا ثانيًا.' }; return;
  }
  if (target) {
    game.found.push({ rank: target.rank, player, member: activeMember(game.players[player]) });
    game.notice = { kind: 'correct', text: `صح! ${target.nameAr} بالمركز ${target.rank}.` };
  } else {
    game.players[player].errors++;
    game.players[player].wrong.push(raw.slice(0, 90));
    game.notice = { kind: 'wrong', text: 'مو ضمن العشرة في هالقائمة.' };
  }
  game.players[player].turns++;
  if (game.players[player].errors === 5) { game.status = 'finished'; game.reason = 'mistakes'; }
  else if (game.found.length === 10) { game.status = 'finished'; game.reason = 'complete'; }
  else if (game.mode !== 'solo') game.current = 1 - game.current;
}
export function makeAttempt(game: Game, category: Category, catalog: Category[], player: number, raw: string,
  action: 'guess' | 'confirm' | 'cancel' = 'guess'): Game {
  if (game.status !== 'playing' || game.current !== player) return game;
  if (action === 'cancel') { game.pending = null; game.notice = { kind: 'info', text: 'عدّل إجابتك، ما انخصمت محاولة.' }; return game; }
  if (action === 'confirm') {
    if (game.pending?.player !== player) return game;
    const entity = entityPool(category, catalog).find(e => identityFor(e, category.domain || domain(category.id)) === game.pending?.entityKey || key(e) === game.pending?.entityKey || (game.pending?.name && answerNames(e, category.domain || domain(category.id)).includes(foldAnswer(game.pending.name))));
    if (entity) settle(game, category, player, entity.nameAr, entity);
    return game;
  }
  if (!raw.trim()) return game;
  game.pending = null;
  let query = raw.slice(0, 120);
  if (game.clarifying?.player === player) {
    const short = normalize(query).replace(/^(?:الجزء|الموسم|جزء|موسم|part|season)\s*/, '');
    const ordinals: Record<string,string> = { الاول:'1', اول:'1', الثاني:'2', ثاني:'2', الثالث:'3', ثالث:'3', الرابع:'4', رابع:'4', الخامس:'5', خامس:'5', السادس:'6', سادس:'6', السابع:'7', سابع:'7', الثامن:'8', ثامن:'8', التاسع:'9', تاسع:'9', العاشر:'10', عاشر:'10' };
    if (/^\d{1,4}$/.test(short) || ordinals[short]) query = `${game.clarifying.query} ${ordinals[short] || short}`;
  }
  let match = resolveAnswer(query, category, catalog);
  if(match.kind!=='exact'&&game.clarifying?.player===player&&query===raw.slice(0,120)){
    const combined=`${game.clarifying.query} ${query}`;
    const contextual=resolveAnswer(combined,category,catalog);
    if(contextual.kind==='exact'||(match.kind==='unknown'&&contextual.kind!=='unknown')){query=combined;match=contextual;}
  }
  if (match.kind === 'clarify') {
    game.clarifying = { player, query: query.length > 3 ? query : game.clarifying?.query || query };
    game.notice = { kind: 'clarify', text: match.text };
  }
  else if (match.kind === 'suggest') {
    game.pending = { player, entityKey: identityFor(match.entity, category.domain || domain(category.id)), name: match.entity.nameAr };
    game.clarifying = null;
    game.notice = { kind: 'suggest', text: `هل تقصد «${match.entity.nameAr}»؟`, name: match.entity.nameAr };
  } else settle(game, category, player, raw, match.kind === 'exact' ? match.entity : undefined);
  return game;
}

export function publicGame(game: Game, category: Category, viewer: number, version: number) {
  const over = game.status === 'finished';
  return { id: game.id, categoryId: game.categoryId, mode: game.mode, status: game.status, current: game.current,
    you: viewer, version, players: game.players.map(p => ({ name: p.name, members: p.members, activeMember: activeMember(p), activeMemberIndex: p.turns % p.members.length, errors: p.errors, wrong: p.wrong })),
    foundCount: game.found.length, notice: game.notice, reason: game.reason,
    canPlay: game.status === 'playing',
    slots: Array.from({ length: 10 }, (_, i) => {
      const rank = i + 1, found = game.found.find(f => f.rank === rank), a = category.answers.find(x => x.rank === rank)!;
      return { rank, found: !!found, player: found?.player ?? null, member: found?.member ?? null,
        name: found || over ? a.nameAr : null, nameEn: found || over ? a.nameEn : null };
    }),
    results: over ? getResults(game) : null };
}
export type PublicGame = ReturnType<typeof publicGame>;
