'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpLeft, Check, CheckCheck, ChevronDown, CircleHelp, Dices, Film, Gamepad2, Globe2, LoaderCircle, Plus, Trash2, Search, Sparkles, Trophy, Users, UtensilsCrossed, X, Zap } from 'lucide-react';
import type { Category, PublicGame } from '../lib/game';
import { readLocalRound, requestLocalRound } from '../lib/browser-game';
type CategoryInfo = Omit<Category, 'answers' | 'distractors'>;
type Connection = { id: string; token: string };
const n = (v: number) => v.toLocaleString('ar-EG');
const STORAGE = 'jeeb-ten-round-v3';
function Mark({ small = false }: { small?: boolean }) { return <span className={`brand ${small ? 'small' : ''}`}><span className="brand-ten">10<span>✦</span></span><span>جيب <b>العشرة</b><small>تحدّي معلوماتك</small></span></span>; }
function CategoryIcon({ category }: { category: CategoryInfo }) {
  const text = category.group + ' ' + category.title;
  if (/أكل|مطابخ|طعام|حلوي|جبن|فواكه/.test(text)) return <UtensilsCrossed />;
  if (/لعب|ألعاب|العاب|تقنية/.test(text)) return <Gamepad2 />;
  if (/فيلم|أفلام|مسلسل|أنمي|ترفيه/.test(text)) return <Film />;
  if (/رياض|كرة|تنس|سائق|أولمبي|NBA/.test(text)) return <Trophy />;
  return <Globe2 />;
}
function Mistakes({ count }: { count: number }) { return <span className="mistakes" aria-label={`${count} من 5 أخطاء`}>{[0,1,2,3,4].map(i=><span key={i} className={i<count?'used':''}>{i<count?<X size={12} strokeWidth={3}/>:<span/>}</span>)}</span>; }

