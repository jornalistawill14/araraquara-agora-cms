// Renderiza a arte em PNG 1080x1350 (feed do Instagram/Facebook).
// Uso: node render.js            -> saida/patrimonio-trabiju-feed.png (mural sem a data da câmera)
//      node render.js cru        -> saida/patrimonio-trabiju-feed-mural-cru.png (foto do mural intocada)
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const cru = process.argv[2] === 'cru';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  const url = 'file://' + path.join(__dirname, 'index.html') + (cru ? '?mural=cru' : '');
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const nome = cru ? 'patrimonio-trabiju-feed-mural-cru.png' : 'patrimonio-trabiju-feed.png';
  await page.locator('#arte').screenshot({ path: path.join(__dirname, 'saida', nome) });
  await browser.close();
  console.log('ok', nome);
})();
