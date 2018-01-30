const puppeteer = require('puppeteer');

(async () => {
  var ars = puppeteer.defaultArgs();

  // try to get WebGL to work..
  ars.push('--use-gl=swiftshader');
  ars.push('--disable-setuid-sandbox');

  console.log(ars);

  var site = 'http://news.ycombinator.com';

  const browser = await puppeteer.launch({
    headless: true,
    args: ars,
    ignoreDefaultArgs: false });
  const page = await browser.newPage();
  await page.goto(site, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'hn.png' });

  await browser.close();
})();