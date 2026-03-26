import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

async function generatePresentationPdf() {
    const markdownPath = path.join(process.cwd(), 'docs', 'presentation_guide.md');
    const outputPath = path.join(process.cwd(), 'HMS_Presentation_Preparation.pdf');

    console.log('Reading presentation guide...');
    const markdown = fs.readFileSync(markdownPath, 'utf8');
    const htmlContent = marked(markdown);

    const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            body { 
                font-family: 'Inter', sans-serif; 
                line-height: 1.6; 
                color: #171717; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 40px;
                background: #fff;
            }
            h1 { color: #0070f3; font-size: 32px; border-bottom: 2px solid #eaeaea; padding-bottom: 10px; margin-bottom: 30px; }
            h2 { color: #0070f3; font-size: 24px; margin-top: 40px; }
            h3 { color: #444; font-size: 18px; margin-top: 30px; border-left: 4px solid #0070f3; padding-left: 15px; }
            hr { border: 0; border-top: 1px solid #eaeaea; margin: 40px 0; }
            code { background: #f4f4f4; padding: 2px 5px; border-radius: 4px; font-family: monospace; }
            strong { color: #000; }
            ul { padding-left: 20px; }
            li { margin-bottom: 10px; }
            blockquote { 
                background: #f9f9f9; 
                border-left: 5px solid #ccc; 
                margin: 1.5em 10px; 
                padding: 0.5em 10px; 
            }
            .speak-block {
                background: #f0f7ff;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #0070f3;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        ${htmlContent.replace(/<strong>Speak this:<\/strong>/g, '<div class="speak-block"><strong>Speak this:</strong>')}
    </body>
    </html>
    `;

    console.log('Launching Puppeteer...');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    console.log('Generating PDF...');
    await page.pdf({
        path: outputPath,
        format: 'A4',
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        printBackground: true
    });

    await browser.close();
    console.log('PDF saved to HMS_Presentation_Preparation.pdf');
}

generatePresentationPdf().catch(console.error);
