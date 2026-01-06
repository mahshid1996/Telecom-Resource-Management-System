const mongoose = require('mongoose');
const { KafkaClient, Producer } = require('kafka-node');
require('dotenv').config();
const { applog } = require('../services/logger.service.js');

//MongoDB connection
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/resourceDB', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    applog('info', new Date().toISOString(), 'MongoDB connected');
  } catch (err) {
    applog('error', new Date().toISOString(), 'MongoDB connection error:' + err.message);
  }
};

//Kafka connection
const kafkaClient = new KafkaClient({ kafkaHost: process.env.KAFKA_HOST || 'localhost:9092' });
const kafkaProducer = new Producer(kafkaClient);

kafkaProducer.on('ready', () => applog('info', new Date().toISOString(), 'Kafka is ready'));
kafkaProducer.on('error', (err) => applog('error', new Date().toISOString(), 'Kafka Producer error:' + err.message));

module.exports = {
  connectMongoDB,
  kafkaClient,
  kafkaProducer,
};
