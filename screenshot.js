const puppeteer = require('puppeteer');
var crypto = require('crypto');
const { URL } = require('url');
var fs = require('fs');

const argv = require('yargs')
  .usage('Usage: $0 --url [string] --sel [string] --w [num] --h [num] --cx [num] --cy[num] --cw [num] --ch [num]')
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

  var attrs;
  var textures = {};

  if (argv.sel) {
    var selectors = argv.sel;
    log('selectors: ' + selectors);

    attrs = await page.evaluate((selectors) => {

      var selectors = selectors.split(',');

      var attrs = {};

      for (var i = 0; i < selectors.length; i++) {
        var sel = selectors[i];
        var el = document.querySelector(sel);
        if (el === null) {
          attrs[sel] = null;
        } else {
          var viewportOffset = el.getBoundingClientRect();
          var obj = {};
          obj.x = viewportOffset.left;
          obj.y = viewportOffset.top;
          obj.width = el.offsetWidth;
          obj.height = el.offsetHeight;
          attrs[sel] = obj;
        }
      }

      return attrs;

    }, selectors);

    if (attrs === null) { // TODO: check if empty object not null
      log('selector not found');
    } else {
      log(Object.keys(attrs).length + ' selectors found');
      log(attrs);
    }

    for (var prop in attrs) {
      options.clip = attrs[prop];

      var fileName = md5(url+JSON.stringify(options)+width+'x'+height)
        .substring(0, 12)+'.png';
      var path = 'output/'+fileName;

      options.path = path;

      if (!fs.existsSync(path) || forceUpdate) {
        await page.screenshot(options);
      }

      var texture = {};
      texture.path = options.path;
      if (options.clip && options.clip.width && options.clip.height) {
        texture.width = options.clip.width;
        texture.height = options.clip.height;
      }

      textures[prop] = texture;
    }
  } else { // whole page
    var fileName = md5(url+JSON.stringify(options)+width+'x'+height)
      .substring(0, 12)+'.png';
    var path = 'output/'+fileName;

    options.path = path;


    if (!fs.existsSync(path) || forceUpdate) {
      await page.screenshot(options);
    }

    var texture = {};
    texture.path = options.path;
    texture.width = width;
    texture.height = height;
    if (options.clip && options.clip.width && options.clip.height) {
      texture.width = options.clip.width;
      texture.height = options.clip.height;
    }

    textures['document'] = texture;
  }

  var resp = {
    url: url,
    textures: textures
  };
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