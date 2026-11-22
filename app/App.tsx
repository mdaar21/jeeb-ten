import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowUpLeft, Check, Gamepad2, Globe2, MapPin, ShieldCheck, Users } from 'lucide-react';
import { CATALOG_META } from '../lib/catalog-meta';
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
    <header className="hub-header page-width"><a href="#games" className="hub-brand" aria-label="ألعاب الجلسة"><span className="hub-brand-mark"><Gamepad2 size={26}/></span><b>ألعاب الجلسة<small>جيب العشرة وأكثر</small></b></a><span className="hub-header-note"><Users size={17}/> نفس الجهاز، كل الجلسة</span></header>
    <main className="page-width"><section className="hub-intro"><div className="hub-fascia"><span className="bulbs" aria-hidden="true"/><h1>وش نلعب <span>اليوم؟</span></h1><p>كل لعبة لها جوّها. اختار تحدّيك والعب لحالك، أو كوّنوا فريقين وخلّوا الحماس يبدأ.</p><span className="bulbs" aria-hidden="true"/></div><ul className="hub-intro-line"><li><Gamepad2 size={18}/> لعبتين مختلفتين</li><li><Users size={18}/> فردي وفرق</li><li><ShieldCheck size={18}/> بدون تسجيل</li></ul></section>
      <section className="hub-game-grid" aria-label="اختر اللعبة">
        <button className="hub-game-card hub-ten-card" onClick={()=>navigate('top10')}><span className="awning" aria-hidden="true"/><span className="hub-card-heading"><span className="hub-tag">تحدّي معلومات</span></span><span className="hub-game-copy"><span className="hub-card-meta"><span>{CATALOG_META.total.toLocaleString('ar-EG')} كاتاجوري</span><span>فردي وفرق</span></span><h2>جيب العشرة</h2><p>اكشف أسماء التوب 10، وخلك قدّها قبل خمس غلطات.</p></span><span className="hub-ten-preview" aria-hidden="true"><span className="hub-ten-preview-top"><span>قدّها؟</span><b>TOP <strong>10</strong></b></span>{[[1,'؟ ؟ ؟ ؟',false],[4,'صح، بالمركز الرابع!',true],[7,'؟ ؟ ؟ ؟',false]].map(([rank,label,found])=><span className={found?'found':''} key={Number(rank)}><span>{Number(rank).toLocaleString('ar-EG')}</span><b>{label}</b><i>{found?<Check size={15} strokeWidth={3}/>:null}</i></span>)}<small>عشرة أسماء. خمس فرص.</small></span><span className="hub-card-launch"><span>ادخل التحدّي</span><span className="hub-launch-arrow"><ArrowUpLeft size={22}/></span></span></button>
        <button className="hub-game-card hub-geo-card" onClick={()=>navigate('geo')}><span className="awning" aria-hidden="true"/><span className="hub-card-heading"><span className="hub-tag">تحدّي جغرافي</span></span><span className="hub-game-copy"><span className="hub-card-meta"><span>{GEO_META.total.toLocaleString('ar-EG')} مكان مختلف</span><span>فردي وفرق</span></span><h2>خمن الموقع</h2><p>لفّ الكرة الأرضية وحدد المكان. كل ما قربت، زادت نقاطك.</p></span><span className="hub-globe-preview" aria-hidden="true"><img src={import.meta.env.BASE_URL+'maps/globe-art.svg'} alt=""/><span><MapPin size={15}/> دبوسك وين؟</span></span><span className="hub-card-launch"><span>ابدأ الرحلة</span><span className="hub-launch-arrow"><ArrowUpLeft size={22}/></span></span></button>
      </section>
      <p className="hub-bottom-note">السؤال عليك… والمنافسة بينكم. بدون تحميل تطبيق.</p>
    </main><footer className="hub-footer page-width"><span>ألعاب الجلسة</span><small>للحماس، وللضحك، ولـ «كنت أعرفها!»</small></footer>
  </div>;
}
