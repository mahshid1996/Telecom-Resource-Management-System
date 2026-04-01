require('dotenv').config();

module.exports = {
  serviceName: process.env.SERVICE_NAME  'engine-service',

  kafka: {
    brokers: (process.env.KAFKA_BROKERS  'kafka:9092').split(','),
    groupId: process.env.KAFKA_GROUP_ID  'engine-consumer-group',
    topics: (process.env.KAFKA_TOPICS  'logicalResourcePatchEvent,physicalResourcePatchEvent').split(',')
  },

  inventoryBaseUrl:
    process.env.INVENTORY_BASE_URL  'http://resource-inventory:3000',

  recycling: {
    intervalMs: Number(process.env.RECYCLING_INTERVAL  60000),
    batchLimit: Number(process.env.RECYCLING_BATCH_LIMIT || 50)
  }
};