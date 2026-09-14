import fs from 'node:fs';

const urls = fs
  .readFileSync('.check/image-urls.txt', 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

let ok = 0;
const bad = [];

async function check(url) {
  try {
    const response = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-64' } });
    if (response.ok || response.status === 206) ok += 1;
    else bad.push(`${response.status} ${url}`);
  } catch (error) {
    bad.push(`ERR ${error.message} ${url}`);
  }
}

const BATCH = 12;
for (let i = 0; i < urls.length; i += BATCH) {
  await Promise.all(urls.slice(i, i + BATCH).map(check));
}

console.log(`CHECKED ${urls.length} image urls`);
console.log(`OK: ${ok}`);
if (bad.length) {
  console.log(`BAD (${bad.length}):`);
  bad.forEach((line) => console.log('  ' + line));
} else {
  console.log('NO BROKEN IMAGES');
}
