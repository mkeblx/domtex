const puppeteer = require('puppeteer');
const { URL } = require('url');
const fs = require('fs');
const sizeOf = require('image-size');

const util = require('./util.js');

const argv = require('yargs')
  .usage('Usage: $0 --url [string] --sel [string] --w [num] --h [num] --cx [num] --cy[num] --cw [num] --ch [num] --atlas --fullpage --force')
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

  var atlas = true;
  if (argv.atlas) {
    atlas = true;
  }
  var fullpage = false;
  if (argv.fullpage) {
    fullpage = true;
    if (argv.h) {
      console.log('Provide only height or fullpage parameter');
    }
  }

  forceUpdate = false || argv.force;

  var selectors = [];
  if (argv.sel) {
    selectors = argv.sel.split(',');
  }

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

  // early cache check
  var paths = [];

  var hashParams = {};
  if (selectors.length > 0) {
    for (let i = 0; i < selectors.length; i++) {
      let sel = selectors[i];
      hashParams = {
        url: url,
        sel: sel,
        width: width,
        height: height
      }
      log(hashParams);
      let fileName = util.hash(hashParams)+'.png';
      let path = 'output/'+fileName;
      paths.push(path);
    }
  } else {
    hashParams = {
      url: url,
      width: width,
      height: height
    };
    if (options.clip !== undefined) {
      hashParams.clip = clip;
    }
    log(hashParams);
    let fileName = util.hash(hashParams)+'.png';
    let path = 'output/'+fileName;
    paths.push(path);
  }

  var filesFound = 0;

  var textures = {};

  for (let i = 0; i < paths.length; i++) {
    let path = paths[i];
    let sel = selectors[i];

    if (fs.existsSync(path) && !forceUpdate) {
      let texture = {};
      if (paths.length === 1 && selectors.length === 0) {
        let dimensions = sizeOf(path);
        texture = {
          path: path,
          width: dimensions.width,
          height: dimensions.height
        };
        textures['document'] = texture;
      } else {
        let dimensions = sizeOf(path);
        texture = {
          path: path,
          width: dimensions.width,
          height: dimensions.height
        };
        textures[sel] = texture;
      }

      filesFound++;
    }

  }
  if (filesFound === paths.length) {
    let resp = {
      url: url,
      textures: textures
    };
    log('Files found, exiting early');
    log(JSON.stringify(resp), true);
    return;
  }


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


  var includePage = true;
  if (selectors.length == 0 || includePage || atlas) {
    hashParams = {
      url: url,
      width: width,
      height: height
    };
    if (options.clip !== undefined) {
      hashParams.clip = clip;
    }
    log(hashParams);
    var fileName = util.hash(hashParams)+'.png';
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
  if (selectors.length > 0) {
    log('selectors: ' + selectors);

    attrs = await page.evaluate((selectors) => {
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

    for (const _sel in attrs) {
      var texture = {};
      var _attrs = attrs[_sel];
      options.clip = _attrs;
      log(options);

      if (atlas) {
        texture.path = textures['document'].path;
        texture.x = _attrs.x;
        texture.y = _attrs.y;
        texture.width = _attrs.width;
        texture.height = _attrs.height;
      } else {
        hashParams = {
          url: url,
          sel: _sel,
          width: width,
          height: height
        };
        log(hashParams);
        var fileName = util.hash(hashParams)+'.png';
        var path = 'output/'+fileName;

        options.path = path;

        if (!fs.existsSync(path) || forceUpdate) {
          await page.screenshot(options);
        }

        texture.path = options.path;
        texture.width = _attrs.width;
        texture.height = _attrs.height;
      }

      textures[_sel] = texture;
    }

    // clear
    options.clip = null;
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
