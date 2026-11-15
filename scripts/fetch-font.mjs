import fs from 'node:fs/promises';
const folder = 'public/fonts';
await fs.mkdir(folder,{recursive:true});
const css=await (await fetch('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap',{headers:{'User-Agent':'Mozilla/5.0'}})).text();
let out=css;let i=0;
for(const url of new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map(m=>m[1]))){
  const name=`plex-arabic-${++i}.${url.includes('.woff2')?'woff2':'ttf'}`;
  const res=await fetch(url);if(!res.ok)throw Error(`Font fetch ${res.status}`);
  await fs.writeFile(`${folder}/${name}`,Buffer.from(await res.arrayBuffer()));out=out.split(url).join(`/fonts/${name}`);
}
if(!i)throw Error('Font not found');
await fs.writeFile(`${folder}/font.css`,out);console.log(`Saved ${i} local Arabic font files`);
