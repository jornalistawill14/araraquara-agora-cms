// Renderiza a arte em PNG 1080x1350 (feed do Instagram/Facebook).
// Uso: node render.js  -> saida/patrimonio-trabiju-feed.png
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'index.html'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const nome = 'patrimonio-trabiju-feed.png';
  await page.locator('#arte').screenshot({ path: path.join(__dirname, 'saida', nome) });
  await browser.close();
  console.log('ok', nome);
})();
