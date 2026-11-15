import fs from 'node:fs';
fs.mkdirSync('docs/data', { recursive: true });
fs.copyFileSync('data/catalog.json', 'docs/data/catalog.json');
fs.writeFileSync('docs/.nojekyll', '');
console.log('GitHub Pages files ready in docs/');
