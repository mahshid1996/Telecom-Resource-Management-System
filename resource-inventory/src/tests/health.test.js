jest.mock('../config', () => ({
  connectMongoDB: jest.fn(),
  kafkaProducer: {
    send: jest.fn((payload, cb) => cb(null, 'mocked')),
    ready: true
  }
}));

const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { username: 'test-user' },
  process.env.JWT_SECRET || 'mysecretkey'
);

describe('Health API', () => {

  test('GET /api/ should return health status', async () => {
    const res = await request(app)
      .get('/api/')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('mongoDB');
    expect(res.body).toHaveProperty('kafka');
  });

});