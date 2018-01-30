const puppeteer = require('puppeteer');

(async () => {
  var options = {
    chromeArgs: {}
  };

  // TODO: echo thos

  var ars = puppeteer.defaultArgs();

  console.log('test');

  console.log(ars);

for (var property in puppeteer) {
    if (object.hasOwnProperty(property)) {
        console.log('1');
    }
}

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--use-gl=swiftshader-webgl",'--disable-setuid-sandbox'],
    ignoreDefaultArgs: false });
  const page = await browser.newPage();
  await page.goto('https://threejs.org/examples/#webgl_geometries', {waitUntil: 'networkidle2'});
  await page.screenshot({path: 'hn.png'});

  await browser.close();
})();