require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const logger = require('./utils/logger');
const axios = require('axios');

const PORT = process.env.PORT || 3039;
const MONGO_URI = process.env.MONGO_URI;

async function loadNotificationConfigs(app) {
  try {
    const response = await axios.get(
      'http://config-service:3030/master-config?type=NotificationConfig&status=Active'
    );

    app.set('notificationConfigs', response.data);
    logger.info('Notification configs loaded');
  } catch (err) {
    logger.error('Failed to load notification configs');
  }
}

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('MongoDB connected successfully');

    await loadNotificationConfigs(app);

    app.listen(PORT, () => {
      logger.info(`Notification service running on port ${PORT}`);
    });
  } catch (err) {
    logger.error(`Startup failed: ${err.message}`);
    process.exit(1);
  }
}

start();
