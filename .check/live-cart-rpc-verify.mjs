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
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.goto(`${base}/product/amaira-floral-wrap-dress`, { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.title.includes('Amaira Floral Wrap Dress'));
  await page.evaluate(() => localStorage.removeItem('vera:cart:v2'));
  await page.evaluate(() => {
    const size = [...document.querySelectorAll('#size-selector button')].find((button) => button.textContent.trim() === 'M');
    if (!size) throw new Error('Live PDP did not render size M');
    size.click();
  });
  await page.evaluate(() => {
    const add = [...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Add to Cart');
    if (!add) throw new Error('Live PDP add-to-cart control is unavailable');
    add.click();
  });
  await page.waitForFunction(() => {
    const raw = localStorage.getItem('vera:cart:v2');
    return raw && JSON.parse(raw).length === 1;
  });
  await expect(async () => page.evaluate(() => {
    const line = JSON.parse(localStorage.getItem('vera:cart:v2'))[0];
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuid.test(line.productId) && uuid.test(line.variantId) && line.productSnapshot?.id === 'amaira-floral-wrap-dress';
  }), 'live cart persists the database product UUID, selected variant UUID, and safe product snapshot');

  await page.evaluate(() => {
    localStorage.setItem('vera:cart:v2', JSON.stringify([{
      productId: '00000000-0000-4000-8000-000000000000',
      variantId: '00000000-0000-4000-8000-000000000000',
      size: 'M', color: 'Verification', quantity: 1, unitPrice: 1,
      productSnapshot: { id: 'verification-style', databaseId: null, name: 'Verification Style', images: [], price: 1, originalPrice: null, sizes: ['M'], colors: [{ name: 'Verification', hex: '#000000' }], category: 'Verification', gender: 'Unisex' },
    }]));
  });
  let rpcRequestObserved = false;
  let rpcPayload = null;
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/rest/v1/rpc/create_order')) {
      rpcRequestObserved = true;
      try { rpcPayload = JSON.parse(request.postData() || '{}'); } catch { rpcPayload = null; }
    }
  });
  await page.goto(`${base}/checkout`, { waitUntil: 'networkidle2' });
  await page.locator('#field-fullName').fill('Verification User');
  await page.locator('#field-email').fill('verification@example.invalid');
  await page.locator('#field-phone').fill('9876543210');
  await page.locator('#field-address').fill('123 Verification Street');
  await page.locator('#field-city').fill('Chennai');
  await page.locator('#field-state').fill('Tamil Nadu');
  await page.locator('#field-pincode').fill('600001');
  await page.evaluate(() => {
    const submit = [...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Place Order');
    if (!submit) throw new Error('Checkout place-order control is unavailable');
    submit.click();
  });
  await page.waitForFunction(() => document.querySelector('[role="alert"]')?.textContent?.length > 0, { timeout: 10000 });
  await expect(async () => rpcRequestObserved, 'configured Checkout invokes the transactional create_order RPC');
  await expect(async () => {
    const item = rpcPayload?.p_items?.[0];
    return item
      && Object.keys(item).sort().join(',') === 'quantity,variant_id'
      && typeof item.variant_id === 'string'
      && item.quantity === 1
      && !Object.prototype.hasOwnProperty.call(rpcPayload, 'total')
      && !Object.prototype.hasOwnProperty.call(rpcPayload, 'subtotal');
  }, 'Checkout sends only variant IDs and quantities, never client price, total, or stock values');
  await expect(async () => page.evaluate(() => !document.body.innerText.includes('Order Confirmed!')), 'invalid verification variant creates no order and leaves the checkout in an error state');
} catch (error) {
  failures.push(`unexpected live cart/RPC verification error: ${error.stack || error.message}`);
}

await browser.close();
const unexpectedErrors = errors.filter((error) => !error.includes('status of 400'));
if (unexpectedErrors.length) failures.push(`browser console errors: ${[...new Set(unexpectedErrors)].join(' | ')}`);
if (failures.length) {
  failures.forEach((message) => console.log(`FAIL: ${message}`));
  process.exitCode = 1;
} else {
  console.log('LIVE CART AND RPC VERIFICATION COMPLETED WITHOUT FAILURES');
}
