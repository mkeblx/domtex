const { createCanvas, loadImage, Image } = require('canvas');
const fs = require('fs');

const width = 512;
const height = 512;

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

console.log('creating atlas...');

var images = ['97270878d94d.png','5ea510f457fa.png'];

(async () => {

  var startY = 0;

  for (var i = 0; i < images.length; i++) {
    await loadImage('output/'+images[i]).then((image) => {

      var w = image.width;
      var h = image.height;

      ctx.drawImage(image, 0, startY, w, h);

      startY += h;

    });
  }

  console.log(canvas.toDataURL());

  var buf = canvas.toBuffer();
  fs.writeFileSync('output/test-atlas.png', buf);


})();