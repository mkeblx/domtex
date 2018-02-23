const { createCanvas, loadImage, Image } = require('canvas');
const fs = require('fs');
const sizeOf = require('image-size');

const util = require('./util.js');

console.log('creating atlas...');

var dir = 'output/';

var images = ['97270878d94d.png','5ea510f457fa.png'];

var textures = [];

// get image sizes
for (var i = 0; i < images.length; i++) {
  var img = images[i];
  let dimensions = sizeOf(dir+img);
  var w = dimensions.width;
  var h = dimensions.height;

  var texture = {
    path: dir+img,
    width: w,
    height: h
  };
  textures.push(texture);
  console.log(texture);
}

// margin between textures
var margin = 4;

var width = 512;
var height = 512;

var powerOfTwo = true;

var rect = computeRectSize(textures, margin, powerOfTwo);
width = rect.width;
height = rect.height;

const canvas = createCanvas(width, height);
var alpha = true; // TODO: could combine with transparent page background
const ctx = canvas.getContext('2d', {alpha: alpha});

(async () => {

  var startY = 0;

  for (var i = 0; i < textures.length; i++) {
    await loadImage(textures[i].path).then((image) => {

      var w = image.width;
      var h = image.height;

      ctx.drawImage(image, 0, startY, w, h);

      startY += h + margin;

    });
  }

  console.log(canvas.toDataURL());

  var buf = canvas.toBuffer();
  fs.writeFileSync('output/test-atlas.png', buf);


})();

// compute size needed for rects
// currently simple method, layed out vertically
//  TODO: better space efficient format
// rects: array of objects with [width, height] props
// margin: spacing between textures
function computeRectSize(rects, margin, powerOfTwo) {
  var w, h;

  var maxWidth = 0, maxHeight = 0;
  var totalMinHeight = 0;

  for (var i = 0; i < rects.length; i++) {
    var rect = rects[i];
    maxWidth = Math.max(maxWidth, rect.width);
    maxHeight = Math.max(maxHeight, rect.height);

    totalMinHeight += rect.height;
  }

  if (margin > 0) {
    totalMinHeight += (rects.length-1) * margin;
  }

  if (powerOfTwo) {
    w = util.nextPowerOfTwo(maxWidth);
    h = util.nextPowerOfTwo(totalMinHeight);
  } else {
    w = maxWidth;
    h = totalMinHeight;
  }

  return { width: w, height: h };
}