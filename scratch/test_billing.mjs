import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`CONSOLE ERROR: ${msg.text()}`);
    }
  });
  page.on('pageerror', error => {
    errors.push(`PAGE ERROR: ${error.message}`);
  });

  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.type('#auth-username', 'admin_hms');
    await page.type('#auth-password', 'ham33dSh@ika7m1n4m5');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    await page.goto('http://localhost:5173/billing', { waitUntil: 'networkidle0' });
    
    // Check if table rendered
    const tableHtml = await page.evaluate(() => {
      const table = document.querySelector('table');
      return table ? 'Table found' : 'Table missing';
    });
    
    console.log(JSON.stringify({
      tableStatus: tableHtml,
      errors: errors
    }, null, 2));

  } catch (err) {
    console.error("TEST SCRIPT ERROR:", err.message);
  } finally {
    await browser.close();
  }
})();
