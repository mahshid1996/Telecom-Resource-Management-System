const { createLogger, format, transports } = require('winston');
const path = require('path');

/**
 * Centralized application logger.
 * Logs are written to console and to dedicated log files.
 * - app.log  -> all application logs
 * - error.log -> error-level logs only
 */

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: path.join(__dirname, '../../logs/app.log'),
      level: 'info',
    }),
    new transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
    }),
  ],
});

module.exports = logger;
