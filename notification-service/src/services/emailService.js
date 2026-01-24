const nodemailer = require('nodemailer');
require('dotenv').config();
const logger = require('../utils/logger'); 

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_SENDER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: process.env.GMAIL_ACCESS_TOKEN
    }
  });
};

async function sendEmail(to, body, subject = 'Notification') {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"Notif Service" <${process.env.GMAIL_SENDER}>`,
      to,
      subject,
      text: body
    });
    logger.info(`Email sent: ${info.messageId} to ${to}`);
    return info;
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`);
    throw err;
  }
}

module.exports = { sendEmail };
