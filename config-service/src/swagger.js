const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger Settings
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Master Config API',
      version: '1.0.0',
      description: 'API for managing master config resources with various filters and CRUD operations.',
    },
  },
  apis: ['./src/routes/masterConfigRoutes.js', './src/app.js'], // API Related Files
};

const specs = swaggerJsdoc(options); // Build Swagger Documentation

module.exports = { swaggerUi, specs };
