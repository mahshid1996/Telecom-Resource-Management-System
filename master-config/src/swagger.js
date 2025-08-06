const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Master Config API', version: '1.0.0' },
  },
  apis: ['./app.js'],
};

const specs = swaggerJsdoc(options);
module.exports = { swaggerUi, specs };