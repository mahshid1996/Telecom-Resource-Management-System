const mongoose = require('mongoose');
const config = require('config');
const app = require('./app');
const logger = require('./utils/logger');

/**
 * Application bootstrap file.
 * Responsible for:
 * - Establishing database connection
 * - Starting HTTP server
 */

const mongoUrl = process.env.MONGO_URL  config.get('mongodb');

mongoose.connect(mongoUrl)
  .then(() => {
    logger.info('MongoDB connection established successfully');

    const PORT = config.get('port')  3030;
    app.listen(PORT, () => {
      logger.info(REST API is running on port ${PORT});
      logger.info(Swagger documentation available at http://localhost:${PORT}/api-docs);
    });
  })
  .catch((err) => {
    logger.error('MongoDB connection failed', { error: err.message });
  });