export default function Home({ categories }: { categories: CategoryInfo[] }) {
  const [query, setQuery] = useState(''), [group, setGroup] = useState('خفيفة وجديدة');
  const [selected, setSelected] = useState<CategoryInfo | null>(null), [mode, setMode] = useState<'solo'|'teams'>('solo');
  const [teamNames,setTeamNames]=useState(['','']);
  const [rosters,setRosters]=useState<string[][]>([['',''],['','']]);
  const [rules,setRules]=useState(false), [sourceOpen,setSourceOpen]=useState(false);
  const [game,setGame]=useState<PublicGame|null>(null), [connection,setConnection]=useState<Connection|null>(null);
  const [view,setView]=useState<'home'|'game'>('home'), [guess,setGuess]=useState('');
  const [busy,setBusy]=useState(false), [error,setError]=useState('');
  const inputRef=useRef<HTMLInputElement>(null);
  const groups=[...new Set(['الكل','خفيفة وجديدة','العالم العربي',...categories.map(c=>c.group)])];
  const filtered=categories.filter(c=>(group==='الكل'||(group==='خفيفة وجديدة'&&c.difficulty==='easy')||(group==='العالم العربي'&&c.region==='arab')||c.group===group)&&(!query||`${c.title} ${c.group} ${c.description}`.toLowerCase().includes(query.toLowerCase()))).sort((a,b)=>Number(b.difficulty==='easy')-Number(a.difficulty==='easy')||a.id-b.id);
  const active=categories.find(c=>c.id===game?.categoryId);
  async function readRound(conn: Connection) { return readLocalRound(conn); }
  useEffect(()=>{
    let live=true;
    let saved:Connection|null=null; try{saved=JSON.parse(localStorage.getItem(STORAGE)||'null');}catch{}
    if(saved?.id&&saved.token){ setConnection(saved); readRound(saved).then(g=>{if(live){setGame(g);if(g.mode==='teams'){setTeamNames(g.players.map(p=>p.name));setRosters(g.players.map(p=>p.members));}}}).catch(()=>{if(live){setConnection(null);localStorage.removeItem(STORAGE);}}); }
    return()=>{live=false;};
  },[]);
  useEffect(()=>{if(view==='game'&&game?.canPlay&&!busy)inputRef.current?.focus();},[view,game?.current,busy]);
  useEffect(()=>{if(selected||rules){const listener=(e:KeyboardEvent)=>{if(e.key==='Escape'){setSelected(null);setRules(false);}};window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener);}},[selected,rules]);
  useEffect(()=>{
    if(!selected&&!rules)return;
    const previous=document.activeElement as HTMLElement|null;
    const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    const dialog=document.querySelector<HTMLElement>('[role="dialog"]');
    const focusable=()=>Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),a[href]')||[]);
    focusable()[0]?.focus();
    const trap=(event:KeyboardEvent)=>{if(event.key!=='Tab')return;const items=focusable();const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}};
    document.addEventListener('keydown',trap);
    return()=>{document.body.style.overflow=oldOverflow;document.removeEventListener('keydown',trap);previous?.focus();};
  },[selected,rules]);
  async function request(action: string, body: Record<string, unknown>, conn=connection) { return requestLocalRound(action, { ...body, requestId: crypto.randomUUID() }, conn); }
  function remember(data:{game:PublicGame;token?:string}) {
    setGame(data.game);setView('game');setGuess('');setSourceOpen(false);
    if(data.token){const conn={id:data.game.id,token:data.token};setConnection(conn);localStorage.setItem(STORAGE,JSON.stringify(conn));}
    setSelected(null);setError('');
    if(data.game.mode==='teams'){setTeamNames(data.game.players.map(p=>p.name));setRosters(data.game.players.map(p=>p.members));}
    if(window.location.search)window.history.replaceState({},'',window.location.pathname);
    window.scrollTo({top:0,behavior:'smooth'});
  }
  async function createRound(category=selected, chosenMode=mode) {
    if(!category||busy)return;
    if(chosenMode==='teams'&&(teamNames.some(s=>!s.trim())||rosters.some(a=>!a.length||a.some(s=>!s.trim())))){setError('اكتب اسم كل فريق وأسماء لاعبيه، أو احذف الخانات الفارغة.');return;}
    setBusy(true);setError('');
    try{remember(await request('create',{categoryId:category.id,mode:chosenMode,names:teamNames,members:rosters},null));}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  async function submit(action='guess') {
    if(!game||!connection||busy||(!guess.trim()&&action==='guess'))return;setBusy(true);setError('');
    try{const result=await request(action,{id:game.id,guess});setGame(result.game);if(action!=='cancel')setGuess('');}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  function backHome(){setView('home');setError('');window.scrollTo({top:0,behavior:'smooth'});}
  return <div className="app-shell" dir="rtl">
    <header className="site-header"><div className="nav-wrap">
      <button className="brand-button" onClick={backHome} aria-label="جيب العشرة، الرئيسية"><Mark/></button>
      <nav aria-label="التنقل الرئيسي"><button className={view==='home'?'nav-link active':'nav-link'} onClick={backHome}>الكاتاجوري <span>{n(categories.length)}</span></button><button className="nav-link how-link" onClick={()=>setRules(true)}>كيف تلعب؟</button></nav>
      <a className="room-button" href="#categories" onClick={()=>{setView('home');setMode('teams');setError('');}}><Users size={17}/><span>فريق ضد فريق</span><ArrowUpLeft size={15}/></a>
    </div></header>
    {view==='home'?<main>
      <section className="hero page-width"><div className="hero-copy"><div className="eyebrow"><span className="live-dot"/> معرفة، تخمين، وشوية تحدّي</div>
        <h1>تعرف العشرة؟<br/><span>ورّنا شطارتك.</span></h1><p>اختر كاتاجوري، واكشف قائمة التوب 10.<br/>خمس غلطات بس… كم اسم تقدر تجيب؟</p>
        <div className="hero-actions"><a className="primary-button" href="#categories">اختار التحدّي <ArrowLeft size={19}/></a><button className="text-button" onClick={()=>{if(categories.length){setSelected(categories[Math.floor(Math.random()*categories.length)]);setError('');}}}><Dices size={19}/> فاجئني</button></div>
        <div className="hero-facts"><span><span>{categories.length}</span> كاتاجوري</span><i/><span><span>10</span> مراكز مخفية</span><i/><span><span>5</span> غلطات</span></div></div>
        <div className="hero-art" aria-hidden="true"><span className="orbit orbit-one"/><span className="orbit orbit-two"/><div className="floating-label label-one"><Sparkles size={15}/> صح! بالمركز التاسع</div>
          <div className="sample-board"><div className="sample-heading"><span className="tiny-label">التحدّي عليك</span><span>TOP <b>10</b></span></div><div className="sample-title">عشرة أسماء. قدّها؟</div><div className="sample-slots">{Array.from({length:10},(_,i)=><div key={i} className={i===1||i===8?'sample-slot sample-found':'sample-slot'}><span>{n(i+1)}</span><b>{i===1?'إجابة صح':i===8?'وهذي بعد!':'؟ ؟ ؟ ؟'}</b>{i===1||i===8?<Check size={13}/>:<i/>}</div>)}</div><div className="sample-bottom"><Mistakes count={1}/><span>باقي لك كثير ✦</span></div></div>
          <div className="floating-label label-two"><Users size={18}/> فريق ضد فريق</div><span className="art-spark spark-one">✦</span><span className="art-spark spark-two">✧</span></div>
      </section>
      {game&&game.status!=='finished'&&<div className="resume page-width"><div><Zap size={20}/><span>عندك تحدّي ما خلصته <b>{active?.title}</b></span></div><button onClick={()=>setView('game')}>كمّل الجولة <ArrowLeft size={17}/></button></div>}
      <section className="catalog page-width" id="categories"><div className="section-top"><div><span className="eyebrow">كل مرّة، تحدّي جديد</span><h2>وش جوّك اليوم؟</h2><p>شخصيات أيقونية، أكلات مشهورة، ومعالم من العالم العربي وحول العالم.</p></div><label className="search"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="دوّر على كاتاجوري..." aria-label="ابحث في الكاتاجوري"/>{query&&<button onClick={()=>setQuery('')} aria-label="مسح البحث"><X size={16}/></button>}</label></div>
        <div className="filter-row" role="group" aria-label="تصفية الكاتاجوري">{groups.map(g=><button key={g} className={g===group?'filter selected':'filter'} onClick={()=>setGroup(g)}>{g}{g==='الكل'&&<span>{n(categories.length)}</span>}</button>)}</div>
        <div className="catalog-meta"><span>{n(filtered.length)} كاتاجوري بانتظارك</span><span>مواضيع متنوعة لكل الأذواق <CheckCheck size={15}/></span></div>
        <div className="category-grid">{filtered.map(c=><button key={c.id} className={`category-card tone-${c.id%6}`} onClick={()=>{setSelected(c);setError('');}}><div className="card-top"><span className="category-icon"><CategoryIcon category={c}/></span><span className="category-index">{String(c.id).padStart(2,'0')}</span></div><span className="card-group">{c.group}</span><h3>{c.title}</h3><div className="card-bottom"><span>اكتشف العشرة</span><span className="card-arrow"><ArrowUpLeft size={18}/></span></div></button>)}</div>
        {!filtered.length&&<div className="empty"><Search size={28}/><h3>ما لقينا كاتاجوري بهالاسم</h3><p>جرّب كلمة ثانية أو اختار «الكل».</p><button className="text-button" onClick={()=>{setQuery('');setGroup('الكل');}}>اعرض الكل</button></div>}
      </section>
    </main>:game&&active?<main className="game-page page-width">
      <div className="game-topline"><button className="back-link" onClick={backHome}><ArrowRight size={17}/> الكاتاجوري</button><span className="mode-label">{game.mode==='solo'?<><span className="live-dot"/> لعب فردي</>:<><Users size={15}/> فريق ضد فريق · نفس الجهاز</>}</span><button className="back-link" onClick={()=>setRules(true)}><CircleHelp size={17}/> القواعد</button></div>
      <section className="game-card"><div className="game-heading"><span className="category-chip"><CategoryIcon category={active}/>{active.group}</span><h1>{active.title}</h1><button className="source-toggle" onClick={()=>setSourceOpen(!sourceOpen)} aria-expanded={sourceOpen}>{active.source.title} · {active.source.asOf}<ChevronDown size={13}/></button>{sourceOpen&&<div className="source-details"><p>{active.metric}</p><a href={active.source.url} target="_blank" rel="noreferrer">{active.rankingType==='editorial'?'مرجع الأسماء':'اطّلع على المصدر'} <ArrowUpLeft size={13}/></a><small>{active.rankingType==='editorial'?'المراكز مرتبة خصيصًا لهذا التحدّي، والمرجع يوضّح أسماء العناصر ومعلوماتها.':'هذه الجولة تعتمد نسخة القائمة الموضحة أعلاه.'}</small></div>}</div>
        <>
          {game.mode==='teams'&&<div className="players-row teams-row">{game.players.map((p,i)=><div key={i} className={`player-info team-info ${game.current===i&&game.status==='playing'?'current':''}`}><div className="team-heading"><span className={`avatar player-${i}`}>{p.name.slice(0,1)}</span><div><b>{p.name}</b><span>{game.status==='finished'?'انتهت الجولة':game.current===i?`الدور على ${p.activeMember}`:'ينتظر دوره'}</span></div><Mistakes count={p.errors}/></div><div className="team-roster">{p.members.map((member,j)=><span key={j} className={game.current===i&&p.activeMemberIndex===j&&game.status==='playing'?'member-active':''}>{member}</span>)}</div></div>)}</div>}
          {game.status==='playing'&&<form className="guess-form" onSubmit={e=>{e.preventDefault();submit();}}><input ref={inputRef} value={guess} onChange={e=>setGuess(e.target.value)} disabled={busy||!game.canPlay} maxLength={120} autoComplete="off" placeholder={game.mode==='teams'?`إجابة ${game.players[game.current].activeMember}...`:'اكتب إجابتك هنا...'} aria-label="إجابتك"/><button type="submit" disabled={busy||!game.canPlay||!guess.trim()}>{busy?<LoaderCircle size={19} className="spin"/>:<>جرّب <ArrowLeft size={17}/></>}</button></form>}
          <div className={`notice ${game.notice?.kind||''}`} role="status" aria-live="polite">{error?<span className="error-inline">{error}</span>:game.notice?<><span className="notice-icon">{game.notice.kind==='correct'?<Check size={16}/>:game.notice.kind==='wrong'?<X size={16}/>:<CircleHelp size={16}/>}</span><span>{game.notice.text}</span>{game.notice.kind==='suggest'&&game.canPlay&&<span className="suggest-actions"><button disabled={busy} onClick={()=>submit('confirm')}>نعم، أقصدها</button><button disabled={busy} onClick={()=>submit('cancel')}>أعدّل إجابتي</button></span>}</>:<span>اكتب أي اسم تتوقعه. لو صح، ينكشف مركزه.</span>}</div>
          <div className="round-meta"><div className="progress-copy"><b>{n(game.foundCount)}</b><span> من {n(10)} انكشفت</span></div>{game.mode==='solo'?<div className="error-count"><span>الأخطاء</span><Mistakes count={game.players[0].errors}/></div>:<span className="muted-small">النتيجة في النهاية</span>}</div><div className="progress-track" role="progressbar" aria-label="الإجابات المكتشفة" aria-valuenow={game.foundCount} aria-valuemin={0} aria-valuemax={10}><span style={{width:`${game.foundCount*10}%`}}/></div>
          <div className="answer-board">{game.slots.map(slot=><div key={slot.rank} className={`answer-slot ${slot.found?'revealed':game.status==='finished'?'missed':'hidden'} ${slot.found&&game.mode!=='solo'?`owned-${slot.player}`:''}`}><span className="rank">{n(slot.rank)}</span><span className="answer-name">{slot.name||'؟ ؟ ؟ ؟ ؟'}</span><span className="slot-state">{slot.found?<Check size={17}/>:game.status==='finished'?<X size={17}/>:null}</span>{slot.found&&game.mode!=='solo'&&<span className={`owner-dot player-${slot.player}`} title={`${game.players[slot.player!].name} · ${slot.member||''}`}/>}</div>)}</div>
          {game.status==='finished'&&game.results&&<section className={`result-card ${game.mode==='solo'&&game.results.won?'success':''}`}><span className="result-symbol">{game.mode==='solo'?(game.results.won?<Trophy size={27}/>:<CheckCheck size={27}/>):<Trophy size={27}/>}</span><div className="result-intro"><span className="eyebrow">خلص التحدّي</span><h2>{game.mode==='solo'?(game.results.won?'جبت العشرة!':'انتهت المحاولات'):(game.results.winner===null?'تعادل!':`الفوز لـ ${game.players[game.results.winner].name}`)}</h2><p>{game.mode==='solo'?`عرفت ${n(game.foundCount)} من ${n(10)}. الإجابات اللي فاتتك ظاهرة بشفافية وعلامة ×.`:game.reason==='mistakes'?'حُسم التحدّي بعد وصول أحد الفريقين إلى خمس غلطات.':'حُسم التحدّي بمجموع المراكز المكتشفة.'}</p></div>
            {game.mode!=='solo'&&<><div className="final-scores">{game.results.totals.map((p,i)=><div key={i} className={i===game.results!.winner?'winner':''}><b>{p.name}</b><small>{p.members.join(' · ')}</small><span><strong>{n(p.score)}</strong> نقطة</span><small>جابوا {n(p.found)} إجابات</small></div>)}</div><p className="score-rule">قيمة الإجابة = مركزها: المركز التاسع ٩ نقاط، والأول نقطة.</p></>}
            <div className="result-actions"><button className="primary-button" disabled={busy} onClick={()=>createRound(active,game.mode)}>نفس الكاتاجوري <ArrowLeft size={17}/></button><button className="secondary-button" onClick={backHome}>تحدّي ثاني</button></div></section>}
          {game.status==='finished'&&game.players.some(p=>p.wrong.length>0)&&<div className="wrong-history"><span>المحاولات الخاطئة</span><div>{game.players.flatMap((p,i)=>p.wrong.map((w,j)=><span key={`${i}-${j}`} title={p.name}><X size={12}/>{w}</span>))}</div></div>}
          <div className="board-footnote"><span>✦</span>{game.status==='finished'?'الخانات الباهتة هي الإجابات اللي ما انكشفت.':'الأسماء القريبة نراجعها معك. والأجزاء نطلب منك تحددها.'}</div>
        </></section>
    </main>:null}
    <footer className="site-footer page-width"><Mark small/><span>المعرفة حلوة. والتحدّي أحلى.</span><button onClick={()=>setRules(true)}>كيف تلعب؟ <ArrowUpLeft size={14}/></button></footer>
    {selected&&<div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget&&!busy)setSelected(null);}}><section className={`modal ${mode==='teams'?'team-modal':''}`} role="dialog" aria-modal="true" aria-labelledby="mode-title"><button className="close-button" aria-label="إغلاق" onClick={()=>setSelected(null)}><X size={21}/></button><span className="modal-icon"><CategoryIcon category={selected}/></span><span className="eyebrow">جاهزين تكشفون العشرة؟</span><h2 id="mode-title">{selected.title}</h2><p className="modal-description">{selected.description||selected.metric}</p><div className="mode-options two-modes"><button className={mode==='solo'?'selected':''} onClick={()=>{setMode('solo');setError('');}}><span>✦</span><b>فردي</b><small>أنت والعشرة</small></button><button className={mode==='teams'?'selected':''} onClick={()=>{setMode('teams');setError('');}}><Users size={22}/><b>فريق ضد فريق</b><small>على نفس الجهاز</small></button></div>{mode==='teams'&&<div className="team-setup">{teamNames.map((team,i)=><fieldset key={i} className={`team-editor editor-${i}`}><legend>الفريق {i===0?'الأول':'الثاني'}</legend><label className="field-label">اسم الفريق<input aria-label={`اسم الفريق ${i===0?'الأول':'الثاني'}`} value={team} onChange={e=>setTeamNames(old=>old.map((v,j)=>j===i?e.target.value:v))} placeholder="" maxLength={24}/></label><div className="members-heading"><b>اللاعبون</b><span>{n(rosters[i].length)} لاعبين</span></div>{rosters[i].map((member,j)=><div key={j} className="member-input"><span>{n(j+1)}</span><input aria-label={`اسم اللاعب ${j+1} في الفريق ${i===0?'الأول':'الثاني'}`} value={member} onChange={e=>setRosters(old=>old.map((a,k)=>k===i?a.map((v,l)=>l===j?e.target.value:v):a))} placeholder={`اسم اللاعب ${n(j+1)}`} maxLength={24}/><button disabled={rosters[i].length===1} aria-label={`حذف اللاعب ${j+1} من الفريق ${i===0?'الأول':'الثاني'}`} onClick={()=>setRosters(old=>old.map((a,k)=>k===i?a.filter((_,l)=>l!==j):a))}><Trash2 size={15}/></button></div>)}<button className="add-member" disabled={rosters[i].length>=30} onClick={()=>setRosters(old=>old.map((a,j)=>j===i?[...a,'']:a))}><Plus size={16}/> أضف لاعب للفريق {i===0?'الأول':'الثاني'}</button></fieldset>)}</div>}<div className="mode-explainer"><CircleHelp size={16}/><p>{mode==='solo'?'اكشف العشرة قبل خمس غلطات. صح ومركزها، بدون نقاط.':'نفس القائمة للفريقين. الأدوار تتناوب بين الفرق ولاعبيها، والنتيجة تظهر في النهاية. خمس غلطات تخسّر الفريق.'}</p></div><div className="modal-source">{'المصدر: '+selected.source.title}<span>{selected.source.asOf}</span></div>{error&&<p className="modal-error" role="alert">{error}</p>}<button className="primary-button full" disabled={busy} onClick={()=>createRound()}>{busy?<><LoaderCircle className="spin" size={18}/> لحظة...</>:<>خلّنا نبدأ <ArrowLeft size={18}/></>}</button></section></div>}

    {rules&&<div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setRules(false);}}><section className="modal rules-modal" role="dialog" aria-modal="true" aria-labelledby="rules-title"><button className="close-button" aria-label="إغلاق" onClick={()=>setRules(false)}><X size={21}/></button><span className="eyebrow">اللعبة بسيطة</span><h2 id="rules-title">عشرة أسماء. خمس غلطات.</h2><ol><li><b>اختار كاتاجوري</b><p>اختاروا من 200 كاتاجوري. القوائم الإحصائية لها مصدر، وكل تحدٍّ يوضّح معيار ترتيب مراكزه.</p></li><li><b>اكتب أي إجابة تتوقعها</b><p>لو صح تنكشف في مركزها. مو لازم تبدأ بالأول.</p></li><li><b>غلطت؟ باقي لك فرصة</b><p>الخطأ الخامس ينهي الجولة. التكرار والتوضيح وتصحيح الاسم ما تخصم محاولات.</p></li><li><b>كوّن فريقك</b><p>سمّوا الفريقين وأضيفوا أسماء اللاعبين. تلعبون نفس القائمة على نفس الجهاز، وتتبدّل الأدوار بين الفرق واللاعبين. قيمة الإجابة رقم مركزها، والنتيجة تظهر بالنهاية. الخطأ الخامس يخسّر الفريق.</p></li></ol><button className="primary-button full" onClick={()=>setRules(false)}>واضحة، خلّنا نلعب <ArrowLeft size={17}/></button></section></div>}
  </div>;
}
