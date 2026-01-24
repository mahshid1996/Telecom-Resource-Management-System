const Queue = require('bull');
const { sendEmail } = require('../services/emailService');
const generateCsvReport = require('../report/generateCsvReport');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');
require('dotenv').config();
const config = require('../config/defaultConfig.json');


const notificationQueue = new Queue('notification', {
  redis: { port: 6379, host: '127.0.0.1' }
});

notificationQueue.process(async (job) => {
  const { emailLists, body, subject, notificationId } = job.data;
  const results = [];
  const chunkSize = config.emailChunkSize || 50;; 

  try {
    for (let i = 0; i < emailLists.length; i += chunkSize) {
      const chunk = emailLists.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async (email) => {
        try {
          await sendEmail(email, body, subject);
          results.push({ email, status: 'success' });
          logger.info(`Email sent to ${email}`);
        } catch (err) {
          results.push({ email, status: 'failure' });
          logger.error(`Failed to send ${email}: ${err.message}`);
        }
      }));
    }


    await Notification.findByIdAndUpdate(notificationId, {
      $set: { emailStatuses: results, status: 'completed' }
    });

await generateCsvReport({
  _id: notificationId,
  emailStatuses: results, 
  subject
});


    return { status: 'sent', notificationId };
  } catch (err) {
    logger.error(`Email failed for notification ID ${notificationId}: ${err.message}`);
    await Notification.findByIdAndUpdate(notificationId, { status: 'failed' });
    return { status: 'failed', notificationId };
  }
});

module.exports = notificationQueue;
