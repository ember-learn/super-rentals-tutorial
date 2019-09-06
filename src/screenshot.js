const puppeteer = require('puppeteer');

(async () => {
  console.log('hi');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({
    width: 920,
    height: 690,
    deviceScaleFactor: 2.0,
  });
  await page.goto('http://localhost:4200');
  await page.screenshot({ path: 'example@2x.png' });
  await browser.close();
  console.log('bye');
})();
