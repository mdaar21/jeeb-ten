import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpLeft, Gamepad2, Globe2, MapPin, ShieldCheck, Users } from 'lucide-react';
import { GEO_META } from '../lib/geo-meta';
const GeoGame=lazy(()=>import('./GeoGame'));
const TopTen=lazy(async()=>{
  const [{default:Home},{configureLocalGame},response]=await Promise.all([import('./home'),import('../lib/browser-game'),fetch(import.meta.env.BASE_URL+'data/catalog.json')]);
  if(!response.ok)throw Error('تعذر تحميل القوائم.');
  const catalog=await response.json();configureLocalGame(catalog,localStorage);
  const categories=catalog.map(({answers,distractors,...category}:import('../lib/game').Category)=>category);
  return{default:({onGames}:{onGames:()=>void})=><Home categories={categories} onGames={onGames}/>};
});
type Route='games'|'top10'|'geo';
const fromHash=():Route=>location.hash==='#geo'?'geo':['#top10','#categories'].includes(location.hash)?'top10':'games';
export default function App(){
  const [route,setRoute]=useState<Route>(fromHash);
  useEffect(()=>{const change=()=>setRoute(fromHash());window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[]);
  useEffect(()=>{document.title=route==='geo'?'خمن الموقع | ألعاب الجلسة':route==='top10'?'جيب العشرة | تعرف العشرة؟':'جيب العشرة | ألعاب الجلسة';},[route]);
  function navigate(next:Route){location.hash=next;setRoute(next);window.scrollTo({top:0});}
  if(route!=='games')return <Suspense fallback={<div className="hub-loading"><Globe2 size={32}/><p>لحظة، نجهّز لك اللعبة…</p></div>}>{route==='geo'?<GeoGame onGames={()=>navigate('games')}/>:<TopTen onGames={()=>navigate('games')}/>}</Suspense>;
  return <div className="games-hub">
    <header className="hub-header page-width"><a href="#games" className="hub-brand"><span><Gamepad2 size={25}/></span><b>ألعاب الجلسة<small>جيب العشرة وأكثر</small></b></a><span className="hub-header-note"><Users size={16}/> نفس الجهاز، كل الجلسة</span><span className="hub-game-count">معلومات ومواقع</span></header>
    <main className="page-width"><section className="hub-intro"><span className="hub-eyebrow"><i/> جمّعهم، والتحدّي علينا</span><h1>وش نلعب <span>اليوم؟</span></h1><p>كل لعبة لها جوّها. اختار تحدّيك والعب لحالك،<br className="hub-desktop-break"/> أو كوّنوا فريقين وخلّوا الحماس يبدأ.</p><div className="hub-intro-line"><span><Gamepad2 size={16}/> ألعاب مختلفة</span><i/><span><Users size={16}/> فردي وفرق</span><i/><span><ShieldCheck size={16}/> بدون تسجيل</span></div></section>
      <section className="hub-game-grid" aria-label="اختر اللعبة">
        <button className="hub-game-card hub-ten-card" onClick={()=>navigate('top10')}><div className="hub-card-heading"><span className="hub-card-icon"><Gamepad2 size={22}/></span><span className="hub-tag">تحدّي معلومات</span><span className="hub-card-index">01</span></div><div className="hub-ten-preview" aria-hidden="true"><div className="hub-ten-preview-top"><span>قدّها؟</span><b>TOP <strong>10</strong></b></div>{[[1,'؟ ؟ ؟ ؟',false],[4,'صح، بالمركز الرابع!',true],[7,'؟ ؟ ؟ ؟',false]].map(([rank,label,found])=><div className={found?'found':''} key={Number(rank)}><span>{Number(rank).toLocaleString('ar-EG')}</span><b>{label}</b><i>{found?'✓':'—'}</i></div>)}<small>عشرة أسماء. خمس فرص.</small></div><div className="hub-game-copy"><div className="hub-card-meta"><span>٢٠٠ كاتاجوري</span><span>فردي وفرق</span></div><h2>جيب العشرة</h2><p>اكشف أسماء التوب 10، وخلك قدّها قبل خمس غلطات.</p><div className="hub-card-launch"><span>ادخل التحدّي</span><span><ArrowUpLeft size={21}/></span></div></div></button>
        <button className="hub-game-card hub-geo-card" onClick={()=>navigate('geo')}><div className="hub-card-heading"><span className="hub-card-icon"><Globe2 size={23}/></span><span className="hub-tag">تحدّي جغرافي</span><span className="hub-card-index">02</span></div><div className="hub-globe-preview" aria-hidden="true"><img src={import.meta.env.BASE_URL+'maps/globe-art.svg'} alt=""/><span><MapPin size={14}/> دبوسك وين؟</span></div><div className="hub-game-copy"><div className="hub-card-meta"><span>{GEO_META.total.toLocaleString('ar-EG')} مكان مختلف</span><span>فردي وفرق</span></div><h2>خمن الموقع</h2><p>لفّ الكرة الأرضية وحدد المكان. كل ما قربت، زادت نقاطك.</p><div className="hub-card-launch"><span>ابدأ الرحلة</span><span><ArrowUpLeft size={21}/></span></div></div></button>
      </section>
      <div className="hub-bottom-note"><span>السؤال عليك… والمنافسة بينكم.</span><span>بدون تحميل تطبيق <ArrowLeft size={14}/></span></div>
    </main><footer className="hub-footer page-width"><span>ألعاب الجلسة</span><small>للحماس، وللضحك، ولـ «كنت أعرفها!»</small></footer>
  </div>;
}
