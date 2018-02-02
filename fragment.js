const puppeteer = require('puppeteer');

(async () => {

  const DEFAULT_FRAG = '<h1>hello html fragment</h1>';
  const DEFAULT_WIDTH = 500;
  const DEFAULT_HEIGHT = 500;

  var html = DEFAULT_FRAG;
  var width = DEFAULT_WIDTH;
  var height = DEFAULT_HEIGHT;

  process.argv.forEach(function (val, index, array) {
    console.log(index + ': ' + val);
  });

  if (process.argv.length > 2) {
    html = process.argv[2];
  }
  console.log(html);

  if (process.argv.length > 3) {
    width = parseInt(process.argv[3], 10);
  }
  if (process.argv.length > 4) {
    height = parseInt(process.argv[4], 10);
  }

  const browser = await puppeteer.launch({
    headless: true });

  const page = await browser.newPage();

  page.setViewport({
    width: width,
    height: height
  });

  page.setContent(html);

  await page.screenshot({ path: 'output/fragment.png' });

  await browser.close();

})();