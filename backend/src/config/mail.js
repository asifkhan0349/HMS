const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_SERVER || 'mail.fossap.in',
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: process.env.MAIL_SSL_TLS === 'True',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = transporter;
