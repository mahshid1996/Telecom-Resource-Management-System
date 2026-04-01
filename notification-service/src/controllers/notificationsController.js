const Notification = require('../models/Notification'); 

const notificationQueue = require('../queues/notificationQueue');
const Joi = require('joi');
const logger = require('../utils/logger'); 

// updated schema
const notificationSchema = Joi.object({
  configCode: Joi.string().required(),
  body: Joi.string().required(),
  subject: Joi.string().optional()
});

async function createNotification(req, res) {
  try {
    const { error, value } = notificationSchema.validate(req.body);
    if (error) {
      logger.warn(`Validation failed: ${error.details[0].message}`);
      return res.status(400).json({ error: error.details[0].message });
    }

const configs = req.app.get('notificationConfigs') || [];

const selectedConfig = configs.find(c => c.code === value.configCode);

if (!selectedConfig) {
  return res.status(400).json({ error: 'Invalid configCode' });
}

const emailList = selectedConfig.configCharacteristics
  .find(c => c.code === 'emailRecipients')
  ?.configCharacteristicsValues[0]?.value || [];

const chunkSize = selectedConfig.configCharacteristics
  .find(c => c.code === 'chunkSize')
  ?.configCharacteristicsValues[0]?.value || 50;

const notification = new Notification({
  configCode: value.configCode,
  emailLists: emailList,
  body: value.body,
  subject: value.subject
});notificationQueue
    await notification.save();
    logger.info(`Notification saved with ID: ${notification._id}`);

   await notificationQueue.add({
  emailLists: emailList,
  body: value.body,
  subject: value.subject,
  notificationId: notification._id,
  chunkSize
});

    logger.info(`Notification queued for emails: ${value.emailLists.join(', ')}`);

    const responseNotification = {
      ...notification.toObject(),
      notificationId: notification._id
    };

    res.json({ message: 'Notification queued!', notification: responseNotification });

  } catch (err) {
    logger.error(`Notification error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
}


module.exports = { createNotification };
