const puppeteer = require('puppeteer');

(async () => {

  var html = '<h1>hello html fragment</h1>';

  const browser = await puppeteer.launch({
    headless: true });

  const page = await browser.newPage();

  page.setContent(html);

  await page.screenshot({ path: 'output/fragment.png' });

  await browser.close();

})();