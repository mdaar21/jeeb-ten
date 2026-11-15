import { createRoot } from 'react-dom/client';
import Home from './app/home';
import './app/globals.css';
import { configureLocalGame } from './lib/browser-game';
import type { Category } from './lib/game';

async function start() {
  const response = await fetch(new URL('data/catalog.json', document.baseURI));
  if (!response.ok) throw Error('تعذر تحميل القوائم.');
  const catalog = await response.json() as Category[];
  if (!Array.isArray(catalog) || catalog.length !== 200) throw Error('ملف القوائم غير مكتمل.');
  configureLocalGame(catalog, localStorage);
  const categories = catalog.map(({ answers, distractors, ...category }) => category);
  createRoot(document.getElementById('root')!).render(<Home categories={categories}/>);
}
start().catch(() => {
  const root = document.getElementById('root')!;
  root.replaceChildren();
  const message = document.createElement('p');
  message.textContent = 'تعذر تحميل اللعبة. تأكد من الاتصال واسمح بالتخزين على الجهاز.';
  const retry = document.createElement('button');
  retry.textContent = 'حاول ثانية';
  retry.onclick = () => location.reload();
  root.append(message, retry);
});
