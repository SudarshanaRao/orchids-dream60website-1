const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dream60 API Documentation',
      version: '1.0.0',
      description: 'Comprehensive documentation for the Dream60 REST API, built with Express and MongoDB.',
      termsOfService: 'https://finpages.in/terms',
      contact: {
        name: 'Finpages Tech Pvt Ltd',
        url: 'https://finpages.in',
        email: 'support@finpages.in'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}/api/v1`,
        description: 'Development Server'
      },
    //   {
    //     url: 'https://api.dream60.com/api/v1', t
    //     description: 'Production Server'
    //   }
    ],
    tags: [
      { name: 'Dreams', description: 'Operations related to dreams' }
    ]
    // Add security schemes here as needed, for example:
    // components: {
    //   securitySchemes: {
    //     bearerAuth: {
    //       type: 'http',
    //       scheme: 'bearer',
    //       bearerFormat: 'JWT'
    //     }
    //   }
    // }
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;
