const puppeteer = require('puppeteer');
var crypto = require('crypto');
const { URL } = require('url');
var fs = require('fs');

const argv = require('yargs')
  .usage('Usage: $0 --url [string] --w [num] --h [num] --cx [num] --cy[num] --cw [num] --ch [num] --sel [string]')
  //.demandOption(['url'])
  .argv;

var verbose = false;
var forceUpdate = false;

(async () => {
  const DEFAULT_URL = 'https://news.ycombinator.com';
  const DEFAULT_WIDTH = 512;
  const DEFAULT_HEIGHT = 512;

  var url = DEFAULT_URL;
  var width = DEFAULT_WIDTH;
  var height = DEFAULT_HEIGHT;

  var options = {};

  if (argv.cx && argv.cy && argv.cw && argv.ch) {
    var clip = {};
    clip.x = argv.cx;
    clip.y = argv.cy;
    clip.width = argv.cw;
    clip.height = argv.ch;
    options.clip = clip;
  }

  if (argv.url) {
    url = argv.url;
    if (!url.startsWith('http'))
      url += 'http://';
  }
  log('url: ' + url);

  if (argv.w) {
    width = parseInt(argv.w, 10);
  }
  if (argv.h) {
    height = parseInt(argv.h, 10);
  }

  // TODO: avoid this setup if already in cache
  const browser = await puppeteer.launch({
    headless: true });

  const page = await browser.newPage();

  page.setViewport({
    width: width,
    height: height
  });

  await page.goto(url, { waitUntil: 'networkidle2' });

  if (argv.sel) {
    var selector = argv.sel;
    var el = await page.$(selector);

    var attrs = await page.evaluate((sel) => {
      var attrs = {};
      var el = document.querySelector(sel);
      if (el === null) {
        attrs = null;
      } else {
        var viewportOffset = el.getBoundingClientRect();
        attrs.x = viewportOffset.left;
        attrs.y = viewportOffset.top;
        attrs.width = el.offsetWidth;
        attrs.height = el.offsetHeight;
      }
      return attrs;
    }, selector);

    if (attrs === null) {
      log('selector not found');
    } else {
      log(attrs);
      options.clip = attrs;
    }
  }

  var fileName = md5(url+JSON.stringify(options)+width+'x'+height)
    .substring(0, 12)+'.png';
  var path = 'output/'+fileName;

  options.path = path;

  if (!fs.existsSync(path) && !forceUpdate) {
    await page.screenshot(options);
  }

  var resp = {
    path: path,
    url: url,
    width: width,
    height: height
  };
  if (options.clip && options.clip.width && options.clip.height) {
    resp.width = options.clip.width;
    resp.height = options.clip.height;
  }
  log(JSON.stringify(resp), true);

  await browser.close();
})().catch(err => {
  console.log('catch: ' + err);
});

function log(msg, force) {
  if (verbose || force)
    console.log(msg);
}

function md5(string) {
  return crypto.createHash('md5').update(string).digest('hex');
}