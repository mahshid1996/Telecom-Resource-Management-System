/**
 * 🛡️ Middleware to authenticate requests using JWT.
 * - Verifies the provided token in the Authorization header.
 * - Logs each authentication step using applog.
 */

const jwt = require('jsonwebtoken');
const { applog } = require('../services/logger.service.js');
const SECRET_KEY = process.env.JWT_SECRET || 'mysecretkey';

const getTime = () => new Date().toISOString();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    applog('warn', getTime(), `Unauthorized access attempt: No Authorization header (Path: ${req.originalUrl})`);
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1]; //Format: Bearer <accessToken>
  if (!token) {
    applog('warn', getTime(), `Invalid token format (Path: ${req.originalUrl})`);
    return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;

    applog('info', getTime(), `Authenticated user: ${decoded.username || decoded.id || 'Unknown'} (Path: ${req.originalUrl})`);
    next();
  } catch (err) {
    applog('error', getTime(), `Token verification failed: ${err.message} (Path: ${req.originalUrl})`);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

module.exports = authenticateToken;
