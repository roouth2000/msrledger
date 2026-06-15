const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MSR Ledger Auth API',
      version: '1.0.0',
      description: 'Swagger API documentation for the msrledger user registration and login service.',
    },
    servers: [
      {
        url: 'http://127.0.0.1:3000',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // Paths to files containing OpenAPI definitions
  apis: [path.resolve(__dirname, './swaggerDocs.js')],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};
