import { env } from 'cloudflare:workers';
import { catalog, categoryById } from '../../../lib/catalog';
import { createGame, makeAttempt, publicGame, type Game } from '../../../lib/game';
const headers = { 'Cache-Control': 'no-store' };
const response = (body: unknown, status = 200) => Response.json(body, { status, headers });
const fail = (message: string, status = 400) => response({ error: message }, status);
async function rowFor(id: string) { return env.DB!.prepare('SELECT state, version FROM games WHERE id = ?').bind(id).first<{state:string;version:number}>(); }
const code = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), n => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n % 32]).join('');
const supported = (g: Game) => (g.mode === 'solo' || g.mode === 'teams') && g.players.every(p=>Array.isArray(p.members)&&p.members.length>0&&Number.isInteger(p.turns));
export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id') || '';
    const row = await rowFor(id.toUpperCase());
    if (!row) return fail('ما لقينا الجولة. ابدأ تحدّيًا جديدًا.', 404);
    const game = JSON.parse(row.state) as Game;
    if(!supported(game))return fail('ابدأ جولة جديدة بالنظام المحدّث.',410);
    if (game.players[0].token !== request.headers.get('x-player-token')) return fail('جلسة الجولة غير صالحة.',403);
    return response(publicGame(game,categoryById(game.categoryId)!,0,row.version));
  } catch(error) { console.error('game_read_failed',error); return fail('تعذر الاتصال. ما انخصمت محاولة.',503); }
}
export async function POST(request: Request) {
  try {
    const input=await request.json() as Record<string,unknown>, action=String(input.action||'');
    if(action==='create'){
      const category=categoryById(Number(input.categoryId));
      if(!category)return fail('اختر كاتاجوري متاحة.');
      if(input.mode!==undefined&&!['solo','teams'].includes(String(input.mode)))return fail('اللعب فردي أو فريق ضد فريق على نفس الجهاز.');
      const mode=input.mode==='teams'?'teams':'solo';
      const names=Array.isArray(input.names)?input.names.map(String).slice(0,2):[];
      const members=Array.isArray(input.members)?input.members.slice(0,2).map(a=>Array.isArray(a)?a.slice(0,30).map(String):[]):[];
      if(mode==='teams'&&(names.length!==2||names.some(s=>!s.trim())||members.length!==2||members.some(a=>!a.length||a.some(s=>!s.trim()))))return fail('اكتب اسم كل فريق وأسماء لاعبيه.');
      for(let attempt=0;attempt<4;attempt++){
        const id=code(),game=createGame(id,category.id,mode,names,members);
        const saved=await env.DB!.prepare('INSERT OR IGNORE INTO games (id,state,version,updated_at) VALUES (?,?,0,?)').bind(id,JSON.stringify(game),Date.now()).run();
        if(saved.meta.changes)return response({token:game.players[0].token,game:publicGame(game,category,0,0)},201);
      }
      return fail('تعذر بدء الجولة الآن. جرّب ثانية.',503);
    }
    if(!['guess','confirm','cancel'].includes(action))return fail('محاولة غير معروفة.');
    const id=String(input.id||'').toUpperCase();
    if(!/^[A-Z2-9]{6}$/.test(id))return fail('الجولة غير صالحة.');
    for(let retry=0;retry<5;retry++){
      const row=await rowFor(id);if(!row)return fail('ما لقينا الجولة.',404);
      const game=JSON.parse(row.state) as Game;
      if(!supported(game))return fail('ابدأ جولة جديدة بالنظام المحدّث.',410);
      if(game.players[0].token!==request.headers.get('x-player-token'))return fail('جلسة الجولة غير صالحة.',403);
      const category=categoryById(game.categoryId)!,requestId=String(input.requestId||'').slice(0,80);
      if((requestId&&game.requests.includes(requestId))||game.status!=='playing')return response({game:publicGame(game,category,0,row.version)});
      makeAttempt(game,category,catalog,game.current,String(input.guess||''),action as 'guess'|'confirm'|'cancel');
      if(requestId)game.requests=[...game.requests.slice(-49),requestId];
      const version=row.version+1;
      const saved=await env.DB!.prepare('UPDATE games SET state = ?, version = ?, updated_at = ? WHERE id = ? AND version = ?').bind(JSON.stringify(game),version,Date.now(),id,row.version).run();
      if(saved.meta.changes)return response({game:publicGame(game,category,0,version)});
    }
    return fail('تزامنت محاولتان. جرّب مرة ثانية.',409);
  }catch(error){console.error('game_write_failed',error);return fail('تعذر الاتصال. ما انخصمت محاولة.',503);}
}
