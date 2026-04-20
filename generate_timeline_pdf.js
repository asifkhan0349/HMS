import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

async function generateTimelinePdf() {
    const markdownPath = path.join(process.cwd(), 'docs', 'project_timeline.md');
    const outputPath = path.join(process.cwd(), 'HMS_Project_Timeline.pdf');

    console.log('Reading project timeline...');
    const markdown = fs.readFileSync(markdownPath, 'utf8');
    const htmlContent = marked(markdown);

    const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            @page {
                size: A4;
                margin: 20mm;
            }
            body { 
                font-family: 'Inter', sans-serif; 
                line-height: 1.6; 
                color: #1a1a1a; 
                max-width: 900px; 
                margin: 0 auto; 
                padding: 20px;
                background: #fff;
            }
            h1 { 
                color: #0070f3; 
                font-size: 32px; 
                border-bottom: 3px solid #0070f3; 
                padding-bottom: 15px; 
                margin-bottom: 40px;
                text-align: center;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            h2 { 
                color: #0070f3; 
                font-size: 22px; 
                margin-top: 40px; 
                border-bottom: 1px solid #eaeaea;
                padding-bottom: 8px;
            }
            h3 { 
                color: #333; 
                font-size: 18px; 
                margin-top: 30px; 
                background: #f0f7ff;
                padding: 10px 15px;
                border-left: 5px solid #0070f3;
                border-radius: 0 4px 4px 0;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 30px 0;
                font-size: 14px;
            }
            th {
                background-color: #0070f3;
                color: white;
                text-align: left;
                padding: 12px;
            }
            td {
                padding: 12px;
                border-bottom: 1px solid #eee;
            }
            tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            hr { border: 0; border-top: 1px solid #eaeaea; margin: 40px 0; }
            ul { padding-left: 25px; }
            li { margin-bottom: 12px; }
            em { color: #666; font-style: italic; }
            strong { color: #000; font-weight: 600; }
            
            .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 12px;
                color: #999;
                border-top: 1px solid #eee;
                padding-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="header-decoration"></div>
        ${htmlContent}
        <div class="footer">
            Generated internally for Hospital Management System Project Review &copy; 2026
        </div>
    </body>
    </html>
    `;

    console.log('Launching Puppeteer...');
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    console.log('Generating PDF...');
    await page.pdf({
        path: outputPath,
        format: 'A4',
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        printBackground: true,
        displayHeaderFooter: false
    });

    await browser.close();
    console.log('PDF saved to HMS_Project_Timeline.pdf');
}

generateTimelinePdf().catch(console.error);
