const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Master Config API',
      version: '1.0.0',
      description: 'API for managing master config resources.',
    },
  },
  apis: [path.join(__dirname, 'routes/*.js')],
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };