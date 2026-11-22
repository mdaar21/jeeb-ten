import { createGame, makeAttempt, publicGame, type Category, type Game } from './game.ts';

export type Connection = { id: string; token: string };
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
type SavedRound = { schema: 1; game: Game; version: number };
export const ROUND_KEY = 'jeeb-ten-local-round-v1';

export function createLocalGameService(catalog: Category[], storage: StorageLike) {
  const categoryFor = (id: number) => {
    const category = catalog.find(c => c.id === id);
    if (!category) throw Error('اختر كاتاجوري متاحة.');
    return category;
  };
  function load(conn: Connection | null): SavedRound {
    if (!conn) throw Error('ابدأ تحدّيًا آخر.');
    let saved: SavedRound | null;
    try { saved = JSON.parse(storage.getItem(ROUND_KEY) || 'null'); }
    catch { throw Error('تعذر استرجاع الجولة المحفوظة. ابدأ تحدّيًا آخر.'); }
    const game = saved?.game;
    if (saved?.schema !== 1 || !game || game.id !== conn.id ||
      !['solo', 'teams'].includes(game.mode) || !Array.isArray(game.players) ||
      !game.players.length || game.players[0].token !== conn.token ||
      !game.players.every(p => Array.isArray(p.members) && p.members.length && Number.isInteger(p.turns)))
      throw Error('ما لقينا الجولة المحفوظة على هذا الجهاز. ابدأ تحدّيًا آخر.');
    categoryFor(game.categoryId);
    return saved;
  }
  function save(round: SavedRound) {
    try { storage.setItem(ROUND_KEY, JSON.stringify(round)); }
    catch { throw Error('تعذر حفظ الجولة على الجهاز. اسمح بالتخزين أو أفرغ مساحة، ثم جرّب ثانية. ما انخصمت محاولة.'); }
  }
  function readRound(conn: Connection) {
    const saved = load(conn);
    return publicGame(saved.game, categoryFor(saved.game.categoryId), 0, saved.version);
  }
  function request(action: string, input: Record<string, unknown>, conn: Connection | null = null) {
    if (action === 'create') {
      const category = categoryFor(Number(input.categoryId));
      if (input.mode !== undefined && !['solo', 'teams'].includes(String(input.mode)))
        throw Error('اللعب فردي أو فريق ضد فريق على نفس الجهاز.');
      const mode = input.mode === 'teams' ? 'teams' : 'solo';
      const names = Array.isArray(input.names) ? input.names.slice(0, 2).map(String) : [];
      const members = Array.isArray(input.members)
        ? input.members.slice(0, 2).map(a => Array.isArray(a) ? a.slice(0, 30).map(String) : []) : [];
      if (mode === 'teams' && (names.length !== 2 || names.some(s => !s.trim()) || members.length !== 2 ||
        members.some(a => !a.length || a.some(s => !s.trim())))) throw Error('اكتب اسم كل فريق وأسماء لاعبيه.');
      const game = createGame(crypto.randomUUID(), category.id, mode, names, mode === 'solo' ? [['أنت']] : members);
      save({ schema: 1, game, version: 0 });
      return { game: publicGame(game, category, 0, 0), token: game.players[0].token };
    }
    if (!['guess', 'confirm', 'cancel', 'timeout'].includes(action)) throw Error('محاولة غير معروفة.');
    const saved = load(conn), game = saved.game, category = categoryFor(game.categoryId);
    if (String(input.id || '') !== game.id) throw Error('الجولة غير صالحة.');
    const requestId = String(input.requestId || crypto.randomUUID()).slice(0, 80);
    if (!game.requests.includes(requestId) && game.status === 'playing') {
      makeAttempt(game, category, catalog, game.current, String(input.guess || ''), action as 'guess' | 'confirm' | 'cancel' | 'timeout');
      game.requests = [...game.requests.slice(-49), requestId];
      saved.version++;
      save(saved);
    }
    return { game: publicGame(game, category, 0, saved.version) };
  }
  return { readRound, request };
}

let service: ReturnType<typeof createLocalGameService> | undefined;
export function configureLocalGame(catalog: Category[], storage: StorageLike) {
  service = createLocalGameService(catalog, storage);
}
export async function readLocalRound(conn: Connection) {
  if (!service) throw Error('انتظر تحميل القوائم.');
  return service.readRound(conn);
}
export async function requestLocalRound(action: string, input: Record<string, unknown>, conn: Connection | null) {
  if (!service) throw Error('انتظر تحميل القوائم.');
  return service.request(action, input, conn);
}
