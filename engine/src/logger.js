function log(level, ...args) {
  const ts = new Date().toISOString();
  console.log([${ts}] [${level.toUpperCase()}], ...args);
}

module.exports = {
  info: (...a) => log('info', ...a),
  error: (...a) => log('error', ...a),
  debug: (...a) => log('debug', ...a)
};