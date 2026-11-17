import type { Category } from './game.ts';

export const SECTIONS = [
  { id:'daily', label:'حياة يومية', hint:'البيت والمدرسة وأشياء نستخدمها' },
  { id:'food', label:'أكل ومشروبات', hint:'أكلات ومكونات وحلويات' },
  { id:'games', label:'ألعاب وشخصيات', hint:'ألعاب الفيديو وعوالمها' },
  { id:'cartoons', label:'كرتون وأنمي', hint:'شخصيات وحكايات مشهورة' },
  { id:'screen', label:'أفلام ومسلسلات', hint:'السينما والتلفزيون' },
  { id:'sport', label:'رياضة', hint:'لاعبون وأندية وبطولات' },
  { id:'travel', label:'دول وسفر', hint:'دول ومدن ومعالم' },
  { id:'tech', label:'ماركات وتطبيقات', hint:'تقنية وشركات وعلامات' },
  { id:'nature', label:'علوم وطبيعة', hint:'حيوانات ونباتات وفضاء' },
  { id:'culture', label:'تاريخ وثقافة', hint:'موسيقى ولغات وتاريخ' },
] as const;
export type SectionId = typeof SECTIONS[number]['id'];
type CategoryInfo = Pick<Category,'id'|'title'|'group'> & {section?:string};
export function sectionFor(category:CategoryInfo):SectionId {
  if(SECTIONS.some(s=>s.id===category.section))return category.section as SectionId;
  const id=category.id;
  if(id<=100){
    if([3,8,9].includes(id))return 'games';
    if([4,5,6,12].includes(id))return 'cartoons';
    if([14,15,16,17,73,74,96,97,100].includes(id))return 'culture';
    if([18,61,62,63,64,68,69,70,71,72,76,77,78].includes(id))return 'tech';
    if(id<=20)return 'screen';
    if(id<=35)return 'sport';
    if(id<=45)return 'food';
    if((id>=54&&id<=60)||[65,66,67,75,99].includes(id)||(id>=86&&id<=95))return 'nature';
    return 'travel';
  }
  if((id>=101&&id<=113)||id===135)return 'games';
  if(id>=114&&id<=134)return 'cartoons';
  if((id>=136&&id<=147)||id===167)return 'screen';
  if((id>=148&&id<=151)||id===170)return 'culture';
  if((id>=152&&id<=155)||(id>=189&&id<=191)||id===200)return 'sport';
  if((id>=156&&id<=162)||id===169||(id>=171&&id<=183))return 'food';
  if((id>=163&&id<=166)||(id>=192&&id<=195))return 'travel';
  if(id===168||(id>=184&&id<=188))return 'tech';
  return 'nature';
}
export const sectionLabel=(category:CategoryInfo)=>SECTIONS.find(s=>s.id===sectionFor(category))!.label;
