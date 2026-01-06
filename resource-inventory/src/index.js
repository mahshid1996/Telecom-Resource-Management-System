require('dotenv').config();
const app = require('./app');
const { connectMongoDB, kafkaProducer } = require('./config');
const { applog } = require('./services/logger.service.js');

// Import Swagger setup
const { swaggerUi, specs } = require('./swagger'); 

// Mount Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

require('./grpc/server'); 

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectMongoDB();

  kafkaProducer.on('ready', () => {
    applog('info', new Date().toISOString(), 'Kafka Producer is ready');
    app.listen(PORT, () => {
        kafkaProducer.on('ready', () => applog('info', new Date().toISOString(), 'Kafka is ready'));
        kafkaProducer.on('error', (err) => applog('error', new Date().toISOString(), 'Kafka Producer error: ' + err.message));

    });
  });

  kafkaProducer.on('error', (err) => {
    applog('error', new Date().toISOString(), 'Kafka Producer error:' + err.message);
  });
};

startServer();
