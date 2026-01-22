const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const config = require('config');

beforeAll(async () => {
  await mongoose.connect(config.get('mongodb'));
});

afterAll(async () => {
  await mongoose.connection.close();
});

// Test Unit برای MasterConfig API
describe('MasterConfig API', () => {

  // Test GET /master-config
  test('GET /master-config should return array', async () => {
    const res = await request(app).get('/master-config');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Test POST /master-config
  test('POST /master-config should create a new config', async () => {
    const newConfig = {
      name: 'New Config',
      description: 'A new configuration',
      status: 'Active',
      code: '12345',
      type: 'NotificationConfig',
      baseType: 'BaseType',
      configCharacteristics: [],
      relatedParty: [],
      attachment: [],
      version: 1,
    };

    const res = await request(app).post('/master-config').send(newConfig);
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe(newConfig.name);
  });

  // Test GET /master-config/:id
  test('GET /master-config/:id should return config by ID', async () => {
    const res = await request(app).get('/master-config/68ff21dcc3dfe690e287686c');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name');
  });

  // Test PATCH /master-config/:id
  test('PATCH /master-config/:id should update the config', async () => {
    const updatedConfig = { name: 'Updated Config' };
    const res = await request(app).patch('/master-config/68ff21dcc3dfe690e287686c').send(updatedConfig);
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Updated Config');
  });

  // Test DELETE /master-config/:id
  test('DELETE /master-config/:id should delete the config', async () => {
    const res = await request(app).delete('/master-config/68ff21dcc3dfe690e287686c');
    expect(res.statusCode).toBe(204);
  });
});
