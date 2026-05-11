import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const DOC_PATH = 'c:/Users/asifk/Documents/antigravity/HMS/HMS_Full_Project_Documentation.md';
const OUTPUT_PATH = 'c:/Users/asifk/Documents/antigravity/HMS/HMS_Professional_RBAC_Documentation.pdf';

async function generatePDF() {
    console.log('Reading documentation...');
    let markdown = fs.readFileSync(DOC_PATH, 'utf8');

    // Simple Table Parser
    const parseTable = (markdown) => {
        const lines = markdown.split('\n');
        let html = '';
        let inTable = false;
        let tableHeader = true;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('|') && line.includes('|')) {
                if (!inTable) {
                    html += '<table style="width:100%; border-collapse:collapse; margin:20px 0;">';
                    inTable = true;
                    tableHeader = true;
                }
                if (line.includes('---')) continue; 

                const cells = line.split('|').filter(c => c !== '').map(c => c.trim());
                html += '<tr>';
                cells.forEach(cell => {
                    const tag = tableHeader ? 'th' : 'td';
                    const style = 'border:1px solid #ddd; padding:8px; text-align:left;';
                    html += `<${tag} style="${style}">${cell}</${tag}>`;
                });
                html += '</tr>';
                tableHeader = false;
            } else {
                if (inTable) {
                    html += '</table>';
                    inTable = false;
                }
                html += line + '\n';
            }
        }
        return html;
    };

    let processedContent = parseTable(markdown);

    // Basic MD to HTML conversion for the rest
    let htmlContent = processedContent
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^\*\*([^*]+)\*\*/gm, '<strong>$1</strong>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.+<\/li>)+/g, '<ul>$&</ul>')
        .replace(/\n/g, '<br>');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 40px; }
            h1 { color: #0070f3; border-bottom: 2px solid #0070f3; }
            h2 { color: #0070f3; margin-top: 30px; }
            table { font-size: 14px; }
            th { background-color: #f2f2f2; }
            ul { margin-bottom: 10px; }
        </style>
    </head>
    <body>
        ${htmlContent}
    </body>
    </html>
    `;

    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    console.log('Generating PDF...');
    await page.pdf({
        path: OUTPUT_PATH,
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    });

    await browser.close();
    console.log('PDF Generated: ' + OUTPUT_PATH);
}

generatePDF().catch(console.error);
