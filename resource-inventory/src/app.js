const express = require('express');
const { swaggerUi, specs } = require('./swagger');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');

const { applog } = require('./services/logger.service.js');

//Routes
const logicalResourceRoutes = require('./routes/logicalResource.routes');
const physicalResourceRoutes = require('./routes/physicalResource.routes');
const resourceCategoryRoutes = require('./routes/resourceCategory.routes');
const resourceSchemaRoutes = require('./routes/resourceSchema.routes');
const authRoutes = require('./routes/auth.routes');
const healthRoutes = require('./routes/health.routes');


//Middleware
const authenticateToken = require('./middleware/auth.middleware'); 
const errorMiddleware = require('./middleware/error.middleware'); 
const loggerMiddleware = require('./middleware/logger.middleware'); 
const { loadMasterConfig } = require('./utils/configLoader.js');

const app = express();

(async () => {
  try {
    await loadMasterConfig(app);
  } catch (err) {
    console.error('Failed to start server due to config error');
  }
})();

//General Middleware and Swagger UI
app.use(cors()); 
app.use(bodyParser.json()); 
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
applog('info', new Date().toISOString(), 'Swagger available at http://localhost:3000/api-docs');
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(morgan('dev')); 
app.use(loggerMiddleware); 

//Public Routes (No JWT required)
app.use('/api/auth', authRoutes); 

//Protected Routes (JWT required)
app.use('/api/logical-resources', authenticateToken, logicalResourceRoutes);
app.use('/api/physical-resources', authenticateToken, physicalResourceRoutes);
app.use('/api/resource-categories', authenticateToken, resourceCategoryRoutes);
app.use('/api/resource-schemas', authenticateToken, resourceSchemaRoutes);
app.use('/api/', authenticateToken, healthRoutes); 



//Handle all errors globally
app.use(errorMiddleware); 

module.exports = app;
