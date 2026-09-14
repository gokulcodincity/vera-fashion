import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--hide-scrollbars'],
});

const base = 'http://127.0.0.1:5173';
const routes = [
  '/',
  '/shop',
  '/shop?gender=Women',
  '/shop?gender=Men&category=Shirts&size=M&price=1500-3000&sale=1&sort=price-asc',
  '/shop?tag=new',
  '/shop?tag=bestseller',
  '/shop?tag=sale',
  '/shop?q=dress',
  '/shop?q=zzzzzz',
  '/cart',
  '/wishlist',
  '/checkout',
  '/about',
  '/contact',
  '/info/shipping',
  '/info/returns',
  '/info/size-guide',
  '/info/faqs',
  '/info/privacy',
  '/info/terms',
  '/product/amaira-floral-wrap-dress',
  '/product/rowan-leather-biker-jacket',
  '/product/metro-everyday-backpack',
  '/not-a-route',
];

const errors = [];
const outcomes = [];

for (const route of routes) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${route} :: console :: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`${route} :: pageerror :: ${error.message}`));
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText || '';
    if (!failure.includes('net::ERR_ABORTED')) errors.push(`${route} :: request :: ${request.url()} :: ${failure}`);
  });

  try {
    const response = await page.goto(base + route, { waitUntil: 'networkidle2', timeout: 60000 });
    const title = await page.title();
    const main = await page.$('main');
    const brokenImages = await page.$$eval('img', (images) => images.filter((image) => image.complete && image.naturalWidth === 0).length);
    outcomes.push({ route, status: response?.status() || null, title, main: Boolean(main), brokenImages });
  } catch (error) {
    errors.push(`${route} :: navigation :: ${error.message}`);
  }
  await page.close();
}

/* Mobile homepage and core mobile layouts. */
for (const route of ['/', '/shop', '/product/amaira-floral-wrap-dress', '/cart', '/checkout']) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`mobile ${route} :: console :: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`mobile ${route} :: pageerror :: ${error.message}`));
  try {
    await page.goto(base + route, { waitUntil: 'networkidle2', timeout: 60000 });
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewport = await page.evaluate(() => window.innerWidth);
    const menu = await page.$('button[aria-label="Open menu"]');
    const main = await page.$('main');
    outcomes.push({ route: `mobile ${route}`, status: 200, title: await page.title(), main: Boolean(main), overflowing: bodyWidth > viewport + 2, mobileMenu: Boolean(menu) });
  } catch (error) {
    errors.push(`mobile ${route} :: navigation :: ${error.message}`);
  }
  await page.close();
}

await browser.close();

console.log(`ROUTES CHECKED: ${outcomes.length}`);
console.log(`VALID ROUTES: ${outcomes.filter((entry) => entry.main && entry.brokenImages === 0 && !entry.overflowing).length}`);
for (const outcome of outcomes) console.log(JSON.stringify(outcome));
if (errors.length) {
  console.log(`ISSUES (${errors.length})`);
  errors.forEach((error) => console.log(error));
  process.exitCode = 1;
} else {
  console.log('NO BROWSER CONSOLE OR REQUEST ERRORS');
}
