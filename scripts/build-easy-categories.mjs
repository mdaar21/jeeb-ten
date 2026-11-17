import fs from 'node:fs';
const files=['a','b','c'].map(name=>`data/easy-categories-${name}.txt`);
const sections={daily:'حياة يومية',food:'أكل ومشروبات',nature:'علوم وطبيعة',games:'ألعاب وشخصيات',cartoons:'كرتون وأنمي',screen:'أفلام ومسلسلات',sport:'رياضة',travel:'دول وسفر',tech:'ماركات وتطبيقات'};
const references={
  vocabulary:['British Council — مفردات الحياة اليومية','https://learnenglish.britishcouncil.org/free-resources/vocabulary/a1-a2'],
  food:['موسوعة الأطعمة ومكوناتها','https://en.wikipedia.org/wiki/Lists_of_foods'],
  animals:['National Geographic — الحيوانات','https://www.nationalgeographic.com/animals'],
  games:['موسوعة ألعاب الفيديو','https://en.wikipedia.org/wiki/Lists_of_video_games'],
  minecraft:['Minecraft Wiki — الأدوات والكائنات','https://minecraft.wiki/w/Item'],
  mario:['Nintendo — شخصيات عالم ماريو','https://mario.nintendo.com/ca/characters/'],
  mariokart:['Nintendo — أدوات ماريو كارت','https://www.nintendo.com/my/switch/aabp/item/index.html'],
  sonic:['SEGA — شخصيات سونيك','https://sonic.sega.jp/SonicChannel/character/'],
  zelda:['Nintendo — عالم زيلدا','https://zelda.nintendo.com/'],
  clash:['Supercell — ألعاب كلاش','https://supercell.com/en/games/'],
  valorant:['Riot — عملاء فالورانت','https://playvalorant.com/en-us/agents/'],
  overwatch:['Blizzard — أبطال أوفرواتش','https://overwatch.blizzard.com/en-us/heroes/'],
  brawl:['Supercell — براول ستارز','https://supercell.com/en/games/brawlstars/'],
  gta:['Rockstar — سان أندرياس','https://www.rockstargames.com/games/sanandreas'],
  fortnite:['أدوات فورتنايت','https://fortnite.fandom.com/wiki/Items'],
  pixar:['Pixar — الأفلام والعوالم','https://www.pixar.com/films'],
  disney:['Disney — الأفلام والشخصيات','https://movies.disney.com/'],
  dreamworks:['DreamWorks — الأفلام والشخصيات','https://www.dreamworks.com/movies'],
  cartoons:['موسوعة شخصيات الأنيميشن','https://en.wikipedia.org/wiki/Lists_of_animated_television_series'],
  dc:['DC — الشخصيات','https://www.dc.com/characters'],
  marvel:['Marvel — الشخصيات','https://www.marvel.com/characters'],
  naruto:['ناروتو — الشخصيات','https://en.wikipedia.org/wiki/List_of_Naruto_characters'],
  onepiece:['ون بيس — الشخصيات','https://en.wikipedia.org/wiki/List_of_One_Piece_characters'],
  dragonball:['دراغون بول — الشخصيات','https://en.wikipedia.org/wiki/List_of_Dragon_Ball_characters'],
  pokemon:['Pokémon — الأنواع','https://www.pokemon.com/us/pokedex'],
  anime:['موسوعة أفلام الأنمي','https://en.wikipedia.org/wiki/Lists_of_anime'],
  screen:['موسوعة السينما والتلفزيون','https://en.wikipedia.org/wiki/Lists_of_films'],
  'arab-screen':['السينما — الأفلام والأعمال العربية','https://elcinema.com/'],
  football:['FIFA — عالم كرة القدم','https://www.fifa.com/'],
  sports:['اللجنة الأولمبية — الرياضات','https://www.olympics.com/en/sports/'],
  geography:['Natural Earth — أسماء الدول والمدن','https://www.naturalearthdata.com/downloads/'],
  travel:['دليل الطيران المدني','https://www.icao.int/'],
  apps:['موسوعة البرمجيات والتطبيقات','https://en.wikipedia.org/wiki/Lists_of_software'],
  brands:['موسوعة العلامات التجارية','https://en.wikipedia.org/wiki/Lists_of_brands'],
  music:['الآلات الموسيقية','https://en.wikipedia.org/wiki/Musical_instrument'],
  science:['Britannica — العلوم والطبيعة','https://www.britannica.com/science/science'],
};
const fold=s=>String(s).normalize('NFKD').replace(/\p{M}|ـ/gu,'').replace(/[أإآٱ]/g,'ا').replace(/[ىی]/g,'ي').replace(/ة/g,'ه').replace(/[^\p{L}\p{N}]/gu,'').toLowerCase();
const oldFiles=fs.readdirSync('data').filter(f=>/^lists-(?:01-35|36-70|71-100|101-135|136-170|171-200)\.json$/.test(f));
const old=oldFiles.flatMap(f=>JSON.parse(fs.readFileSync('data/'+f,'utf8'))),lexicon=new Map(),rows=[];
function remember(entity,domain=''){for(const name of [entity.nameAr,...(entity.aliases||[])])if(/[\u0600-\u06ff]/.test(name)){const k=fold(name);lexicon.set(k,[...(lexicon.get(k)||[]),{...entity,domain}]);}}
for(const category of old)for(const answer of [...category.answers,...(category.distractors||[])])remember(answer,category.domain||'');
for(const question of JSON.parse(fs.readFileSync('data/geo-bank.json','utf8')))remember({nameAr:question.name,nameEn:question.nameEn,aliases:[]},question.kind==='city'?'cities':question.kind==='country'?'countries':'landmarks');
for(const file of files){let metadata;for(const raw of fs.readFileSync(file,'utf8').split(/\r?\n/)){const line=raw.trim();if(!line)continue;if(line.startsWith('#')){metadata=line.slice(1).trim().split('|');continue;}const [title,answers]=line.split('::');if(!metadata||!answers)throw Error('Invalid row: '+line);const [section,domain,source]=metadata;rows.push({title,section,domain,source,answers:answers.split('|').map(value=>value.trim())});}}
if(rows.length!==300)throw Error(`Expected 300 authored topics, got ${rows.length}`);
for(const row of rows)for(const value of row.answers){const [nameAr,nameEn,aliases]=value.split('~');if(nameEn)remember({nameAr,nameEn,aliases:aliases?aliases.split('^'):[]},row.domain);}
const qualifiers={'cars-characters':'Cars','nemo-characters':'Finding Nemo','shrek-characters':'Shrek','kung-fu-panda-characters':'Kung Fu Panda','madagascar-characters':'Madagascar','ice-age-characters':'Ice Age','regular-show-characters':'Regular Show','ben10-characters':'Ben 10','tmnt-characters':'TMNT','disney-characters':'Disney','batman-characters':'DC','naruto-characters':'Naruto','one-piece-characters':'One Piece','dragon-ball-characters':'Dragon Ball'};
const missing=[],duplicates=[],sets=new Map(old.map(c=>[c.answers.map(a=>fold(a.nameEn)).sort().join('|'),c.title]));
const categories=rows.map((row,index)=>{
  const id=201+index,[sourceTitle,sourceUrl]=references[row.source]||[];if(!sections[row.section]||!sourceUrl)throw Error('Missing reference '+row.source);
  const answers=row.answers.map((value,i)=>{
    let [nameAr,nameEn,aliases]=value.split('~');const alternatives=lexicon.get(fold(nameAr))||[];
    let original=alternatives.find(a=>a.domain===row.domain&&(!nameEn||fold(a.nameEn)===fold(nameEn)))||alternatives.find(a=>!nameEn||fold(a.nameEn)===fold(nameEn));
    if(!nameEn){if(!original){missing.push(`${id} ${row.title}: ${nameAr}`);nameEn='MISSING';}else nameEn=original.nameEn;}
    const media=['video-games','films','television'].includes(row.domain);
    if(media)original=alternatives.find(a=>(a.year||a.part||a.series)&&[a.nameEn,...(a.aliases||[])].some(n=>fold(n)===fold(nameEn)))||original;
    const allAliases=[nameAr,nameEn,...(aliases?aliases.split('^'):[]),...(original?.aliases||[])];
    if(media&&original&&[original.nameEn,...(original.aliases||[])].some(n=>fold(n)===fold(nameEn)))nameEn=original.nameEn;
    const qualifier=qualifiers[row.domain];if(qualifier&&nameEn.endsWith(' '+qualifier)){allAliases.push(nameEn);nameEn=nameEn.slice(0,-qualifier.length-1);}
    if(nameEn==='Gaming keyboard'){allAliases.push(nameEn);nameEn='Keyboard';}if(nameEn==='Gaming mouse'){allAliases.push(nameEn);nameEn='Computer mouse';}if(nameEn==='Gaming microphone'){allAliases.push(nameEn);nameEn='Microphone';}
    if(row.section==='tech'){
      const short=nameEn.replace(/\s+(?:app|stores|supermarket|market|clothing|Inc|FC)$/i,'');if(short!==nameEn)allAliases.push(short);
    }
    if(row.title.includes('أنواع تمر'))allAliases.push(nameEn.replace(/\s+dates$/i,''));
    if(row.title.includes('أنواع بيتزا'))allAliases.push(nameAr.replace(/^بيتزا\s+/,''),nameEn.replace(/\s+pizza$/i,''));
    if(row.title.includes('أنواع كيك'))allAliases.push(nameAr.replace(/^كيك\s+/,''),nameEn.replace(/\s+cake$/i,''));
    if(row.domain==='minecraft-items'&&/^Cooked\s+/i.test(nameEn))allAliases.push(nameEn.replace(/^Cooked\s+/i,''),nameAr.replace(/\s+مطبوخ$/,''));
    const answer={id:`c${id}-a${i+1}`,rank:i+1,nameAr,nameEn,aliases:[...new Set(allAliases.filter(Boolean))]};
    if(original&&(row.domain==='video-games'||row.domain==='films'||row.domain==='television'))for(const field of ['series','part','year'])if(original[field])answer[field]=original[field];
    return answer;
  });
  if(answers.length!==10)throw Error(`${id} ${row.title}: ${answers.length} answers`);
  if(new Set(answers.map(a=>fold(a.nameEn))).size!==10)duplicates.push(`${id}: duplicate answer in ${row.title}`);
  const set=answers.map(a=>fold(a.nameEn)).sort().join('|');if(sets.has(set))duplicates.push(`${id}: ${row.title} duplicates ${sets.get(set)}`);sets.set(set,row.title);
  return{id,title:row.title,section:row.section,group:sections[row.section],icon:'',domain:row.domain,rankingType:'editorial',difficulty:'easy',region:row.source==='arab-screen'||/سعود|عربي|خليج|مصري|لبناني|شامي|مغرب|السفرة الخليجية/.test(row.title)?'arab':'global',description:`${row.title}. اكشف الأسماء العشرة بأي ترتيب.`,metric:'قائمة تحدٍّ بأسماء مألوفة. ترتيب المراكز خاص باللعبة، والمرجع يشرح الموضوع والأسماء، ولا يمثل تصويتًا أو إحصاءً عالميًا.',source:{title:sourceTitle,url:sourceUrl,asOf:'نوفمبر 2026',checkedAt:'2026-11-17'},answers};
});
if(missing.length||duplicates.length){console.log(JSON.stringify({missing,duplicates},null,2));process.exit(1);}
for(let i=0;i<3;i++)fs.writeFileSync(`data/lists-${201+i*100}-${300+i*100}.json`,JSON.stringify(categories.slice(i*100,(i+1)*100),null,2)+'\n');
fs.writeFileSync('data/research-201-500.md',`# قوائم الحياة اليومية والمواضيع المألوفة\n\n300 موضوع مؤلف يدويًا، ولكل موضوع عشرة أسماء عربية وإنجليزية وبدائل شائعة. لا تُنشأ المواضيع بتبديل ترتيب القائمة نفسها؛ يفحص البناء عدم تكرار مجموعة الإجابات كاملة. بعض المواضيع مترابطة، مثل أدوات البيت وأدوات المدرسة. المراكز من إعداد اللعبة وليست ترتيبًا منقولًا عن المرجع.\n\nالمراجع المستخدمة لتعريف الموضوع والأسماء:\n${Object.values(references).map(([title,url])=>'- '+title+': '+url).join('\n')}\n\nتُراجع الأسماء والأجزاء والأرقام في اختبارات مطابقة الإجابات. مصادر الدول والمدن من بيانات Natural Earth الموثقة أيضًا في geo-sources.md. تاريخ المراجعة: 2026-11-17.\n`);
console.log(JSON.stringify({categories:categories.length,answers:categories.length*10,sections:Object.fromEntries(Object.keys(sections).map(s=>[s,categories.filter(c=>c.section===s).length]))}));
