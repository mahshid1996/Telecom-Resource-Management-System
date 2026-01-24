const { Parser } = require('json2csv');
const Report = require('../models/Report');
const logger = require('../utils/logger');

async function generateCsvReport(notification) {
  try {
    const { _id, emailStatuses, subject } = notification;

    const rows = emailStatuses.map(e => ({
      notificationId: _id,
      email: e.email,
      status: e.status,
      subject
    }));

    const totalEmails = rows.length;
    const successCount = rows.filter(r => r.status === 'success').length;
    const failureCount = rows.filter(r => r.status === 'failure').length;

    const storedReport = await Report.create({
      notificationId: _id,
      totalEmails,
      successCount,
      failureCount,
      emails: emailStatuses,
      subject
    });

    logger.info(`Report saved to DB for notification ${_id}`);
    return storedReport;
  } catch (err) {
    logger.error(`Error generating CSV report in memory: ${err.message}`);
    throw err;
  }
}

module.exports = generateCsvReport;
