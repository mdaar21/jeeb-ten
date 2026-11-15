import { env } from 'cloudflare:workers';
import { catalog, categoryById } from '../../../lib/catalog';
import { createGame, makeAttempt, publicGame, type Game } from '../../../lib/game';

const headers = { 'Cache-Control': 'no-store' };
const response = (body: unknown, status = 200) => Response.json(body, { status, headers });
const fail = (message: string, status = 400) => response({ error: message }, status);
async function rowFor(id: string) { return env.DB!.prepare('SELECT state, version FROM games WHERE id = ?').bind(id).first<{state:string;version:number}>(); }
const viewer = (g: Game, token: string) => g.players.findIndex(p => p.token === token);
const code = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), n => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n % 32]).join('');
export async function GET(request: Request) {
  try {
    const url = new URL(request.url), id = url.searchParams.get('id') || '';
    const row = await rowFor(id.toUpperCase());
    if (!row) return fail('ما لقينا الجولة. تأكد من رمز الغرفة.', 404);
    const game = JSON.parse(row.state) as Game, category = categoryById(game.categoryId)!;
    const you = viewer(game, request.headers.get('x-player-token') || '');
    if (you < 0) return fail('ادخل الغرفة باسمك أولًا.', 403);
    return response(publicGame(game, category, you, row.version));
  } catch (error) { console.error('game_read_failed', error); return fail('تعذر الاتصال. حاول مرة ثانية، ما انخصمت محاولة.', 503); }
}
export async function POST(request: Request) {
  try {
    const input = await request.json() as Record<string, unknown>;
    const action = String(input.action || '');
    if (action === 'create') {
      const category = categoryById(Number(input.categoryId));
      if (!category) return fail('اختر كاتاجوري متاحة.');
      const mode = input.mode === 'online' ? 'online' : input.mode === 'local' ? 'local' : 'solo';
      const playerNames = Array.isArray(input.names) ? input.names.map(String).slice(0, 2) : ['أنت'];
      for (let attempt = 0; attempt < 4; attempt++) {
        const id = code(), game = createGame(id, category.id, mode, playerNames);
        const inserted = await env.DB!.prepare('INSERT OR IGNORE INTO games (id,state,version,updated_at) VALUES (?,?,0,?)')
          .bind(id, JSON.stringify(game), Date.now()).run();
        if (inserted.meta.changes) return response({ token: game.players[0].token, game: publicGame(game, category, 0, 0) }, 201);
      }
      return fail('تعذر إنشاء الغرفة الآن. جرّب ثانية.', 503);
    }
    const id = String(input.id || '').toUpperCase().replace(/\s/g, '');
    if (!/^[A-Z2-9]{6}$/.test(id)) return fail('رمز الغرفة يتكون من 6 أحرف وأرقام.');
    for (let retry = 0; retry < 5; retry++) {
      const row = await rowFor(id);
      if (!row) return fail('ما لقينا الغرفة. تأكد من الرمز.', 404);
      const game = JSON.parse(row.state) as Game, category = categoryById(game.categoryId)!;
      const token = request.headers.get('x-player-token') || '';
      let you = viewer(game, token), joinedToken: string | undefined;
      const requestId = String(input.requestId || '').slice(0, 80);
      if (action === 'join') {
        if (you >= 0) return response({ token, game: publicGame(game, category, you, row.version) });
        if (game.mode !== 'online' || game.status !== 'waiting' || game.players.length >= 2) return fail('الغرفة مكتملة أو بدأت بالفعل.');
        const name = String(input.name || '').trim().slice(0, 24);
        if (!name) return fail('اكتب اسمك للانضمام.');
        joinedToken = crypto.randomUUID();
        game.players.push({ name, token: joinedToken, errors: 0, wrong: [] });
        game.status = 'playing'; game.current = crypto.getRandomValues(new Uint8Array(1))[0] % 2;
        game.notice = { kind: 'info', text: `بدأ التحدي! الدور على ${game.players[game.current].name}.` };
        you = 1;
      } else {
        if (you < 0) return fail('جلسة اللاعب غير صالحة.', 403);
        if (requestId && game.requests.includes(requestId)) return response({ game: publicGame(game, category, you, row.version) });
        if (!['guess', 'confirm', 'cancel'].includes(action)) return fail('محاولة غير معروفة.');
        if (game.status !== 'playing') return response({ game: publicGame(game, category, you, row.version) });
        if (game.mode !== 'local' && game.current !== you) return fail('انتظر دورك.', 409);
        makeAttempt(game, category, catalog, game.mode === 'local' ? game.current : you,
          String(input.guess || ''), action as 'guess' | 'confirm' | 'cancel');
        if (requestId) game.requests = [...game.requests.slice(-49), requestId];
      }
      const nextVersion = row.version + 1;
      const saved = await env.DB!.prepare('UPDATE games SET state = ?, version = ?, updated_at = ? WHERE id = ? AND version = ?')
        .bind(JSON.stringify(game), nextVersion, Date.now(), id, row.version).run();
      if (saved.meta.changes) return response({ ...(joinedToken ? { token: joinedToken } : {}), game: publicGame(game, category, you, nextVersion) });
    }
    return fail('تزامنت محاولتان. حدّث الجولة وحاول ثانية.', 409);
  } catch (error) { console.error('game_write_failed', error); return fail('تعذر الاتصال. حاول مرة ثانية، ما انخصمت محاولة.', 503); }
}
