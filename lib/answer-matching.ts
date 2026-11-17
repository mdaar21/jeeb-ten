import rawGroups from '../data/answer-aliases.json' with {type:'json'};
import type {Entity} from './game.ts';
type AliasGroup={id:string;type:string;english:string[];aliases:string[]};
export function foldAnswer(value:string):string {
  const digits='٠١٢٣٤٥٦٧٨٩',persian='۰۱۲۳۴۵۶۷۸۹';
  const text=String(value).toLowerCase().normalize('NFKD').replace(/\p{M}/gu,'').replace(/ـ/g,'').replace(/[أإآٱ]/g,'ا').replace(/[ىی]/g,'ي').replace(/ک/g,'ك').replace(/ة/g,'ه');
  if(text.trim()==='x')return 'x';
  return text.replace(/[٠-٩]/g,c=>String(digits.indexOf(c))).replace(/[۰-۹]/g,c=>String(persian.indexOf(c)))
    .replace(/\b(viii|vii|iii|vi|iv|ii|ix|v|x)\b/g,s=>({ii:'2',iii:'3',iv:'4',v:'5',vi:'6',vii:'7',viii:'8',ix:'9',x:'10'}[s]||s))
    .replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
}
export const compact=(value:string)=>foldAnswer(value).replaceAll(' ','');
const groups=rawGroups as AliasGroup[],englishIndex=new Map<string,AliasGroup[]>();
for(const group of groups)for(const name of group.english){const k=compact(name),existing=englishIndex.get(k)||[];if(!existing.includes(group))englishIndex.set(k,[...existing,group]);}
function aliasGroup(entity:Entity,scope:string){
  const matches=(englishIndex.get(compact(entity.nameEn))||[]).filter(g=>g.type==='country'?scope==='countries':g.type==='club'?scope==='clubs':g.type==='person'?['athletes','actors','artists','football-managers','wwe-wrestlers'].includes(scope):g.type==='common'?['objects','ingredients','animals','plants','body','clothes','sports-equipment','minecraft-mobs'].includes(scope):true);
  if(matches.length===1)return matches[0];
  return matches.find(g=>g.aliases.some(a=>compact(a)===compact(entity.nameAr)));
}
export function identityFor(entity:Entity,scope:string){return(aliasGroup(entity,scope)?.id||compact(entity.nameEn||entity.nameAr))+(entity.year?':'+entity.year:'');}
const namesCache=new WeakMap<Entity,Map<string,string[]>>();
export function answerNames(entity:Entity,scope:string):string[]{
  const cached=namesCache.get(entity)?.get(scope);if(cached)return cached;
  const extra=aliasGroup(entity,scope)?.aliases||[],more:string[]=[];
  if(['objects','ingredients','animals','plants','body','clothes','sports-equipment'].includes(scope)){
    const irregular:Record<string,string>={mouse:'mice',tooth:'teeth',foot:'feet',child:'children',person:'people',knife:'knives',leaf:'leaves',fish:'fish',sheep:'sheep'};
    for(const name of [entity.nameEn,...extra].filter(n=>/^[a-z -]+$/i.test(n))){
      const word=name.toLowerCase();if(irregular[word])more.push(irregular[word]);else if(!/(s|ing)$/i.test(word))more.push(name+(/(ch|sh|x|z)$/.test(word)?'es':'s'));
    }
  }
  if(entity.series&&entity.part)more.push(`${entity.series} ${entity.part}`);
  if(entity.part&&/^\d+$/.test(entity.part)&&!/\d/.test(foldAnswer(entity.nameAr)))more.push(`${entity.nameAr} ${entity.part}`);
  if(entity.year)more.push(`${entity.nameAr} ${entity.year}`,`${entity.nameEn} ${entity.year}`);
  const names=[...new Set([entity.nameAr,entity.nameEn,...entity.aliases,...extra,...more].filter(Boolean).map(foldAnswer))];
  const cache=namesCache.get(entity)||new Map<string,string[]>();cache.set(scope,names);namesCache.set(entity,cache);return names;
}
export function looseForms(name:string):string[]{
  const forms:string[]=[];
  if(name.startsWith('the ')&&name.length>7)forms.push(name.slice(4));
  if(name.startsWith('ال')&&name.replaceAll(' ','').length>=6)forms.push(name.slice(2));
  if(name.split(' ').length>=2)forms.push('words:'+name.split(' ').sort().join(' '));
  return forms;
}
export type AnswerIndex={exact:Map<string,Entity[]>;loose:Map<string,Entity[]>};
const indexCache=new WeakMap<Entity[],AnswerIndex>();
export function answerIndex(pool:Entity[],scope:string):AnswerIndex{
  const existing=indexCache.get(pool);if(existing)return existing;
  const index:AnswerIndex={exact:new Map(),loose:new Map()};
  const add=(map:Map<string,Entity[]>,name:string,entity:Entity)=>{const entities=map.get(name)||[];if(!entities.includes(entity))map.set(name,[...entities,entity]);};
  for(const entity of pool)for(const name of answerNames(entity,scope)){add(index.exact,compact(name),entity);for(const alternative of looseForms(name))add(index.loose,alternative.startsWith('words:')?alternative:compact(alternative),entity);}
  indexCache.set(pool,index);return index;
}
export function editDistance(a:string,b:string,max:number):number{
  if(Math.abs(a.length-b.length)>max)return max+1;
  let previous=Array.from({length:b.length+1},(_,i)=>i),beforePrevious=previous;
  for(let i=1;i<=a.length;i++){const row=[i];let minimum=i;
    for(let j=1;j<=b.length;j++){row[j]=Math.min(previous[j]+1,row[j-1]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])row[j]=Math.min(row[j],beforePrevious[j-2]+1);minimum=Math.min(minimum,row[j]);}
    if(minimum>max)return max+1;beforePrevious=previous;previous=row;
  }return previous[b.length];
}
