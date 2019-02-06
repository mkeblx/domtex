'use strict';

const puppeteer = require('puppeteer');
const { URL } = require('url');
const fs = require('fs');
const sizeOf = require('image-size');
const _util = require('util')
const fs_writeFile = _util.promisify(fs.writeFile);
const { createCanvas, loadImage, Image } = require('canvas');

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

  var scaleFactor = 1;

  var atlas = false;
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
    height: height,
    deviceScaleFactor: scaleFactor
  });

  await page.goto(url, { waitUntil: 'networkidle2' });

  var attrs;
  var textures = {};


  var includePage = true;
  // 'document' texture entry
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

    if (!fs.existsSync(path) || forceUpdate) {
      if (scaleFactor > 1) {
        let buffer = await page.screenshot(options);
        options.path = path;
        buffer = resizeBuffer(
          buffer,
          width*scaleFactor, height*scaleFactor,
          scaleFactor);
        await fs_writeFile(path, buffer, 'binary');
      } else {
        options.path = path;
        await page.screenshot(options);
      }
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
      let attrs = {};

      for (let i = 0; i < selectors.length; i++) {
        let sel = selectors[i];
        let els = document.querySelectorAll(sel);
        if (els.length === 0) {
          attrs[sel] = null;
        } else {
          for (let k = 0; k < els.length; k++) {
            if (attrs[sel]) // 1st
              continue;
            let el = els[k];
            let viewportOffset = el.getBoundingClientRect();
            let obj = {};
            obj.x = Math.round(viewportOffset.left);
            obj.y = Math.round(viewportOffset.top);
            obj.width = el.offsetWidth;
            obj.height = el.offsetHeight;

            obj.data = {};
            for (prop in el.dataset) {
              obj.data[prop] = el.dataset[prop];
            }

            if (sel == '[id]') {
              let elId = el.getAttribute('id');
              attrs['#'+elId] = obj;
            } else {
              attrs[sel] = obj;
            }
          }
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
        texture.data = _attrs.data;
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
    textures: textures,
    atlas: atlas
  };
  log(JSON.stringify(resp), true);

  await browser.close();
})().catch(err => {
  console.log('catch: ' + err);
});

function resizeBuffer(buffer, width, height, scaleFactor) {
  let dstW = width  / scaleFactor;
  let dstH = height / scaleFactor;
  const canvas = createCanvas(dstW, dstH);
  const ctx = canvas.getContext('2d');

  var img = new Image;
  img.src = buffer;
  ctx.drawImage(img, 0, 0, dstW, dstH);
  var buf = canvas.toBuffer();
  return buf;
}

async function resizeFile(filename, scaleFactor, newFilename) {
  let dims = sizeOf(filename);
  var dstWidth = dims.width / scaleFactor;
  var dstHeight = dims.height / scaleFactor;
  const canvas = createCanvas(dstWidth, dstHeight);
  const ctx = canvas.getContext('2d');

  let img = await loadImage(filename);
  ctx.drawImage(img, 0, 0, dstWidth, dstHeight);
  var buffer = canvas.toBuffer();

  var dstFile = (newFilename) ? newFilename : filename;
  await fs_writeFile(dstFile, buffer, 'binary');
}

function log(msg, force) {
  if (verbose || force)
    console.log(msg);
}
