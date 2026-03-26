import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const DOC_PATH = 'c:/Users/asifk/Documents/antigravity/HMS/docs/app_manual.md';
const OUTPUT_PATH = 'c:/Users/asifk/Documents/antigravity/HMS/HMS_Professional_Documentation.pdf';

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
            if (line.startsWith('|') && line.endsWith('|')) {
                if (!inTable) {
                    html += '<table>';
                    inTable = true;
                    tableHeader = true;
                }
                if (line.includes('---')) continue; // Skip separator line

                const cells = line.split('|').filter(c => c !== '').map(c => c.trim());
                html += '<tr>';
                cells.forEach(cell => {
                    const tag = tableHeader ? 'th' : 'td';
                    html += `<${tag}>${cell}</${tag}>`;
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

    // Generate TOC
    const headers = [];
    const headerRegex = /^(#{1,3}) (.+)$/gm;
    let match;
    while ((match = headerRegex.exec(markdown)) !== null) {
        headers.push({
            level: match[1].length,
            title: match[2],
            id: match[2].toLowerCase().replace(/[^\w]+/g, '-')
        });
    }

    let tocHtml = '<div class="toc-page"><h1>Table of Contents</h1><ul>';
    headers.forEach(header => {
        if (header.level === 1 && header.title.includes('Manual')) return; // Skip main title in TOC
        tocHtml += `<li class="toc-level-${header.level}"><a href="#${header.id}">${header.title}</a></li>`;
    });
    tocHtml += '</ul></div>';

    // Enhanced Markdown to HTML converter
    let htmlContent = processedContent
        .replace(/^# (.+)$/gm, (m, title) => `<h1 id="${title.toLowerCase().replace(/[^\w]+/g, '-')}">${title}</h1>`)
        .replace(/^## (.+)$/gm, (m, title) => `<h2 id="${title.toLowerCase().replace(/[^\w]+/g, '-')}">${title}</h2>`)
        .replace(/^### (.+)$/gm, (m, title) => `<h3 id="${title.toLowerCase().replace(/[^\w]+/g, '-')}">${title}</h3>`)
        .replace(/^\*\*([^*]+)\*\*/gm, '<strong>$1</strong>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.+<\/li>)+/g, '<ul>$&</ul>')
        .replace(/!\[([^\]]*)\]\((file:\/\/\/([^)]+))\)/g, (match, alt, uri, filePath) => {
            const winPath = filePath.startsWith('c:/') ? filePath.replace('c:/', 'C:/') : filePath;
            if (fs.existsSync(winPath)) {
                const base64 = fs.readFileSync(winPath).toString('base64');
                return `<img src="data:image/png;base64,${base64}" alt="${alt}" class="embedded-image">`;
            }
            return `<p style="color: red;">Image not found: ${winPath}</p>`;
        })
        .replace(/^> \[!NOTE\]\s*\n> (.+)$/gm, '<div class="note"><strong>Note:</strong> $1</div>')
        .replace('[[TOC]]', tocHtml);

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
            
            :root {
                --primary: #0070f3;
                --text: #171717;
                --text-muted: #666;
                --border: #eaeaea;
                --bg: #ffffff;
            }

            body { 
                font-family: 'Outfit', sans-serif; 
                line-height: 1.3; 
                color: var(--text); 
                max-width: 900px; 
                margin: 0 auto; 
                padding: 0;
            }

            /* Cover Page */
            .cover-page {
                height: 290mm;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                background: linear-gradient(135deg, #f6f9fc 0%, #eef2f7 100%);
                page-break-after: always;
                margin: 0;
            }

            .cover-title { font-size: 64px; font-weight: 700; margin: 0; background: linear-gradient(to right, #0070f3, #00dfd8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .cover-subtitle { font-size: 20px; color: var(--text-muted); margin: 10px 0 40px 0; }

            /* TOC */
            .toc-page { padding: 20px 0; page-break-after: always; }
            .toc-page h1 { font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid var(--border); }
            .toc-page ul { list-style: none; padding: 0; }
            .toc-page li { margin-bottom: 5px; }
            .toc-page a { text-decoration: none; color: var(--text); font-size: 14px; }
            .toc-level-1 { font-weight: 700; margin-top: 10px; }
            .toc-level-2 { margin-left: 15px; border-bottom: 1px dotted var(--border); display: block; font-weight: 600; }
            .toc-level-3 { margin-left: 30px; border-bottom: 1px dotted var(--border); display: block; font-size: 13px; color: var(--text-muted); }

            /* Content */
            h1 { font-size: 28px; margin: 20px 0 10px 0; border-bottom: 2px solid var(--primary); padding-bottom: 5px; }
            h2 { font-size: 22px; margin: 15px 0 8px 0; color: var(--primary); }
            h3 { font-size: 16px; margin: 12px 0 6px 0; }

            p { margin: 0 0 10px 0; }
            ul { margin: 0 0 10px 0; padding-left: 20px; }
            li { margin-bottom: 3px; }

            /* Tables */
            table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; table-layout: fixed; }
            th { background: #f6f9fc; color: var(--primary); font-weight: 700; text-align: left; padding: 10px; border: 1px solid var(--border); }
            td { padding: 8px; border: 1px solid var(--border); vertical-align: middle; word-wrap: break-word; }
            tr:nth-child(even) { background: #fafafa; }

            .embedded-image { max-width: 100%; height: auto; border-radius: 4px; border: 1px solid var(--border); display: block; margin-bottom: 25px; }
            td .embedded-image { max-height: 120px; margin: 0 auto; margin-bottom: 0; }

            .note { background: #f0f7ff; border-left: 5px solid var(--primary); padding: 10px; border-radius: 0 4px 4px 0; margin: 15px 0; font-size: 13px; }

            @media print {
                html, body { height: 100%; margin: 0 !important; padding: 0 !important; }
                .main-content { padding: 15mm; }
                h1, h2, h3 { page-break-after: avoid; }
                tr { page-break-inside: avoid; }
                img { page-break-inside: avoid; }
            }
        </style>
    </head>
    <body>
        <div class="cover-page">
            <h1 class="cover-title">HMS Elite</h1>
            <p class="cover-subtitle">Hospital Management System<br>Technical Documentation & User Manual</p>
            <div style="margin: 20px 0;">
                <svg width="60" height="60" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#0070f3" stroke-width="2" />
                    <path d="M30 50 L70 50 M50 30 L50 70" stroke="#0070f3" stroke-width="8" stroke-linecap="round" />
                </svg>
            </div>
            <div style="margin-top: 30px; color: var(--text-muted); font-size: 12px;">
                <p><strong>Prepared for:</strong> Team Lead</p>
                <p><strong>Version:</strong> 1.0.0 | March 2026</p>
            </div>
        </div>

        <div class="main-content">
            ${htmlContent}
        </div>
    </body>
    </html>
    `;

    console.log('Launching Puppeteer...');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    console.log('Generating PDF...');
    await page.pdf({
        path: OUTPUT_PATH,
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }, // Margins are handled in CSS
        displayHeaderFooter: true,
        headerTemplate: '<span></span>', // No header to save space
        footerTemplate: '<div style="font-size: 8px; color: #999; margin-left: auto; margin-right: 15mm; font-family: sans-serif;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
    });

    await browser.close();
    console.log('Zero-Whitespace PDF Successfully Saved to:', OUTPUT_PATH);
}

generatePDF().catch(console.error);
