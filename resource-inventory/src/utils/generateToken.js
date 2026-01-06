const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'mysecretkey';

const token = jwt.sign(
  { username: 'myuser', role: 'student' },
  SECRET_KEY,
  { expiresIn: '1h' }
);

