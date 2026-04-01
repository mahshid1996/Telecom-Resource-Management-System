 const express = require('express');
const cors = require('cors');
const masterConfigRoutes = require('./routes/masterConfigRoutes');
const errorHandler = require('./middleware/errorHandler');
const { swaggerUi, specs } = require('./swagger');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'config-service'
  });
});

app.use('/master-config', masterConfigRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use(errorHandler);

module.exports = app;