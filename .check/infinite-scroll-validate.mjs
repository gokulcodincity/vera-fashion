import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--hide-scrollbars'],
});

const base = 'http://127.0.0.1:5173';
const errors = [];
const failures = [];
const pass = (message) => console.log(`PASS: ${message}`);

const createPage = async (viewport) => {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText || '';
    if (!failure.includes('net::ERR_ABORTED')) errors.push(`${request.url()} :: ${failure}`);
  });
  return page;
};

const articleCount = (page) => page.$$eval('article', (cards) => cards.length);
const productHrefs = (page) =>
  page.$$eval('article', (cards) =>
    cards
      .map((card) => card.querySelector('a[href^="/product/"]')?.getAttribute('href'))
      .filter(Boolean)
  );
const hasText = (page, text) => page.evaluate((value) => document.body.innerText.includes(value), text);
const hasSentinel = (page) => page.$('[data-testid="infinite-scroll-sentinel"]');

async function expect(test, message) {
  if (await test()) pass(message);
  else failures.push(message);
}

async function waitForProducts(page, expected) {
  await page.waitForFunction((count) => document.querySelectorAll('article').length === count, {}, expected);
}

async function triggerNextBatch(page, expectedCount) {
  await page.evaluate(() => {
    const sentinel = document.querySelector('[data-testid="infinite-scroll-sentinel"]');
    if (!sentinel) throw new Error('Infinite scroll sentinel is missing');
    sentinel.scrollIntoView({ block: 'center' });
  });
  await page.waitForFunction(() => document.body.innerText.includes('Loading more styles...'), { timeout: 1500 });
  await waitForProducts(page, expectedCount);
}

try {
  const desktop = await createPage({ width: 1440, height: 900, deviceScaleFactor: 1 });

  // Base catalogue: exactly 15 -> 30 -> all 39.
  await desktop.goto(`${base}/shop`, { waitUntil: 'networkidle2' });
  await waitForProducts(desktop, 15);
  await expect(async () => (await articleCount(desktop)) === 15, 'Shop starts with exactly 15 products');
  await expect(async () => !(await hasText(desktop, 'Load more')), 'manual Load More UI is removed');
  await expect(async () => Boolean(await hasSentinel(desktop)), 'sentinel is present while more products are available');

  await triggerNextBatch(desktop, 30);
  await expect(async () => (await articleCount(desktop)) === 30, 'first observer pass appends exactly 15 products');

  await triggerNextBatch(desktop, 39);
  await expect(async () => (await articleCount(desktop)) === 39, 'second observer pass appends all remaining products');
  await expect(async () => !(await hasSentinel(desktop)), 'sentinel is removed after every product is rendered');
  await expect(async () => hasText(desktop, "You've reached the end."), 'end-of-catalogue message is shown only after scrolling all products');
  await expect(async () => {
    const hrefs = await productHrefs(desktop);
    return hrefs.length === new Set(hrefs).size && hrefs.length === 39;
  }, 'infinite scroll does not render duplicate products');

  // Filter change after all products: reset back to first 15, then load 5 remaining women styles.
  await desktop.goto(`${base}/shop?gender=Women`, { waitUntil: 'networkidle2' });
  // Browser URL changes can retain the old grid's scroll position. A shopper changes
  // filters at the controls, which are at the top, so model that interaction here.
  await desktop.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
  await waitForProducts(desktop, 15);
  await expect(async () => (await articleCount(desktop)) === 15, 'gender filter resets the visible count to 15');
  await triggerNextBatch(desktop, 20);
  await expect(async () => (await articleCount(desktop)) === 20, 'filtered results continue with their remaining batch');

  // Sort change resets the visible count before it resumes scrolling. The control is
  // at the top of the page, so restore that real user interaction before changing it.
  await desktop.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
  await desktop.select('select[aria-label="Sort products"]', 'price-asc');
  await waitForProducts(desktop, 15);
  await expect(async () => (await articleCount(desktop)) === 15, 'sorting resets filtered results to 15 products');
  await triggerNextBatch(desktop, 20);
  await expect(async () => (await articleCount(desktop)) === 20, 'sorted results resume observer-based batching');

  // Search reset and continuation (the broad query matches the full catalogue).
  await desktop.goto(`${base}/shop?q=a`, { waitUntil: 'networkidle2' });
  await desktop.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
  await waitForProducts(desktop, 15);
  await expect(async () => (await articleCount(desktop)) === 15, 'search results begin with exactly 15 products');
  await triggerNextBatch(desktop, 30);
  await expect(async () => (await articleCount(desktop)) === 30, 'search results load the next 15 through the sentinel');

  // A small category result should not render unnecessary sentinel/loading/end states.
  await desktop.goto(`${base}/shop?category=Dresses`, { waitUntil: 'networkidle2' });
  await desktop.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
  await desktop.waitForFunction(() => document.querySelectorAll('article').length > 0);
  await expect(async () => (await articleCount(desktop)) <= 15, 'small category results render in a single initial batch');
  await expect(async () => !(await hasSentinel(desktop)), 'small category results do not render an unused sentinel');
  await expect(async () => !(await hasText(desktop, "You've reached the end.")), 'small category results do not show an unnecessary end message');

  await desktop.close();

  // Mobile uses the identical sentinel flow and does not cause horizontal overflow.
  const mobile = await createPage({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await mobile.goto(`${base}/shop`, { waitUntil: 'networkidle2' });
  await waitForProducts(mobile, 15);
  await expect(async () => (await articleCount(mobile)) === 15, 'mobile Shop starts with 15 products');
  await triggerNextBatch(mobile, 30);
  await expect(async () => (await articleCount(mobile)) === 30, 'mobile Shop appends the next 15 products on scroll');
  await expect(async () => mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2), 'mobile infinite scroll has no horizontal overflow');
  await mobile.close();
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
  console.log('ALL INFINITE-SCROLL CHECKS PASSED');
}
