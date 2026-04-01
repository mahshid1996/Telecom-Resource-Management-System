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

let createdId;

describe('Physical Resource API', () => {

  test('Create physical resource', async () => {
    const res = await request(app)
      .post('/api/physical-resources')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Physical',
        type: 'SIM',
        value: 'SIM-123'
      });

    expect(res.statusCode).toBe(201);
    createdId = res.body.id;
  });

  test('Delete physical resource', async () => {
    const res = await request(app)
      .delete(`/api/physical-resources/${createdId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });

});