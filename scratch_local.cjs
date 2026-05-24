const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log('Navigating...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  console.log('Navigation complete. HTML:');
  const html = await page.content();
  console.log(html.substring(0, 1000));
  await browser.close();
  process.exit(0);
})();
