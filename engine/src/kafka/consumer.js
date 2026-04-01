// src/kafka/consumer.js
const { Kafka, logLevel } = require('kafkajs');
const config = require('../config');
const logger = require('../logger');
const { handleInventoryEvent } = require('../handlers/inventoryEventHandler');

async function startKafkaConsumer() {
  const kafka = new Kafka({
    clientId: config.serviceName,
    brokers: config.kafka.brokers,
    logLevel: logLevel.INFO
  });

  const consumer = kafka.consumer({ groupId: config.kafka.groupId });

  await consumer.connect();
  logger.info('Kafka consumer connected to brokers', config.kafka.brokers.join(','));

  for (const topic of config.kafka.topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
    logger.info('Subscribed to topic', topic);
  }

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value.toString();
      logger.debug(Raw message on ${topic}: ${value});
      await handleInventoryEvent(topic, value);
    }
  });

  return consumer;
}

module.exports = { startKafkaConsumer };