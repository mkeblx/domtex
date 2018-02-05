const puppeteer = require('puppeteer');
var crypto = require('crypto');
const { URL } = require('url');

const argv = require('yargs')
  .usage('Usage: $0 -url [string] -w [num] -h [num] -cx [num] -cy[num] -cw [num] -ch [num]')
  //.demandOption(['url'])
  .argv;

(async () => {
  var ars = puppeteer.defaultArgs();

  // try to get WebGL to work..
  ars.push('--use-gl=swiftshader');
  ars.push('--disable-setuid-sandbox');

  //console.log(ars);

  const DEFAULT_URL = 'http://news.ycombinator.com';
  const DEFAULT_WIDTH = 512;
  const DEFAULT_HEIGHT = 512;

  var url = DEFAULT_URL;
  var width = DEFAULT_WIDTH;
  var height = DEFAULT_HEIGHT;


  if (argv.url) {
    url = argv.url;
  }
  console.log('url: ' + url);

  if (argv.width) {
    width = parseInt(argv.width, 10);
  }
  if (argv.height) {
    height = parseInt(argv.height, 10);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ars,
    ignoreDefaultArgs: true });

  const page = await browser.newPage();

  page.setViewport({
    width: width,
    height: height
  });

  await page.goto(url, { waitUntil: 'networkidle2' });

  var fileName = md5(url).substring(0, 8)+'.png';
  var path = 'output/'+fileName;

  var options = {
    path: path
  };
  if (argv.cx && argv.cy && argv.cw && argv.ch) {
    var clip = {};
    clip.x = argv.cx;
    clip.y = argv.cy;
    clip.width = argv.cw;
    clip.height = argv.ch;
    options.clip = clip;
  }

  await page.screenshot(options);

  console.log('output: ' + path);

  await browser.close();
})();

function md5(string) {
  return crypto.createHash('md5').update(string).digest('hex');
}