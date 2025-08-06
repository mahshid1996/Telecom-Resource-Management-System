const mongoose = require('mongoose');
const MasterConfig = require('../src/model');

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

describe('MasterConfig Model', () => {
  it('should create and save a master config successfully', async () => {
    const validConfig = new MasterConfig({
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
      ],
      relatedParty: [
        { name: "John Doe", email: "john@example.com", phone: "1234567890" }
      ],
      attachment: [],
      version: 1
    });

    const savedConfig = await validConfig.save();

    expect(savedConfig._id).toBeDefined();
    expect(savedConfig.name).toBe("Test Policy");
    expect(savedConfig.status).toBe("Active");
    expect(savedConfig.configCharacteristics[0].name).toBe("initialState");
    expect(savedConfig.relatedParty[0].name).toBe("John Doe");
  });

  it('should fail validation if required fields are missing', async () => {
    const invalidConfig = new MasterConfig({}); 

    let err;
    try {
      await invalidConfig.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should not allow invalid status', async () => {
    const invalidConfig = new MasterConfig({
      name: "Test Policy",
      description: "Test Policy",
      status: "Unknown",
      code: "TST2",
      type: "Policy",
      baseType: "resourceInventoryConfig"
    });

    let err;
    try {
      await invalidConfig.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.status).toBeDefined();
  });
});