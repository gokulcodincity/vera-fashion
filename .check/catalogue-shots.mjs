/* Downloads the first gallery frame of every product at thumbnail size so the
   crops can be eyeballed for correctness. */
import fs from 'node:fs';
import path from 'node:path';
import { products } from './out/ssr-entry.js';

const dir = '.check/catalogue';
fs.mkdirSync(dir, { recursive: true });

const list = products.map((product, index) => ({
  index,
  id: product.id,
  name: product.name,
  url: product.images[0].replace(/w=\d+/, 'w=150').replace(/h=\d+/, 'h=190'),
}));

for (const entry of list) {
  const response = await fetch(entry.url);
  if (!response.ok) {
    console.log(`FAIL ${entry.id} ${response.status}`);
    continue;
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(path.join(dir, `${String(entry.index).padStart(2, '0')}.jpg`), buffer);
}

fs.writeFileSync(
  '.check/catalogue/index.txt',
  list.map((entry) => `${String(entry.index).padStart(2, '0')} ${entry.name}`).join('\n')
);
console.log(`SAVED ${list.length} catalogue thumbnails`);
