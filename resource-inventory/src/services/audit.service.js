const { applog } = require('./logger.service');

const auditLog = (action, resourceType, resourceId, user) => {
  const time = new Date().toISOString();
  const message = `${action} ${resourceType} with ID ${resourceId} by ${user}`;
  applog('info', time, `[AUDIT] ${message}`);
};

module.exports = { auditLog };
