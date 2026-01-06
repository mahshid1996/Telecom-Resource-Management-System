const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// تنظیمات Swagger
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Master Config API',
      version: '1.0.0',
      description: 'API for managing master config resources with various filters and CRUD operations.',
    },
  },
  apis: ['./src/routes/masterConfigRoutes.js', './src/app.js'], // فایل‌های مرتبط با API
};

const specs = swaggerJsdoc(options); // ساخت مستندات Swagger

module.exports = { swaggerUi, specs };
