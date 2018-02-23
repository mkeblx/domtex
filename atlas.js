const { createCanvas, loadImage, Image } = require('canvas');
const fs = require('fs');
const sizeOf = require('image-size');

const util = require('./util.js');

console.log('creating atlas...');

var dir = 'output/';

var images = ['97270878d94d.png','5ea510f457fa.png'];

var textures = [];

var maxWidth = 0;
var maxHeight = 0;
var totalMinHeight = 0;

// get image sizes
for (var i = 0; i < images.length; i++) {
  var img = images[i];
  let dimensions = sizeOf(dir+img);
  var w = dimensions.width;
  var h = dimensions.height;

  maxWidth = Math.max(maxWidth, w);
  maxHeight = Math.max(maxHeight, h);

  totalMinHeight += h;

  var texture = {
    path: dir+img,
    width: w,
    height: h
  };
  textures.push(texture);
  console.log(texture);

}

console.log('Max width: ' + maxWidth);

// (vertical) margin between textures
var margin = 4;

if (margin > 0) {
  totalMinHeight += (textures.length-1) * margin;
}

console.log('Min height: ' + totalMinHeight);

var width = 512;
var height = 512;

var powerOfTwo = false;

if (powerOfTwo) {
  width = util.nextPowerOfTwo(maxWidth);
  height = util.nextPowerOfTwo(totalMinHeight);
} else {
  width = maxWidth;
  height = totalMinHeight;
}

const canvas = createCanvas(width, height);
var alpha = true; // TODO: could combine with transparent page background
const ctx = canvas.getContext('2d', {alpha: alpha});

(async () => {

  var startY = 0;

  var maxWidth;

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
