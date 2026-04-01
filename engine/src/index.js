const config = require('./config');
const logger = require('./logger');
const { startKafkaConsumer } = require('./kafka/consumer');
const { startRecyclingJob } = require('./services/recyclingService');

async function main() {
  logger.info('Engine starting...');

  await startKafkaConsumer();
  startRecyclingJob(config.recycling.intervalMs);

  logger.info('Engine running');
}

main();