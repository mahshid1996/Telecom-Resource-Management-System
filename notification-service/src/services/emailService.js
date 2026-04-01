
const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendEmail(to, body, subject = 'Notification') {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_SENDER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN
      }
    });

    const info = await transporter.sendMail({
      from: `"Notification Service" <${process.env.GMAIL_SENDER}>`,
      to,
      subject,
      text: body
    });

    return info;
  } catch (err) {
    throw err;
  }
}

module.exports = { sendEmail };