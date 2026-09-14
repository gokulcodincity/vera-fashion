import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--hide-scrollbars'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

const errors = [];
const failures = [];
const pass = (message) => console.log(`PASS: ${message}`);
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));
page.on('requestfailed', (request) => {
  const failure = request.failure()?.errorText || '';
  if (!failure.includes('net::ERR_ABORTED')) errors.push(`${request.url()} :: ${failure}`);
});

const primaryState = () =>
  page.$$eval('article a > div > img[alt]', (images) =>
    images.map((image) => ({
      alt: image.alt,
      complete: image.complete,
      width: image.naturalWidth,
      opacity: getComputedStyle(image).opacity,
    }))
  );

try {
  await page.goto('http://127.0.0.1:5173/shop', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.querySelectorAll('article').length === 15);

  // Cache all initial primary product images, then render from browser cache again.
  await page.evaluate(async () => {
    for (const card of document.querySelectorAll('article')) {
      card.scrollIntoView({ block: 'center' });
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(
    () => [...document.querySelectorAll('article a > div > img[alt]')].every((image) => image.complete && image.naturalWidth > 0),
    { timeout: 30000 }
  );

  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.querySelectorAll('article').length === 15);
  await page.waitForFunction(
    () => [...document.querySelectorAll('article a > div > img[alt]')].slice(0, 4).every((image) => image.complete && image.naturalWidth > 0),
    { timeout: 30000 }
  );

  const initial = await primaryState();
  const visibleLoaded = initial.filter((image) => image.complete && image.width > 0).slice(0, 4);
  if (visibleLoaded.length === 4 && visibleLoaded.every((image) => image.opacity === '1')) {
    pass('cached primary product images are visible before hover');
  } else {
    failures.push(`normal primary opacity state: ${JSON.stringify(visibleLoaded)}`);
  }

  const firstCard = await page.$('article');
  await firstCard.hover();
  await page.waitForFunction(() => {
    const hoverImage = document.querySelector('article a > img[aria-hidden="true"]');
    return hoverImage && getComputedStyle(hoverImage).opacity === '1';
  });
  pass('secondary product image still appears on hover');

  await page.mouse.move(5, 120);
  await page.waitForFunction(() => {
    const primary = document.querySelector('article a > div > img[alt]');
    const hover = document.querySelector('article a > img[aria-hidden="true"]');
    return primary && hover && getComputedStyle(primary).opacity === '1' && getComputedStyle(hover).opacity === '0';
  });
  pass('primary product image remains visible after mouse leaves the card');

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise((resolve) => setTimeout(resolve, 600));
  const lazyLoaded = (await primaryState()).filter((image) => image.complete && image.width > 0);
  if (lazyLoaded.every((image) => image.opacity === '1')) {
    pass('lazy-loaded primary product images are never left transparent');
  } else {
    failures.push(`lazy primary opacity state: ${JSON.stringify(lazyLoaded)}`);
  }
} catch (error) {
  failures.push(`unexpected validation error: ${error.stack || error.message}`);
}

await browser.close();
if (errors.length) failures.push(`console/request errors: ${[...new Set(errors)].join(' | ')}`);

if (failures.length) {
  console.log(`FAILURES (${failures.length}):`);
  failures.forEach((failure) => console.log(`FAIL: ${failure}`));
  process.exitCode = 1;
} else {
  console.log('ALL PRODUCT IMAGE VISIBILITY CHECKS PASSED');
}
