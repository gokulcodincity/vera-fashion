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
const errors = [];
const expect = async (assertion, message) => {
  if (await assertion()) console.log(`PASS: ${message}`);
  else failures.push(message);
};

page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.goto(`${base}/admin/login`, { waitUntil: 'networkidle2' });
  await expect(
    async () => page.evaluate(() => document.body.innerText.includes('Supabase is not configured.')),
    'admin login presents the no-configuration setup state'
  );

  await page.goto(`${base}/admin`, { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => location.pathname === '/admin/login' && new URLSearchParams(location.search).get('setup') === 'required');
  await expect(
    async () => page.url().endsWith('/admin/login?setup=required'),
    'protected admin route redirects to the setup-required login state'
  );

  await page.goto(`${base}/`, { waitUntil: 'networkidle2' });
  await expect(async () => Boolean(await page.$('main')), 'public storefront renders without Supabase credentials');

  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('vera:cart:v1', JSON.stringify([
      { productId: 'amaira-floral-wrap-dress', size: 'M', color: 'Pink', quantity: 1 },
    ]));
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForFunction(() => {
    const raw = localStorage.getItem('vera:cart:v2');
    if (!raw) return false;
    const items = JSON.parse(raw);
    return Array.isArray(items)
      && items.length === 1
      && items[0].productSnapshot?.id === 'amaira-floral-wrap-dress';
  });
  await expect(
    async () => page.evaluate(() => localStorage.getItem('vera:cart:v1') === '[]'),
    'legacy cart is migrated to v2 and cleared from the old key'
  );
} catch (error) {
  failures.push(`unexpected validation error: ${error.stack || error.message}`);
}

await browser.close();
if (errors.length) failures.push(`console errors: ${[...new Set(errors)].join(' | ')}`);
if (failures.length) {
  console.log(`FAILURES (${failures.length}):`);
  failures.forEach((failure) => console.log(`FAIL: ${failure}`));
  process.exitCode = 1;
} else {
  console.log('ALL SUPABASE-FALLBACK CHECKS PASSED');
}
