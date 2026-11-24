export const PLAYED_KEY = 'jeeb-ten-played-v1';
export type PlayedStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const browserStore = (): PlayedStore | null => { try { return globalThis.localStorage ?? null; } catch { return null; } };
export function readPlayed(store: PlayedStore | null = browserStore()): number[] {
  try { const v = JSON.parse(store?.getItem(PLAYED_KEY) || '[]'); return Array.isArray(v) ? [...new Set<number>(v.filter((x: unknown): x is number => Number.isInteger(x)))] : []; } catch { return []; }
}
export function markPlayed(id: number, store: PlayedStore | null = browserStore()): number[] {
  const ids = readPlayed(store); if (ids.includes(id)) return ids;
  const next = [...ids, id]; try { store?.setItem(PLAYED_KEY, JSON.stringify(next)); return next; } catch { return ids; }
}
export function clearPlayed(store: PlayedStore | null = browserStore()): void { try { store?.removeItem(PLAYED_KEY); } catch {} }
export function pickSurprise<T extends { id: number }>(pool: T[], played: Iterable<number>, random: () => number = Math.random): { pick: T | null; exhausted: boolean } {
  if (!pool.length) return { pick: null, exhausted: false };
  const seen = new Set(played), fresh = pool.filter(c => !seen.has(c.id)), exhausted = !fresh.length, from = exhausted ? pool : fresh;
  return { pick: from[Math.floor(random() * from.length)], exhausted };
}
