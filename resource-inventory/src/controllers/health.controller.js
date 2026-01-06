/**
 * Health check controller.
 * Returns the status of MongoDB and Kafka connections.
 */
const { mongoose } = require('mongoose');
const { kafkaProducer } = require('../config');

const getHealth = async (req, res) => {
  const status = {
    mongoDB: false,
    kafka: false,
  };

  // Check MongoDB connection
  try {
    status.mongoDB = mongoose.connection.readyState === 1;
  } catch (err) {
    status.mongoDB = false;
  }

  // Check Kafka producer status
  try {
    status.kafka = kafkaProducer && kafkaProducer.ready;
  } catch (err) {
    status.kafka = false;
  }

  res.json(status);
};

module.exports = {
  getHealth,
};
