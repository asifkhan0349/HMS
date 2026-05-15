import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.resolve(__dirname, 'docs', 'strategy_report.html');
const outputPath = path.resolve(__dirname, 'HMS_Strategy_Operations_Report.pdf');

(async () => {
  try {
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
    });
    
    await browser.close();
    console.log('PDF generated successfully: ' + outputPath);
  } catch (err) {
    console.error('Error generating PDF:', err);
    process.exit(1);
  }
})();
