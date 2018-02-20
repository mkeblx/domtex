const puppeteer = require('puppeteer');
const fs = require('fs');

const util = require('./util.js');

const argv = require('yargs')
  .usage('Usage: $0 --html [string] --w [num] --h [num]')
  .demandOption(['html'])
  .argv;

var verbose = true;
var forceUpdate = false;

(async () => {

  const DEFAULT_FRAG = '<h1>hello html fragment</h1>';
  const DEFAULT_WIDTH = 512;
  const DEFAULT_HEIGHT = 512;

  var html = DEFAULT_FRAG;
  var width = DEFAULT_WIDTH;
  var height = DEFAULT_HEIGHT;

  html = argv.html;
  log('html:');
  log(html);

  if (argv.w) {
    width = parseInt(argv.w, 10);
  }
  if (argv.h) {
    height = parseInt(argv.h, 10);
  }

  var params = {
    html: html,
    width: width,
    height: height
  };
  var fileName = util.hash(params)+'.png';
  var path = 'output/'+fileName;

  if (fs.existsSync(path) && !forceUpdate) {
    var resp = {
      path: path,
      width: width,
      height: height
    };
    log('response:\n' + JSON.stringify(resp), true);
    return;
  }

  const browser = await puppeteer.launch({
    headless: true });

  const page = await browser.newPage();

  page.setViewport({
    width: width,
    height: height
  });

  page.setContent(html);

  await page.screenshot({ path: path });

  var resp = {
    path: path
  };
  log('response:\n' + JSON.stringify(resp), true);

  await browser.close();
})();

function log(msg, force) {
  if (verbose || force)
    console.log(msg);
}
