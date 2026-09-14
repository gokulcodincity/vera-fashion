import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const base = 'http://127.0.0.1:5173';
const failures = [];
const pass = (message) => console.log(`PASS: ${message}`);
const expect = async (assertion, message) => {
  if (await assertion()) pass(message);
  else failures.push(message);
};

try {
  await page.goto(`${base}/shop?q=a`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.querySelectorAll('article').length === 15);

  await page.hover('article');
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === 'Quick view');
    if (!button) throw new Error('Quick View button not found');
    button.click();
  });
  await page.waitForFunction(() => [...document.querySelectorAll('[role="dialog"]')].some((dialog) => dialog.textContent.includes('Quick view')));
  await expect(async () => page.evaluate(() => document.body.innerText.includes('Choose your details and add this style without leaving the collection.')), 'Quick View opens without leaving Shop');
  await page.keyboard.press('Tab');
  await expect(async () => page.evaluate(() => document.querySelector('[role="dialog"]')?.contains(document.activeElement)), 'Quick View keeps keyboard focus inside its dialog');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
  await expect(async () => page.url().includes('/shop?q=a'), 'Escape closes Quick View without navigating away');

  await page.evaluate(() => document.querySelector('[data-testid="infinite-scroll-sentinel"]')?.scrollIntoView({ block: 'center' }));
  await page.waitForFunction(() => document.querySelectorAll('article').length === 30);
  await page.locator('article a[href^="/product/"]').click();
  await page.waitForFunction(() => location.pathname.startsWith('/product/'));
  await page.goBack({ waitUntil: 'networkidle2' });
  await page.waitForFunction(() => location.pathname === '/shop' && document.querySelectorAll('article').length === 30);
  await expect(async () => page.url().includes('q=a'), 'Shop query and loaded result depth survive Product → Back');

  await page.goto(`${base}/product/amaira-floral-wrap-dress`, { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.title.includes('Amaira Floral Wrap Dress') || document.body.innerText.includes('Style unavailable'));
  await page.locator('#product-pincode').fill('600001');
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === 'Check');
    if (!button) throw new Error('Pincode check button not found');
    button.click();
  });
  await expect(async () => page.evaluate(() => document.body.innerText.includes('Delivery available.') && document.body.innerText.includes('Estimated delivery:')), 'pincode checker returns a local demo delivery estimate');

  await page.goto(`${base}/product/rowan-leather-biker-jacket`, { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.title.includes('Rowan Tan Leather Biker Jacket') || document.body.innerText.includes('Style unavailable'));
  await page.goto(`${base}/product/amaira-floral-wrap-dress`, { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.title.includes('Amaira Floral Wrap Dress') || document.body.innerText.includes('Style unavailable'));
  await expect(async () => page.evaluate(() => document.body.innerText.includes('Recently Viewed') && document.body.innerText.includes('Rowan Tan Leather Biker Jacket')), 'recently viewed is persisted, deduplicated and rendered on the PDP');

  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await mobile.goto(`${base}/product/amaira-floral-wrap-dress`, { waitUntil: 'networkidle2' });
  await mobile.waitForFunction(() => document.title.includes('Amaira Floral Wrap Dress') || document.body.innerText.includes('Style unavailable'));
  await expect(async () => mobile.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === 'Add to Bag');
    return button && getComputedStyle(button.closest('.fixed')).position === 'fixed';
  }), 'mobile PDP exposes a fixed Add to Bag purchase bar');
  await expect(async () => mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2), 'mobile PDP remains free of horizontal overflow');

  await mobile.evaluate(() => localStorage.setItem('vera:cart:v1', JSON.stringify([{ productId: 'amaira-floral-wrap-dress', size: 'M', color: 'Pink', quantity: 1 }])));
  await mobile.goto(`${base}/checkout`, { waitUntil: 'networkidle2' });
  await mobile.waitForFunction(() => {
    const raw = localStorage.getItem('vera:cart:v2');
    return raw && JSON.parse(raw)[0]?.productSnapshot?.id === 'amaira-floral-wrap-dress';
  });
  await expect(async () => mobile.evaluate(() => localStorage.getItem('vera:cart:v1') === '[]'), 'legacy cart data migrates to v2 before checkout');
  const summaryTrigger = mobile.locator('button[aria-controls="checkout-summary-details"]');
  await expect(async () => mobile.$eval('button[aria-controls="checkout-summary-details"]', (node) => node.getAttribute('aria-expanded') === 'false'), 'mobile checkout starts with a compact order-summary disclosure');
  await summaryTrigger.click();
  await expect(async () => mobile.$eval('button[aria-controls="checkout-summary-details"]', (node) => node.getAttribute('aria-expanded') === 'true'), 'mobile checkout order summary expands on demand');
  await mobile.close();
} catch (error) {
  failures.push(`unexpected validation error: ${error.stack || error.message}`);
}

await browser.close();
if (failures.length) {
  console.log(`FAILURES (${failures.length}):`);
  failures.forEach((failure) => console.log(`FAIL: ${failure}`));
  process.exitCode = 1;
} else {
  console.log('ALL UX-UPGRADE CHECKS PASSED');
}
