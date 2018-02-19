const puppeteer = require('puppeteer');
const crypto = require('crypto');

const util = require('./util.js');

const argv = require('yargs')
  .usage('Usage: $0 --html [string] --w [num] --h [num]')
  .demandOption(['html'])
  .argv;

(async () => {

  const DEFAULT_FRAG = '<h1>hello html fragment</h1>';
  const DEFAULT_WIDTH = 512;
  const DEFAULT_HEIGHT = 512;

  var html = DEFAULT_FRAG;
  var width = DEFAULT_WIDTH;
  var height = DEFAULT_HEIGHT;


  if (argv.html) {
    html = argv.html;
  }
  console.log('html:');
  console.log(html);

  if (argv.w) {
    width = parseInt(argv.w, 10);
  }
  if (argv.h) {
    height = parseInt(argv.h, 10);
  }

  const browser = await puppeteer.launch({
    headless: true });

  const page = await browser.newPage();

  page.setViewport({
    width: width,
    height: height
  });

  page.setContent(html);

  var params = {
    html: html,
    width: width,
    height: height
  };
  var fileName = hash(params)+'.png';
  var path = 'output/'+fileName;
  await page.screenshot({ path: path });

  var resp = {
    path: path
  };
  console.log('response:\n' + JSON.stringify(resp));

  await browser.close();
})();

function md5(string) {
  return crypto.createHash('md5').update(string).digest('hex');
}