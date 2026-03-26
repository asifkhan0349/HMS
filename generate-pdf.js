import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imgDir = path.join(process.env.USERPROFILE, '.gemini', 'antigravity', 'brain', 'a704a5c3-f914-449b-be94-a461679971f2');
const htmlPath = path.resolve(__dirname, 'docs', 'documentation.html');
const outputPath = path.resolve(__dirname, 'HMS_Documentation.pdf');

let html = fs.readFileSync(htmlPath, 'utf8');

// Replace all IMG_DIR/filename.png references with base64 data URIs
html = html.replace(/IMG_DIR\/([^"]+\.png)/g, (match, filename) => {
  const imgPath = path.join(imgDir, filename);
  if (fs.existsSync(imgPath)) {
    const base64 = fs.readFileSync(imgPath).toString('base64');
    console.log('Embedded: ' + filename);
    return `data:image/png;base64,${base64}`;
  } else {
    console.warn('Image not found: ' + imgPath);
    return match;
  }
});

console.log('Launching browser...');
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();

await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });

await page.pdf({
  path: outputPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
  displayHeaderFooter: false,
});

await browser.close();
console.log('PDF generated successfully: ' + outputPath);
