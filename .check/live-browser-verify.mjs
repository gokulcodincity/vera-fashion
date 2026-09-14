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
const consoleErrors = [];
const expect = async (assertion, message) => {
  if (await assertion()) console.log(`PASS: ${message}`);
  else failures.push(message);
};
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

try {
  await page.goto(`${base}/product/amaira-floral-wrap-dress`, { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.body.innerText.includes('Amaira Floral Wrap Dress') || document.body.innerText.includes('Style unavailable'));
  await expect(
    async () => page.evaluate(() => document.body.innerText.includes('Amaira Floral Wrap Dress') && !document.body.innerText.includes('Style unavailable')),
    'configured storefront PDP renders the live Supabase product'
  );
  await expect(
    async () => page.evaluate(() => document.querySelectorAll('#size-selector button').length > 0 && document.querySelectorAll('button[title]').length > 0),
    'live PDP renders database-backed size and color variants'
  );

  await page.goto(`${base}/admin/login`, { waitUntil: 'networkidle2' });
  await expect(
    async () => Boolean(await page.$('input[type="email"]')) && Boolean(await page.$('input[type="password"]')),
    'configured admin login renders credential fields'
  );
  await expect(
    async () => page.evaluate(() => !document.body.innerText.includes('Supabase is not configured.')),
    'configured admin login no longer shows setup-required state'
  );

  await page.goto(`${base}/admin`, { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => location.pathname === '/admin/login');
  await expect(
    async () => new URL(page.url()).searchParams.get('setup') !== 'required',
    'unauthenticated admin route is protected by login rather than the configuration fallback'
  );
} catch (error) {
  failures.push(`unexpected browser verification error: ${error.stack || error.message}`);
}

await browser.close();
if (consoleErrors.length) failures.push(`browser console errors: ${[...new Set(consoleErrors)].join(' | ')}`);
if (failures.length) {
  failures.forEach((message) => console.log(`FAIL: ${message}`));
  process.exitCode = 1;
} else {
  console.log('LIVE BROWSER VERIFICATION COMPLETED WITHOUT FAILURES');
}
