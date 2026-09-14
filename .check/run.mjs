import { run } from './out/ssr-entry.js';
import fs from 'node:fs';

const result = run();

console.log(`ROUTES RENDERED: ${result.total}`);
if (result.failures.length === 0) {
  console.log('ALL ROUTES OK');
} else {
  console.log(`FAILURES (${result.failures.length}):`);
  result.failures.forEach((line) => console.log('  - ' + line));
}

fs.writeFileSync('.check/image-urls.txt', result.imageUrls.join('\n'));
console.log(`UNIQUE IMAGE URLS: ${result.imageUrls.length}`);
