const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { masterConfigSchema } = require('../src/validation');
const MasterConfig = require('../src/model');
const { swaggerUi, specs } = require('../src/swagger');

const app = require('../src/app'); 


beforeAll(async () => {
  await mongoose.connect('mongodb://localhost:27017/masterconfig_test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

describe('MasterConfig API', () => {
  it('should create a new master config', async () => {
    const payload = {
      name: "Test Policy",
      description: "Test Policy",
      status: "Active",
      code: "TST1",
      type: "Policy",
      baseType: "resourceInventoryConfig",
      configCharacteristics: [
        {
          name: "initialState",
          code: "initialState",
          valueType: "array",
          configCharacteristicsValues: [
            { valueType: "array", value: ["Available", "Created"] }
          ]
        }
      ]
    };

    const res = await request(app)
      .post('/master-config')
      .send(payload)
      .expect(201);

    expect(res.body).toHaveProperty('_id');
    expect(res.body.name).toBe("Test Policy");
  });

  it('should get all master configs', async () => {
    const res = await request(app)
      .get('/master-config')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});