import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

async function generateArchitecturePdf() {
    const markdownPath = path.join(process.cwd(), 'docs', 'architecture_report.md');
    const outputPath = path.join(process.cwd(), 'HMS_Architecture_Refactor_Report.pdf');

    if (!fs.existsSync(markdownPath)) {
        console.error('Error: Source markdown file not found at ' + markdownPath);
        process.exit(1);
    }

    console.log('Reading architecture report...');
    const markdown = fs.readFileSync(markdownPath, 'utf8');
    const htmlContent = marked(markdown);

    const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            body { 
                font-family: 'Outfit', sans-serif; 
                line-height: 1.6; 
                color: #2D3748; 
                max-width: 900px; 
                margin: 0 auto; 
                padding: 50px;
                background: #fff;
            }
            h1 { 
                color: #2B6CB0; 
                font-size: 36px; 
                border-bottom: 3px solid #E2E8F0; 
                padding-bottom: 15px; 
                margin-bottom: 40px;
                text-align: center;
            }
            h2 { 
                color: #2C5282; 
                font-size: 26px; 
                margin-top: 50px; 
                background: #EBF8FF;
                padding: 10px 15px;
                border-radius: 6px;
            }
            h3 { color: #4A5568; font-size: 20px; margin-top: 30px; border-left: 5px solid #3182CE; padding-left: 15px; }
            hr { border: 0; border-top: 2px solid #EDF2F7; margin: 50px 0; }
            
            pre { 
                background: #1A202C; 
                color: #F7FAFC;
                padding: 20px; 
                border-radius: 8px; 
                font-family: 'Fira Code', 'Courier New', monospace; 
                overflow-x: auto;
                font-size: 14px;
                line-height: 1.4;
                margin: 20px 0;
            }
            code { 
                background: #EDF2F7; 
                padding: 2px 6px; 
                border-radius: 4px; 
                font-family: monospace; 
                color: #E53E3E;
                font-weight: 600;
            }
            pre code {
                background: transparent;
                color: inherit;
                padding: 0;
                font-weight: normal;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin: 30px 0;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                border-radius: 8px;
                overflow: hidden;
            }
            th {
                background-color: #3182CE;
                color: white;
                text-align: left;
                padding: 12px 15px;
                font-weight: 600;
            }
            td {
                padding: 12px 15px;
                border-bottom: 1px solid #E2E8F0;
            }
            tr:nth-child(even) { background-color: #F7FAFC; }
            
            ul { padding-left: 25px; }
            li { margin-bottom: 12px; }
            
            .footer {
                margin-top: 60px;
                text-align: center;
                font-size: 12px;
                color: #A0AEC0;
                border-top: 1px solid #E2E8F0;
                padding-top: 20px;
            }
        </style>
    </head>
    <body>
        ${htmlContent}
        <div class="footer">
            Hospital Management System — Technical Architectural Review &copy; 2026
        </div>
    </body>
    </html>
    `;

    console.log('Launching PDF engine...');
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    console.log('Rendering professional PDF...');
    await page.pdf({
        path: outputPath,
        format: 'A4',
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        printBackground: true,
        displayHeaderFooter: false
    });

    await browser.close();
    console.log('Success! PDF saved to: ' + outputPath);
}

generateArchitecturePdf().catch(err => {
    console.error('FAILED TO GENERATE PDF:', err);
    process.exit(1);
});
