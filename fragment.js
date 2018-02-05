const puppeteer = require('puppeteer');

(async () => {

  const DEFAULT_FRAG = '<h1>hello html fragment</h1>';
  const DEFAULT_WIDTH = 500;
  const DEFAULT_HEIGHT = 500;

  var html = DEFAULT_FRAG;
  var width = DEFAULT_WIDTH;
  var height = DEFAULT_HEIGHT;

  var args = process.argv.slice(2);

  args.forEach(function (val, index, array) {
    console.log(index + ': ' + val);
  });

  if (args.length > 0) {
    html = args[0];
  }
  console.log('html:');
  console.log(html);

  if (args.length > 1) {
    width = parseInt(args[1], 10);
  }
  if (args.length > 2) {
    height = parseInt(args[2], 10);
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