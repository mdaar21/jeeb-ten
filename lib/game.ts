export type Answer = {
  id: string; rank: number; nameAr: string; nameEn: string; aliases: string[];
  series?: string; part?: string; year?: string;
};
export type Category = {
  id: number; title: string; group: string; icon: string; description: string; metric: string;
  source: { title: string; url: string; asOf: string; checkedAt: string };
  rankingType?: 'editorial' | 'source'; difficulty?: 'easy' | 'standard'; region?: 'arab' | 'global'; domain?: string;
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
function names(entity: Entity): string[] {
  const more: string[] = [];
  if (entity.series && entity.part) more.push(`${entity.series} ${entity.part}`);
  if (entity.part && /^\d+$/.test(entity.part) && !/\d/.test(normalize(entity.nameAr))) more.push(`${entity.nameAr} ${entity.part}`);
  if (entity.year) more.push(`${entity.nameAr} ${entity.year}`, `${entity.nameEn} ${entity.year}`);
  return [...new Set([entity.nameAr, entity.nameEn, ...(entity.aliases || []), ...more].filter(Boolean).map(normalize))];
}
function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = old;
    }
  }
  return row[b.length];
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
export function entityPool(category: Category, catalog: Category[]): Entity[] {
  const map = new Map<string, Entity>();
  for (const list of catalog.filter(c => (c.domain || domain(c.id)) === (category.domain || domain(category.id)))) {
    for (const e of [...list.answers, ...(list.distractors || [])]) {
      const k = key(e), old = map.get(k);
      map.set(k, { ...e, aliases: [...new Set([...(old?.aliases || []), ...(e.aliases || [])])] });
    }
  }
  return [...map.values()];
}

export type Match = { kind: 'exact' | 'suggest'; entity: Entity } | { kind: 'clarify' | 'unknown'; text: string };
export function resolveAnswer(raw: string, category: Category, catalog: Category[]): Match {
  const q = normalize(raw);
  if (!q) return { kind: 'clarify', text: 'اكتب اسمًا أوضح عشان نقدر نتحقق منه.' };
  const pool = entityPool(category, catalog);
  const compactQuery = q.replace(/ /g, '');
  const exact = pool.filter(e => names(e).some(name => name === q || name.replace(/ /g, '') === compactQuery));
  const mediaDomain=['video-games','films','television'].includes(category.domain || domain(category.id));
  if(exact.length>1&&!mediaDomain){
    const local=category.answers.filter(e=>names(e).some(name=>name===q||name.replace(/ /g,'')===compactQuery));
    if(local.length===1)return {kind:'exact',entity:local[0]};
  }
  if (exact.length === 1) {
    // A source ranking seasons or editions must retain the distinction.
    const e = exact[0];
    if ((e.part || e.year) && names(e).includes(q) && q === normalize(e.series || ''))
      return { kind: 'clarify', text: 'تقصد أي جزء أو موسم؟ اكتب اسمه أو رقمه، وما نحسبها غلطة.' };
    return { kind: 'exact', entity: e };
  }
  if (exact.length > 1) return { kind: 'clarify', text: mediaDomain?'الاسم يطابق أكثر من إصدار. حدّد الجزء أو الموسم أو سنة الإصدار، بدون خصم محاولة.':category.domain==='parks'?'تقصد أي فرع أو مدينة؟ اكتب اسمها، بدون خصم محاولة.':'الاسم يطابق أكثر من عنصر. اكتبه كاملًا، بدون خصم محاولة.' };
  if (compactQuery.length < 2) return { kind: 'clarify', text: 'اكتب اسمًا أوضح عشان نقدر نتحقق منه.' };
  const explicitSeries = pool.some(e => e.series && normalize(e.series) === q);
  if (explicitSeries || (['video-games','films','television'].includes(category.domain || domain(category.id)) && seriesLabels.some(group => group.map(normalize).includes(q)))) {
    return { kind: 'clarify', text: category.domain==='parks'?'تقصد أي فرع أو مدينة؟ اكتب اسمها، بدون خصم محاولة.':'تقصد أي جزء أو موسم؟ اكتب الاسم كاملًا أو أضف رقمه، وما نحسبها غلطة.' };
  }
  const qNumbers = q.match(/\d+/g)?.join(',') || '';
  const ranked = pool.map(entity => {
    let score = 0;
    for (const n of names(entity)) {
      if ((n.match(/\d+/g)?.join(',') || '') !== qNumbers) continue;
      const len = Math.max(q.length, n.length);
      if (len < 5 || Math.abs(q.length - n.length) > 3) continue;
      const edits = distance(q, n);
      const maxEdits = len < 9 ? 1 : 2;
      if (edits <= maxEdits) score = Math.max(score, 1 - edits / len);
    }
    return { entity, score };
  }).filter(x => x.score >= .8).sort((a, b) => b.score - a.score);
  if (ranked[0] && (!ranked[1] || ranked[0].score - ranked[1].score >= .07))
    return { kind: 'suggest', entity: ranked[0].entity };
  if (ranked.length > 1) return { kind: 'clarify', text: 'الاسم قريب من أكثر من إجابة. اكتبه بشكل أدق، وما نحسبها غلطة.' };
  return { kind: 'unknown', text: 'هالإجابة مو ضمن العشرة في هذه القائمة.' };
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
  const target = entity && category.answers.find(a => key(a) === key(entity) ||
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
    const entity = entityPool(category, catalog).find(e => key(e) === game.pending?.entityKey);
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
  if(match.kind==='unknown'&&game.clarifying?.player===player&&query===raw.slice(0,120)){
    const combined=`${game.clarifying.query} ${query}`;
    const contextual=resolveAnswer(combined,category,catalog);
    if(contextual.kind!=='unknown'){query=combined;match=contextual;}
  }
  if (match.kind === 'clarify') {
    game.clarifying = { player, query: query.length > 3 ? query : game.clarifying?.query || query };
    game.notice = { kind: 'clarify', text: match.text };
  }
  else if (match.kind === 'suggest') {
    game.pending = { player, entityKey: key(match.entity), name: match.entity.nameAr };
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
