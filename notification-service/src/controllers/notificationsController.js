const Notification = require('../models/Notification'); 

const notificationQueue = require('../queues/notificationQueue');
const Joi = require('joi');
const logger = require('../utils/logger'); 

// updated schema
const notificationSchema = Joi.object({
  emailLists: Joi.array().items(Joi.string().email()).required(),
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

    const notification = new Notification(value);
    await notification.save();
    logger.info(`Notification saved with ID: ${notification._id}`);

    await notificationQueue.add({
      emailLists: value.emailLists,
      body: value.body,
      subject: value.subject,
      notificationId: notification._id
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
