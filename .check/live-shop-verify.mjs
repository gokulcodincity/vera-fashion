import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--no-sandbox', '--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const failures = [];
let liveCatalogueRequest = false;
page.on('request', (request) => {
  if (request.url().includes('/rest/v1/products') && request.url().includes('select=')) liveCatalogueRequest = true;
});
try {
  await page.goto('http://127.0.0.1:5173/shop', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.querySelectorAll('article').length === 15, { timeout: 15000 });
  if (liveCatalogueRequest) console.log('PASS: Shop requests the live Supabase products endpoint');
  else failures.push('Shop did not issue a live Supabase catalogue request');
  if (await page.evaluate(() => document.body.innerText.includes('Showing 15 of 39'))) console.log('PASS: Shop renders the 39-product live catalogue in its first 15-product batch');
  else failures.push('Shop did not render the expected live catalogue count');
  await page.hover('article');
  const quickView = await page.$('article button');
  if (quickView) {
    await page.evaluate(() => {
      const button = [...document.querySelectorAll('article button')].find((node) => node.textContent?.includes('Quick view'));
      button?.click();
    });
    await page.waitForFunction(() => Boolean(document.querySelector('[role="dialog"]')), { timeout: 10000 });
    console.log('PASS: Quick View accepts the live Shop product object');
  } else failures.push('Shop Quick View control is unavailable');
} catch (error) {
  failures.push(`unexpected live Shop verification error: ${error.stack || error.message}`);
}
await browser.close();
if (failures.length) {
  failures.forEach((failure) => console.log(`FAIL: ${failure}`));
  process.exitCode = 1;
} else console.log('LIVE SHOP VERIFICATION COMPLETED WITHOUT FAILURES');
