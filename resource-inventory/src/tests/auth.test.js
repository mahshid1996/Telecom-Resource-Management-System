jest.mock('../config', () => ({
  connectMongoDB: jest.fn(),
  kafkaProducer: {
    send: jest.fn((payload, cb) => cb(null, 'mocked')),
    ready: true
  }
}));

const request = require('supertest');
const app = require('../app');

describe('Auth API', () => {

  test('POST /api/auth/login should return token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'test-user',
        password: '123456'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  test('POST /api/auth/login should fail with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'test-user',
        password: 'wrong'
      });

    expect(res.statusCode).toBe(401);
  });

});