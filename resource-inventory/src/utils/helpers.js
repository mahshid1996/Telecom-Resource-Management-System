const { v4: uuidv4 } = require('uuid');

const generateId = (prefix = '') => {
  return prefix + uuidv4();
};

const formatDate = (date) => {
  return date ? new Date(date).toISOString() : null;
};

module.exports = {
  generateId,
  formatDate,
};
