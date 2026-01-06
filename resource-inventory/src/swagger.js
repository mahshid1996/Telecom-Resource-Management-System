const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Resource Management System API',
      version: '1.0.0',
      description: 'API documentation for Logical, Physical, Category, and Schema management.',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: [
    './src/controllers/logicalResource.controller.js',
    './src/controllers/physicalResource.controller.js',
    './src/controllers/resourceCategory.controller.js',
    './src/controllers/resourceSchema.controller.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
