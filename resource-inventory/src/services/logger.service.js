const { createLogger, format, transports } = require('winston');

const applog = (level, time, message) => {
  const logger = createLogger({
    level: level,
    format: format.combine(
      format.timestamp({ format: () => time }),
      format.printf(({ level, message, timestamp }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
    ),
    transports: [new transports.Console()],
  });
  logger.log({ level, message });
};

module.exports = { applog };
