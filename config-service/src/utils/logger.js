const { format, createLogger, transports } = require('winston');
const path = require('path');

// Create logger
const logger = createLogger({
  level: 'info', // Level of log
  format: format.combine(
    format.colorize(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level}] ${message}`)
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

// Output of logger
module.exports = logger;
