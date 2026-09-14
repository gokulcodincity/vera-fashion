import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 1 });

const base = 'http://127.0.0.1:5173';
const fail = [];
const pass = (message) => console.log(`PASS: ${message}`);
const expect = async (condition, message) => {
  const actual = await condition();
  if (!actual) fail.push(message);
  else pass(message);
};

const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

async function clearStorage() {
  await page.evaluate(() => localStorage.clear());
}

const hasText = (targetPage, text) =>
  targetPage.evaluate((value) => document.body.innerText.includes(value), text);

const count = (targetPage, selector) =>
  targetPage.$$eval(selector, (nodes) => nodes.length);

const textOf = (targetPage, selector) =>
  targetPage.$eval(selector, (node) => node.textContent || '');

async function clickText(targetPage, text) {
  const element = await targetPage.evaluateHandle((value) => {
    const candidates = [...document.querySelectorAll('button, a, label')];
    return candidates.find((candidate) => candidate.textContent?.trim() === value) || null;
  }, text);
  const handle = element.asElement();
  if (!handle) throw new Error(`Could not find clickable text: ${text}`);
  await handle.click();
}

try {
  // Search overlay -> live result -> product page.
  await page.goto(base + '/', { waitUntil: 'networkidle2' });
  await clearStorage();
  await page.reload({ waitUntil: 'networkidle2' });
  await page.locator('button[aria-label="Search"]').click();
  await page.locator('input[aria-label="Search products"]').fill('Amaira');
  await page.waitForSelector('text=Amaira Floral Wrap Dress');
  await expect(async () => hasText(page, 'Amaira Floral Wrap Dress'), 'live search returns a matching product');
  await page.locator('[role="dialog"] a[href="/product/amaira-floral-wrap-dress"]').click();
  await page.waitForFunction(() => document.title.includes('Amaira Floral Wrap Dress'));
  await expect(async () => (await page.title()).includes('Amaira Floral Wrap Dress'), 'search result navigates to product detail');

  // Size choice + add -> drawer -> persistence.
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('#size-selector button')].find(
      (node) => node.textContent?.trim() === 'M'
    );
    if (!button) throw new Error('Could not find size M');
    button.click();
  });
  await clickText(page, 'Add to Cart');
  await page.waitForSelector('[role="dialog"]');
  await expect(async () => (await count(page, '[role="dialog"]')) === 1, 'adding a product opens the bag drawer');
  await expect(async () => (await textOf(page, '[role="dialog"]')).includes('Amaira Floral Wrap Dress'), 'drawer includes selected product');
  await page.locator('button[aria-label="Close panel"]').click();
  await page.reload({ waitUntil: 'networkidle2' });
  await page.locator('button[aria-label="Open bag"]').click();
  await expect(async () => (await textOf(page, '[role="dialog"]')).includes('Amaira Floral Wrap Dress'), 'cart persists after page reload');
  await page.locator('button[aria-label="Close panel"]').click();

  // Wishlist toggle + persistence.
  await page.locator('button[aria-label^="Add Amaira Floral Wrap Dress to wishlist"]').click();
  await page.goto(base + '/wishlist', { waitUntil: 'networkidle2' });
  await expect(async () => hasText(page, 'Amaira Floral Wrap Dress'), 'wishlist receives saved product');
  await page.reload({ waitUntil: 'networkidle2' });
  await expect(async () => hasText(page, 'Amaira Floral Wrap Dress'), 'wishlist persists after page reload');

  // Shop query and desktop sidebar filter.
  await page.goto(base + '/shop', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const label = [...document.querySelectorAll('aside label')].find((node) =>
      node.textContent?.trim().startsWith('Dresses')
    );
    if (!label) throw new Error('Could not find Dresses filter');
    label.click();
  });
  await page.waitForFunction(() => location.search.includes('category=Dresses'));
  await expect(async () => new URL(page.url()).searchParams.get('category') === 'Dresses', 'shop category filter updates the URL');
  await expect(async () => (await count(page, 'article')) > 0, 'shop category filter returns product cards');

  // Mobile menu + mobile filter drawer.
  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await mobile.goto(base + '/shop', { waitUntil: 'networkidle2' });
  await mobile.locator('button[aria-label="Open menu"]').click();
  await expect(async () => (await count(mobile, 'nav[role="dialog"][aria-label="Mobile navigation"]')) === 1, 'mobile hamburger opens navigation');
  await mobile.locator('button[aria-label="Close menu"]').click();
  await mobile.waitForFunction(() => !document.querySelector('nav[role="dialog"][aria-label="Mobile navigation"]'));
  await mobile.goto(base + '/shop', { waitUntil: 'networkidle2' });
  await mobile.waitForFunction(() => [...document.querySelectorAll('button')].some((node) => node.textContent?.trim().startsWith('Filters')));
  await mobile.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find((node) =>
      node.textContent?.trim().startsWith('Filters')
    );
    if (!button) throw new Error('Could not find mobile filters button');
    button.click();
  });
  await mobile.waitForSelector('[role="dialog"]');
  await expect(async () => (await count(mobile, '[role="dialog"]')) === 1, 'mobile filter button opens a filter drawer');
  await mobile.evaluate(() => {
    const label = document.querySelector('[role="dialog"] label');
    if (!label) throw new Error('Could not find a mobile filter option');
    label.click();
  });
  await mobile.evaluate(() => {
    const button = [...document.querySelectorAll('[role="dialog"] button')].find((node) =>
      /^Apply filters \(\d+\)$/.test(node.textContent?.trim() || '')
    );
    if (!button) throw new Error('Could not find the mobile filter apply button');
    button.click();
  });
  await mobile.waitForFunction(() => !document.querySelector('[role="dialog"]'));
  await expect(async () => (await count(mobile, '[role="dialog"]')) === 0, 'mobile filter drawer closes after applying');
  await mobile.close();

  // Checkout flow with actual stored cart.
  await page.goto(base + '/checkout', { waitUntil: 'networkidle2' });
  await expect(async () => (await textOf(page, 'h1')).includes('Checkout'), 'checkout opens with cart contents');
  await page.locator('#field-fullName').fill('Ananya Sharma');
  await page.locator('#field-email').fill('ananya@example.test');
  await page.locator('#field-phone').fill('9876543210');
  await page.locator('#field-address').fill('24 Anna Salai, Thousand Lights');
  await page.locator('#field-city').fill('Chennai');
  await page.locator('#field-state').fill('Tamil Nadu');
  await page.locator('#field-pincode').fill('600002');
  await clickText(page, 'Place Order');
  await page.waitForSelector('text=Order Confirmed!', { timeout: 10000 });
  await expect(async () => hasText(page, 'Order Confirmed!'), 'checkout completes into an order confirmation state');
  await page.goto(base + '/cart', { waitUntil: 'networkidle2' });
  await expect(async () => hasText(page, 'Your bag is waiting.'), 'successful checkout clears persisted cart');
} catch (error) {
  fail.push(`unexpected test error: ${error.stack || error.message}`);
}

await browser.close();

if (consoleErrors.length) fail.push(`console errors: ${[...new Set(consoleErrors)].join(' | ')}`);
if (fail.length) {
  console.log(`FAILURES (${fail.length}):`);
  fail.forEach((message) => console.log(`FAIL: ${message}`));
  process.exitCode = 1;
} else {
  console.log('ALL INTERACTION CHECKS PASSED');
}
