import fs from 'node:fs';
const names = ['lists-01-35.json', 'lists-36-70.json', 'lists-71-100.json', 'lists-101-135.json', 'lists-136-170.json', 'lists-171-200.json'];
const data = names.flatMap(name => fs.existsSync(`data/${name}`) ? JSON.parse(fs.readFileSync(`data/${name}`, 'utf8').replace(/^\uFEFF/, '')) : []);
const ids = new Set();
for (const c of data) {
  if(c.rankingType==='editorial'){
    c.title=c.title.replaceAll('نعرفها','مشهورة');
    if(!/10|١٠/.test(c.title))c.title=`10 ${c.title}`;
    c.group=c.group.replaceAll('نعرفها','مشهورة');
    c.source.title=c.source.title.replace(/^مختارات[^—–:-]*[—–:-]\s*/, '');
    c.source.asOf='نوفمبر 2026';
    c.description=`${c.title}. حاول اكتشاف الأسماء العشرة بأي ترتيب.`;
    c.metric='المراكز مرتبة خصيصًا لهذا التحدّي، والمرجع يوضّح أسماء العناصر ومعلوماتها. تُقبل الأسماء العربية والإنجليزية وبدائلها المعروفة.';
  }
  if (ids.has(c.id)) throw Error(`Duplicate category ${c.id}`);
  ids.add(c.id);
  if (c.answers.length !== 10) throw Error(`Category ${c.id} has ${c.answers.length} answers`);
  const ranks = c.answers.map(a=>a.rank).sort((a,b)=>a-b).join(',');
  if (ranks !== '1,2,3,4,5,6,7,8,9,10') throw Error(`Invalid ranks in ${c.id}`);
  if (!c.source?.url?.startsWith('https://') || !c.source.asOf) throw Error(`Missing source ${c.id}`);
  if (c.answers.some(a=>!a.nameAr || !a.nameEn || !Array.isArray(a.aliases))) throw Error(`Missing aliases ${c.id}`);
  if(new Set(c.answers.map(a=>a.id)).size!==10)throw Error(`Duplicate answer IDs ${c.id}`);
  if(c.id>100&&(c.difficulty!=='easy'||c.rankingType!=='editorial'||!c.domain))throw Error(`Missing new category metadata ${c.id}`);
}
data.sort((a,b)=>a.id-b.id);
fs.writeFileSync('data/catalog.json', JSON.stringify(data,null,2)+'\n');
console.log(`Merged ${data.length} categories / ${data.length*10} answers`);
if (process.argv.includes('--complete') && (data.length !== 200 || [...ids].some(id=>id<1 || id>200))) throw Error('All 200 categories required');
