import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const DOC_PATH = 'C:/Users/asifk/.gemini/antigravity/brain/8b0c8b40-f92d-4c95-9380-5e84874b0c69/application_overview.md';
const OUTPUT_PATH = 'C:/Users/asifk/Documents/antigravity/HMS/HMS_Documentation.pdf';

async function generatePDF() {
    console.log('Reading documentation...');
    let markdown = fs.readFileSync(DOC_PATH, 'utf8');

    // Simple Markdown to HTML converter for the specific document structure
    let htmlContent = markdown
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^\*\*([^*]+)\*\*/gm, '<strong>$1</strong>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.+<\/li>)+/g, '<ul>$&</ul>')
        .replace(/!\[([^\]]*)\]\((file:\/\/\/([^)]+))\)/g, (match, alt, uri, filePath) => {
            const absolutePath = filePath.replace(/^\/+/, ''); // Fix path for Windows
            if (fs.existsSync(absolutePath)) {
                const base64 = fs.readFileSync(absolutePath).toString('base64');
                return `<img src="data:image/png;base64,${base64}" alt="${alt}" style="max-width: 100%; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.12); margin: 20px 0;">`;
            }
            return `<p style="color: red;">Image not found: ${absolutePath}</p>`;
        })
        .replace(/^> \[!NOTE\]\s*\n> (.+)$/gm, '<div class="note"><strong>Note:</strong> $1</div>')
        .replace(/\| (.+) \| (.+) \|/g, '<tr><td>$1</td><td>$2</td></tr>')
        .replace(/(<tr>.+<\/tr>)+/g, '<table border="1">$&</table>')
        .replace(/---/g, '<hr>')
        .replace(/```bash\n([\s\S]+?)\n```/g, '<pre><code>$1</code></pre>');

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { 
                font-family: 'Inter', -apple-system, sans-serif; 
                line-height: 1.6; 
                color: #1a1a1a; 
                max-width: 900px; 
                margin: 0 auto; 
                padding: 40px;
                background: #fff;
            }
            h1 { font-size: 32px; color: #000; border-bottom: 2px solid #eaeaea; padding-bottom: 10px; margin-top: 40px; }
            h2 { font-size: 24px; color: #333; margin-top: 30px; border-left: 4px solid #000; padding-left: 15px; }
            h3 { font-size: 18px; color: #444; margin-top: 20px; }
            ul { padding-left: 20px; }
            li { margin-bottom: 8px; }
            pre { background: #f4f4f4; padding: 15px; border-radius: 8px; font-family: 'Courier New', monospace; overflow-x: auto; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; border: none; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #efefef; }
            tr:first-child td { font-weight: 700; background: #f9f9f9; }
            hr { border: 0; border-top: 1px solid #eee; margin: 40px 0; }
            .note { background: #f0f7ff; border-left: 4px solid #007bff; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0; }
            img { display: block; margin: 30px auto; }
            @media print {
                body { padding: 0; }
                .page-break { page-break-before: always; }
            }
        </style>
    </head>
    <body>
        ${htmlContent}
    </body>
    </html>
    `;

    console.log('Launching Puppeteer...');
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
    console.log('PDF Successfully Saved to:', OUTPUT_PATH);
}

generatePDF().catch(console.error);
