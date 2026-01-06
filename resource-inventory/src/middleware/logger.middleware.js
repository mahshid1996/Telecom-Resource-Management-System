/**
 * Request logging middleware.
 * Logs the HTTP method, request URL, and timestamp for every incoming request.
 */
const { applog } = require('../services/logger.service.js');

const loggerMiddleware = (req, res, next) => {
  const time = new Date().toISOString();
  applog('info', time, `${req.method} ${req.originalUrl}`);
  next();
};

module.exports = loggerMiddleware;
