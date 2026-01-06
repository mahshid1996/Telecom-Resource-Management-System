const kafka = require('kafka-node');
const { applog } = require('./logger.service');

const client = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
const kafkaProducer = new kafka.Producer(client);

kafkaProducer.on('ready', () => {
  applog('info', new Date().toISOString(), 'Kafka Producer is ready');
});

kafkaProducer.on('error', (err) => {
  applog('error', new Date().toISOString(), 'Kafka Producer error: ' + err.message);
});

module.exports = { kafkaProducer };
