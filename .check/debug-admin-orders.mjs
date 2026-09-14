import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';
const verify = Object.fromEntries(readFileSync('.env.verify', 'utf8').split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#') && line.includes('=')).map((line) => { const index = line.indexOf('='); return [line.slice(0, index).trim(), line.slice(index + 1).trim()]; }));
const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const events = [];
page.on('response', (response) => { if (response.url().includes('/rest/v1/orders')) events.push({ status: response.status() }); });
page.on('pageerror', (error) => events.push({ pageError: error.message }));
await page.goto('http://127.0.0.1:5173/admin/login', { waitUntil: 'networkidle2' });
await page.locator('input[type="email"]').fill(verify.VERA_TEST_ADMIN_EMAIL);
await page.locator('input[type="password"]').fill(verify.VERA_TEST_ADMIN_PASSWORD);
await page.locator('button[type="submit"]').click();
await page.waitForFunction(() => location.pathname === '/admin');
await page.goto('http://127.0.0.1:5173/admin/orders', { waitUntil: 'networkidle2' });
await new Promise((resolve) => setTimeout(resolve, 3000));
const state = await page.evaluate(() => ({
  noOrders: document.body.innerText.includes('No orders yet.'),
  hasError: Boolean(document.querySelector('p.text-clay')),
  rows: document.querySelectorAll('tbody tr').length,
  hasOrderSelect: document.querySelectorAll('tbody select').length > 0,
}));
console.log(JSON.stringify({ state, events }));
await browser.close();
