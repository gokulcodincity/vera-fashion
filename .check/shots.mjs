import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = '.check/shots';

const targets = JSON.parse(process.env.TARGETS || '[]');

fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=1'],
});

const consoleErrors = [];

for (const target of targets) {
  const page = await browser.newPage();
  await page.setViewport({
    width: target.width || 1440,
    height: target.height || 900,
    deviceScaleFactor: 1,
    isMobile: Boolean(target.mobile),
    hasTouch: Boolean(target.mobile),
  });

  if (target.seed) {
    await page.evaluateOnNewDocument((payload) => {
      Object.entries(payload).forEach(([key, value]) => {
        window.localStorage.setItem(key, JSON.stringify(value));
      });
    }, target.seed);
  }

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(`${target.name} :: ${message.text()}`);
  });
  page.on('pageerror', (error) => consoleErrors.push(`${target.name} :: PAGEERROR ${error.message}`));
  page.on('requestfailed', (request) =>
    consoleErrors.push(`${target.name} :: REQFAIL ${request.url()} ${request.failure()?.errorText}`)
  );

  await page.goto(BASE + target.path, { waitUntil: 'networkidle2', timeout: 60000 });

  if (target.script) {
    // eslint-disable-next-line no-new-func
    await page.evaluate(target.script);
    await new Promise((resolve) => setTimeout(resolve, 700));
  }

  if (target.scroll) {
    await page.evaluate(async (distance) => {
      const step = 500;
      for (let y = 0; y < distance; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 90));
      }
    }, target.scroll);
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (target.scrollTo !== undefined) {
      await page.evaluate((y) => window.scrollTo(0, y), target.scrollTo);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  await page.screenshot({
    path: `${OUT}/${target.name}.jpeg`,
    type: 'jpeg',
    quality: target.quality || 62,
    fullPage: Boolean(target.fullPage),
  });

  await page.close();
}

await browser.close();

if (consoleErrors.length) {
  console.log(`CONSOLE ISSUES (${consoleErrors.length}):`);
  [...new Set(consoleErrors)].slice(0, 30).forEach((line) => console.log('  - ' + line));
} else {
  console.log('NO CONSOLE ERRORS');
}
console.log('SHOTS DONE');
