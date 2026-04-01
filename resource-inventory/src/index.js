require('dotenv').config();
const app = require('./app');
const { connectMongoDB, kafkaProducer } = require('./config');
const { applog } = require('./services/logger.service.js');
const { swaggerUi, specs } = require('./swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

require('./grpc/server');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectMongoDB();
    applog('info', new Date().toISOString(), 'MongoDB connected');
  } catch (err) {
    applog('error', new Date().toISOString(), 'MongoDB connection failed: ' + err.message);
  }

  // START EXPRESS SERVER ALWAYS
  app.listen(PORT, () => {
    applog('info', new Date().toISOString(), `Inventory service running on port ${PORT}`);
  });

  // Kafka is OPTIONAL
  kafkaProducer.on('ready', () => {
    applog('info', new Date().toISOString(), ' Kafka connected');
  });

  kafkaProducer.on('error', (err) => {
    applog('warn', new Date().toISOString(), ' Kafka not available: ' + err.message);
  });
};

startServer();
