/**
 * download_invoice_pdf.mjs
 *
 * Reads invoice JSON from stdin, generates a PDF with Puppeteer, and writes
 * the raw PDF bytes to stdout. The Python caller streams those bytes directly
 * to the HTTP client as an application/pdf download.
 *
 * stdin payload:  { invoice: {...}, line_items: [...] }
 * stdout:         raw PDF bytes
 * stderr / exit 1: error message string
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import puppeteer from 'puppeteer';

const readStdin = async () =>
  new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const currency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

const renderInvoiceHtml = (invoice, lineItems = []) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: Arial, sans-serif;
        color: #0f172a;
        margin: 0;
        padding: 32px;
        background: #f8fafc;
      }
      .sheet {
        background: #ffffff;
        border: 1px solid #dbeafe;
        border-radius: 16px;
        padding: 36px;
        max-width: 760px;
        margin: 0 auto;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 28px;
        padding-bottom: 20px;
        border-bottom: 2px solid #e2e8f0;
      }
      .brand { font-size: 26px; font-weight: 700; color: #0f766e; }
      .eyebrow {
        color: #64748b;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .invoice-id { font-size: 14px; color: #475569; margin-top: 6px; }
      .status-badge {
        display: inline-block;
        padding: 5px 14px;
        border-radius: 999px;
        background: #dcfce7;
        color: #166534;
        font-size: 12px;
        font-weight: 700;
        margin-top: 10px;
      }
      .info-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
        margin-bottom: 28px;
      }
      .info-card {
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 14px 16px;
      }
      .info-label {
        color: #64748b;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 6px;
      }
      .info-value { font-size: 15px; font-weight: 600; color: #0f172a; }
      .section-title {
        font-size: 13px;
        font-weight: 700;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 10px;
      }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      thead tr { background: #f1f5f9; }
      th {
        text-align: left;
        padding: 12px 14px;
        font-size: 11px;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        border-bottom: 2px solid #e2e8f0;
      }
      th.right, td.right { text-align: right; }
      td {
        padding: 13px 14px;
        font-size: 13px;
        border-bottom: 1px solid #f1f5f9;
        color: #1e293b;
      }
      tr:last-child td { border-bottom: none; }
      .total-row {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 16px;
        padding: 16px 14px;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 10px;
        margin-top: 4px;
      }
      .total-label { font-size: 13px; font-weight: 600; color: #475569; }
      .total-amount { font-size: 22px; font-weight: 700; color: #166534; }
      .footer {
        margin-top: 32px;
        padding-top: 18px;
        border-top: 1px solid #e2e8f0;
        font-size: 11px;
        color: #94a3b8;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="header">
        <div>
          <div class="eyebrow">Hospital Management System</div>
          <div class="brand">HMS Core</div>
          <div class="invoice-id">Invoice #${escapeHtml(invoice.invoice_code)}</div>
          <div class="status-badge">${escapeHtml(invoice.status)}</div>
        </div>
        <div style="text-align:right">
          <div class="eyebrow">Issued On</div>
          <div class="info-value">${escapeHtml(invoice.invoice_date)}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-card">
          <div class="info-label">Invoice ID</div>
          <div class="info-value">${escapeHtml(invoice.invoice_code)}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Patient Name</div>
          <div class="info-value">${escapeHtml(invoice.patient_name)}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Date</div>
          <div class="info-value">${escapeHtml(invoice.invoice_date)}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Payment Method</div>
          <div class="info-value">${escapeHtml(invoice.payment_method)}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Payment Status</div>
          <div class="info-value">${escapeHtml(invoice.status)}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Total Amount</div>
          <div class="info-value" style="color:#0f766e">${escapeHtml(currency(invoice.amount))}</div>
        </div>
      </div>

      <div class="section-title">Medicine Details</div>
      <table>
        <thead>
          <tr>
            <th>Medicine</th>
            <th class="right">Price</th>
            <th class="right">Quantity</th>
            <th class="right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${lineItems.length > 0
            ? lineItems.map(item => `
          <tr>
            <td>${escapeHtml(item.name)}</td>
            <td class="right">${escapeHtml(currency(item.price))}</td>
            <td class="right">${escapeHtml(String(item.quantity))}</td>
            <td class="right">${escapeHtml(currency(item.subtotal))}</td>
          </tr>`).join('')
            : `<tr><td colspan="4" style="color:#94a3b8;font-style:italic;text-align:center">
              No medicine line items recorded for this invoice.
            </td></tr>`
          }
        </tbody>
      </table>

      <div class="total-row">
        <span class="total-label">Grand Total</span>
        <span class="total-amount">${escapeHtml(currency(invoice.amount))}</span>
      </div>

      <div class="footer">
        This is a computer-generated invoice. No signature required. &nbsp;|&nbsp; HMS Core &copy; ${new Date().getFullYear()}
      </div>
    </div>
  </body>
</html>`;

const main = async () => {
  const rawInput = await readStdin();
  const payload = JSON.parse(rawInput || '{}');

  const invoice = payload.invoice;
  const lineItems = Array.isArray(payload.line_items) ? payload.line_items : [];
  const pdfPath = path.join(os.tmpdir(), `download_${invoice.invoice_code}_${Date.now()}.pdf`);

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  try {
    const page = await browser.newPage();
    await page.setContent(renderInvoiceHtml(invoice, lineItems), { waitUntil: 'networkidle0' });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', right: '16mm', bottom: '18mm', left: '16mm' },
    });

    // Write raw PDF bytes to stdout for Python to stream
    const pdfBytes = await fs.readFile(pdfPath);
    process.stdout.write(pdfBytes);
  } finally {
    await browser.close();
    await fs.rm(pdfPath, { force: true });
  }
};

main().catch((error) => {
  process.stderr.write(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
