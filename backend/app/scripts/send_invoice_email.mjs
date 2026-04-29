import nodemailer from 'nodemailer';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import puppeteer from 'puppeteer';

const readStdin = async () =>
  new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
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

const renderInvoiceHtml = (invoice) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
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
        padding: 32px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
      }
      .brand {
        font-size: 28px;
        font-weight: 700;
        color: #0f766e;
      }
      .eyebrow {
        color: #475569;
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .status {
        display: inline-block;
        margin-top: 12px;
        padding: 6px 12px;
        border-radius: 999px;
        background: #dcfce7;
        color: #166534;
        font-size: 12px;
        font-weight: 700;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        margin: 24px 0;
      }
      .card {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
      }
      .label {
        color: #64748b;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 8px;
      }
      .value {
        font-size: 18px;
        font-weight: 600;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 24px;
      }
      th, td {
        text-align: left;
        padding: 14px 12px;
        border-bottom: 1px solid #e2e8f0;
      }
      th {
        font-size: 12px;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .total {
        text-align: right;
        margin-top: 24px;
        font-size: 24px;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="header">
        <div>
          <div class="eyebrow">Hospital Management System</div>
          <div class="brand">Invoice ${escapeHtml(invoice.invoice_code)}</div>
          <div class="status">${escapeHtml(invoice.status)}</div>
        </div>
        <div>
          <div class="eyebrow">Issued On</div>
          <div class="value">${escapeHtml(invoice.invoice_date)}</div>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="label">Patient</div>
          <div class="value">${escapeHtml(invoice.patient_name)}</div>
        </div>
        <div class="card">
          <div class="label">Payment Method</div>
          <div class="value">${escapeHtml(invoice.payment_method)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Invoice Code</th>
            <th>Status</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Hospital services and billing charges</td>
            <td>${escapeHtml(invoice.invoice_code)}</td>
            <td>${escapeHtml(invoice.status)}</td>
            <td>${escapeHtml(currency(invoice.amount))}</td>
          </tr>
        </tbody>
      </table>

      <div class="total">Total: ${escapeHtml(currency(invoice.amount))}</div>
    </div>
  </body>
</html>`;

const ensureMailConfig = (payload) => {
  if (!payload.mail_server || !payload.mail_port || !payload.mail_from) {
    throw new Error('SMTP configuration is incomplete. Set MAIL_SERVER, MAIL_PORT, and MAIL_FROM.');
  }

  if (!payload.mail_username || !payload.mail_password) {
    throw new Error('SMTP credentials are missing. Set MAIL_USERNAME and MAIL_PASSWORD.');
  }
};

const main = async () => {
  const rawInput = await readStdin();
  const payload = JSON.parse(rawInput || '{}');
  ensureMailConfig(payload);

  const invoice = payload.invoice;
  const pdfPath = path.join(os.tmpdir(), `${invoice.invoice_code}.pdf`);
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  try {
    const page = await browser.newPage();
    await page.setContent(renderInvoiceHtml(invoice), { waitUntil: 'networkidle0' });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', right: '16mm', bottom: '18mm', left: '16mm' },
    });

    const transporter = nodemailer.createTransport({
      host: payload.mail_server,
      port: Number(payload.mail_port),
      secure: Boolean(payload.mail_ssl_tls) || Number(payload.mail_port) === 465,
      auth: {
        user: payload.mail_username,
        pass: payload.mail_password,
      },
      requireTLS: Boolean(payload.mail_starttls),
    });

    await transporter.sendMail({
      from: payload.mail_from,
      to: payload.recipient_email,
      subject: `Paid invoice ${invoice.invoice_code}`,
      text: `Hello,\n\nPlease find attached the paid invoice ${invoice.invoice_code} for ${invoice.patient_name}.\n\nAmount: ${currency(invoice.amount)}\nPayment method: ${invoice.payment_method}\nDate: ${invoice.invoice_date}\n\nRegards,\nHospital Management System`,
      attachments: [
        {
          filename: `${invoice.invoice_code}.pdf`,
          path: pdfPath,
          contentType: 'application/pdf',
        },
      ],
    });

    process.stdout.write(JSON.stringify({ ok: true, message: `Invoice ${invoice.invoice_code} emailed to ${payload.recipient_email}.` }));
  } finally {
    await browser.close();
    await fs.rm(pdfPath, { force: true });
  }
};

main().catch((error) => {
  process.stderr.write(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
