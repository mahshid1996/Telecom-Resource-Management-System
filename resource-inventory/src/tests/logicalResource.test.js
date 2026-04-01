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

jest.mock('../config', () => ({
  connectMongoDB: jest.fn(),
  kafkaProducer: {
    send: jest.fn((payload, cb) => cb(null, 'mocked')),
    ready: true
  }
}));

const token = jwt.sign(
  { username: 'test-user' },
  process.env.JWT_SECRET || 'mysecretkey'
);

let createdId;

describe('Logical Resource API', () => {

  test('Create logical resource', async () => {
    const res = await request(app)
      .post('/api/logical-resources')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Logical',
        type: 'MSISDN',
        value: '1234567890',
        category: ['SIM']
      });

    expect(res.statusCode).toBe(201);
    createdId = res.body.id;
  });

  test('Get logical resources', async () => {
    const res = await request(app)
      .get('/api/logical-resources')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Patch logical resource', async () => {
    const res = await request(app)
      .patch(`/api/logical-resources/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Logical' });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Updated Logical');
  });

  test('Delete logical resource', async () => {
    const res = await request(app)
      .delete(`/api/logical-resources/${createdId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });

});