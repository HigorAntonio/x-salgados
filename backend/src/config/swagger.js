import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'X Salgados API',
      version: '1.0.0',
      description: 'API para gestão de pedidos, estoque, frota e roteirização da empresa X Salgados',
      contact: {
        name: 'X Salgados',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Servidor atual',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Endpoints de verificação de saúde da aplicação',
      },
      {
        name: 'Auth',
        description: 'Autenticação e autorização',
      },
      {
        name: 'Users',
        description: 'Gestão de usuários',
      },
      {
        name: 'Products',
        description: 'Gestão de produtos e estoque',
      },
      {
        name: 'Orders',
        description: 'Gestão de pedidos',
      },
      {
        name: 'Fleet',
        description: 'Gestão de frota e veículos',
      },
      {
        name: 'Routes',
        description: 'Roteirização e carregamentos',
      },
      {
        name: 'Regions',
        description: 'Gestão de regiões e agenda regional',
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
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Error message',
            },
            path: {
              type: 'string',
              example: '/api/endpoint',
            },
          },
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['ok', 'error'],
              example: 'ok',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2026-03-03T10:00:00.000Z',
            },
            message: {
              type: 'string',
              example: 'Database connection failed',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de acesso ausente ou inválido',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Recurso não encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ValidationError: {
          description: 'Erro de validação',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Erro interno do servidor',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes.js', './src/routes/**/*.js'], // Arquivos onde as anotações Swagger estarão
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
