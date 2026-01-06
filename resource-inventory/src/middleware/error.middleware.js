/**
 * Global error-handling middleware.
 * Logs the error and sends a standardized error response to the client.
 */
const { applog } = require('../services/logger.service.js');

const errorMiddleware = (err, req, res, next) => {
  //Get the current timestamp in ISO format
  const time = new Date().toISOString();
  applog('error', time, err.message);
  res.status(500).json({ error: err.message });
};

module.exports = errorMiddleware;
