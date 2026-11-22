import { useMemo, useRef, useState, type PointerEvent } from 'react';
import { geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import { Crosshair, Minus, Plus, RotateCcw } from 'lucide-react';
import type { CountryFeature, GeoGuess, Point } from '../lib/geo';

type Props={countries:CountryFeature[];selected:Point|null;onSelect:(point:Point)=>void;guesses?:GeoGuess[];answer?:Point;countryId?:string;locked?:boolean};
export default function GeoGlobe({countries,selected,onSelect,guesses=[],answer,countryId,locked=false}:Props){
  const [rotation,setRotation]=useState<[number,number]>(answer?[-answer[0],-answer[1]]:[-28,-20]);
  const [zoom,setZoom]=useState(answer?1.3:1);
  const svg=useRef<SVGSVGElement>(null),drag=useRef<{x:number;y:number;rotation:[number,number];moved:boolean}|null>(null);
  const projection=useMemo(()=>geoOrthographic().translate([360,300]).scale(260*zoom).rotate(rotation).clipAngle(90),[rotation,zoom]);
  const path=useMemo(()=>geoPath(projection),[projection]);
  const shapes=useMemo(()=>countries.map(c=>({id:String(c.id),d:path(c)||''})),[countries,path]);
  const center=projection.invert!([360,300]) as Point;
  const visible=(point:Point)=>geoDistance(center,point)<Math.PI/2-.015;
  function pointer(event:PointerEvent<SVGSVGElement>){
    const bounds=svg.current!.getBoundingClientRect();return[(event.clientX-bounds.left)*720/bounds.width,(event.clientY-bounds.top)*600/bounds.height] as Point;
  }
  function choose(point:Point){if(locked)return;const dx=point[0]-360,dy=point[1]-300;if(dx*dx+dy*dy>(260*zoom)**2)return;const value=projection.invert!(point);if(value&&value.every(Number.isFinite))onSelect([Math.max(-180,Math.min(180,value[0])),Math.max(-90,Math.min(90,value[1]))]);}
  function down(event:PointerEvent<SVGSVGElement>){if(event.button!==0)return;event.currentTarget.setPointerCapture(event.pointerId);drag.current={x:event.clientX,y:event.clientY,rotation:[...rotation],moved:false};}
  function move(event:PointerEvent<SVGSVGElement>){const start=drag.current;if(!start)return;const dx=event.clientX-start.x,dy=event.clientY-start.y;if(Math.hypot(dx,dy)>5)start.moved=true;if(start.moved)setRotation([start.rotation[0]+dx/(zoom*2.7),Math.max(-85,Math.min(85,start.rotation[1]-dy/(zoom*2.7)))]);}
  function up(event:PointerEvent<SVGSVGElement>){const start=drag.current;drag.current=null;if(start&&!start.moved)choose(pointer(event));}
  function marker(point:Point,color:string,label:string,key:string){const position=projection(point);if(!position||!visible(point))return null;return <g key={key} transform={`translate(${position[0]},${position[1]})`} className="globe-pin"><circle r="13" fill={color} opacity=".18"/><circle r="5.5" fill={color} stroke="#0b0e14" strokeWidth="2.5"/><text y="-19" textAnchor="middle">{label}</text></g>;}
  return <div className="globe-panel">
    <div className="globe-top"><span>كرة أرضية تفاعلية</span><span>{locked?'الموقع الصحيح والتخمينات':'اسحب لتلفّها، واضغط لتحدد'}</span></div>
    <svg ref={svg} viewBox="0 0 720 600" className="geo-globe" tabIndex={0} role="application" aria-label="الكرة الأرضية. اسحب للتدوير واضغط لوضع الدبوس. بالكيبورد: الأسهم للتدوير، زائد وناقص للتقريب، وإدخال لتحديد المنتصف." onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{drag.current=null;}} onKeyDown={event=>{const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','Enter'];if(!keys.includes(event.key))return;event.preventDefault();if(event.key==='Enter'){if(!locked)onSelect(center);}else if(['+','='].includes(event.key))setZoom(z=>Math.min(7,z*1.3));else if(event.key==='-')setZoom(z=>Math.max(.85,z/1.3));else setRotation(([x,y])=>[x+(event.key==='ArrowLeft'?12:event.key==='ArrowRight'?-12:0),Math.max(-85,Math.min(85,y+(event.key==='ArrowUp'?-10:event.key==='ArrowDown'?10:0)))]);}}>
      <defs><radialGradient id="ocean"><stop stopColor="#2a3f66"/><stop offset=".72" stopColor="#1b2b4a"/><stop offset="1" stopColor="#101b31"/></radialGradient><radialGradient id="globeShade" cx="34%" cy="28%"><stop stopColor="#ffffff" stopOpacity=".1"/><stop offset=".62" stopColor="#0b0e14" stopOpacity="0"/><stop offset="1" stopColor="#0b0e14" stopOpacity=".5"/></radialGradient><filter id="atmosphere"><feGaussianBlur stdDeviation="13"/></filter><clipPath id="globeClip"><circle cx="360" cy="300" r={260*zoom}/></clipPath></defs>
      <circle cx="360" cy="300" r={266*zoom} fill="#d6b36a" opacity=".08" filter="url(#atmosphere)"/>
      <g clipPath="url(#globeClip)"><circle cx="360" cy="300" r={260*zoom} fill="url(#ocean)"/>
        <path d={path(geoGraticule10())||''} fill="none" stroke="#9fb1d6" strokeWidth=".5" opacity=".18"/>
        {shapes.map(c=><path key={c.id} d={c.d} fill={c.id===countryId?'#d6b36a':'#3d5278'} stroke={c.id===countryId?'#fff3d1':'#1b2b4a'} strokeWidth={c.id===countryId?1.6:.65} className="globe-country"/>)}
        <circle cx="360" cy="300" r={260*zoom} fill="url(#globeShade)" pointerEvents="none"/>
        {guesses.filter(g=>g.distanceKm>1).map(g=><path key={`line-${g.team}`} d={path({type:'LineString',coordinates:[g.point,g.actual]})||''} fill="none" stroke={g.team===0?'#d6b36a':'#8fb4ff'} strokeDasharray="5 5" strokeWidth="2"/>)}
        {guesses.map(g=>marker(g.point,g.team===0?'#d6b36a':'#8fb4ff',guesses.length>1?`فريق ${g.team+1}`:'تخمينك',`guess-${g.team}`))}
        {answer&&!countryId&&marker(answer,'#f4e4b8','المكان الصحيح','answer')}
        {selected&&!locked&&marker(selected,'#d6b36a','دبوسك','selection')}
        {!locked&&<g className="globe-crosshair" pointerEvents="none"><path d="M350 300h7m6 0h7M360 290v7m0 6v7" stroke="#f2f4f8" strokeWidth="1.2" opacity=".6"/></g>}
      </g><circle cx="360" cy="300" r={260*zoom} fill="none" stroke="#3a4766" strokeWidth="1.5"/>
    </svg>
    <div className="globe-controls"><div><button aria-label="تقريب الكرة الأرضية" disabled={zoom>=7} onClick={()=>setZoom(z=>Math.min(7,z*1.4))}><Plus size={18}/></button><button aria-label="إبعاد الكرة الأرضية" disabled={zoom<=.85} onClick={()=>setZoom(z=>Math.max(.85,z/1.4))}><Minus size={18}/></button><button aria-label="إعادة عرض الكرة الأرضية" onClick={()=>{setRotation(answer?[-answer[0],-answer[1]]:[-28,-20]);setZoom(1);}}><RotateCcw size={16}/></button></div>{!locked&&<button className="center-pin" onClick={()=>onSelect(center)}><Crosshair size={15}/> حدد المنتصف</button>}</div>
    <div className="globe-regions" aria-label="انتقل إلى منطقة">{[['العالم العربي',-42,-23],['أوروبا',-15,-48],['آسيا',-110,-28],['الأمريكتان',90,-18],['أوقيانوسيا',-145,25]].map(([name,x,y])=><button key={name} onClick={()=>{setRotation([Number(x),Number(y)]);setZoom(1.35);}}>{name}</button>)}</div>
  </div>;
}
