const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request =>
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText)
  );

  console.log('Navigating...');
  await page.goto('https://prompt-polish-ivory.vercel.app', { waitUntil: 'networkidle0' });
  console.log('Navigation complete. HTML:');
  const html = await page.content();
  console.log(html.substring(0, 500));
  await browser.close();
})();
