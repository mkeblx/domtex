// create image map of all links on page
const puppeteer = require('puppeteer');
const crypto = require('crypto');
const { URL } = require('url');
const fs = require('fs');

const argv = require('yargs')
  .usage('Usage: $0 --url [string] --w [num] --h [num]')
  //.demandOption(['url'])
  .argv;

var verbose = false;
var forceUpdate = true;

log('Generate imagemap data:');

(async () => {
  const DEFAULT_URL = 'https://news.ycombinator.com';
  const DEFAULT_WIDTH = 512;
  const DEFAULT_HEIGHT = 512;

  var url = DEFAULT_URL;
  var width = DEFAULT_WIDTH;
  var height = DEFAULT_HEIGHT;

  var options = {};

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

  var links = await page.evaluate((width, height) => {
    var links = [];
    var els = document.querySelectorAll('a');
    if (els.length === 0) {
    } else {
      for (var i = 0; i < els.length; i++) {
        var el = els[i];

        var attrs = {};
        attrs.href = el.getAttribute('href');
        var viewportOffset = el.getBoundingClientRect();
        attrs.x = Math.floor(viewportOffset.left);
        attrs.y = Math.floor(viewportOffset.top);

        if (attrs.x > width || attrs.y > height)
          continue;

        attrs.width = el.offsetWidth;
        attrs.height = el.offsetHeight;

        links.push(attrs);
      }
    }
    return links;
  }, width, height);

  if (links === null) {
    log('no links found');
  } else {
    log(links);
  }

  var fileName = md5(url+JSON.stringify(options)+width+'x'+height)
    .substring(0, 12)+'.png';
  var path = 'output/'+fileName;

  options.path = path;

  if (!fs.existsSync(path) || forceUpdate) {
    await page.screenshot(options);
  }

  var resp = {
    path: path,
    url: url,
    width: width,
    height: height,
    links: links
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