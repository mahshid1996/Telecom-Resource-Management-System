const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const logger = require('../services/logger.service.js'); 

const SECRET_KEY = process.env.JWT_SECRET || 'mysecretkey'; 
logger.applog('debug', new Date().toISOString(), 'Auth routes initialized');

//Example users array for demo purpose
const users = [
  { username: 'test-user', password: '123456', role: 'admin' },
  { username: 'myuser', password: '123456', role: 'student' }
];

//Login endpoint
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  logger.applog('info', new Date().toISOString(), `Login attempt for user: ${username}`);

  //Find user matching credentials
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    logger.applog('warn', new Date().toISOString(), `Failed login attempt for user: ${username}`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  //Generate JWT access token
  const accessToken = jwt.sign(
    { username: user.username, role: user.role },
    SECRET_KEY,
    { expiresIn: '1h' }
  );

  logger.applog('info', new Date().toISOString(), `User logged in successfully: ${username}`);
  return res.json({ accessToken }); 
});

module.exports = router;
