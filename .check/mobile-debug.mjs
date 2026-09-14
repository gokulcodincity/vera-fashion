import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.goto('http://127.0.0.1:5173/shop', { waitUntil: 'networkidle2' });
console.log(await page.$$eval('button', (buttons) => buttons.map((button) => ({text:button.textContent?.trim(), label:button.getAttribute('aria-label'), display:getComputedStyle(button).display, visibility:getComputedStyle(button).visibility, rect:button.getBoundingClientRect().toJSON()}))));
console.log('body', (await page.$eval('body', n=>n.innerText)).slice(0,1000));
await browser.close();
