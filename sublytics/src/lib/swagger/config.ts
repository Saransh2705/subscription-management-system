import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sublytics API',
      version: '1.0.0',
      description: 'Subscription Management System API - Manage customers, invoices, and subscriptions',
      contact: {
        name: 'API Support',
        email: 'support@sublytics.io',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your API authentication token',
        },
      },
      schemas: {
        Customer: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique customer identifier',
            },
            name: {
              type: 'string',
              description: 'Customer name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Customer email address',
            },
            phone: {
              type: 'string',
              description: 'Customer phone number',
              nullable: true,
            },
            company: {
              type: 'string',
              description: 'Company name',
              nullable: true,
            },
            address: {
              type: 'string',
              description: 'Street address',
              nullable: true,
            },
            city: {
              type: 'string',
              description: 'City',
              nullable: true,
            },
            country: {
              type: 'string',
              description: 'Country',
              nullable: true,
            },
            notes: {
              type: 'string',
              description: 'Additional notes',
              nullable: true,
            },
            is_active: {
              type: 'boolean',
              description: 'Customer active status',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Invoice: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique invoice identifier',
            },
            invoice_number: {
              type: 'string',
              description: 'Invoice number',
            },
            customer_id: {
              type: 'string',
              format: 'uuid',
              description: 'Customer ID',
            },
            subscription_id: {
              type: 'string',
              format: 'uuid',
              description: 'Subscription ID',
              nullable: true,
            },
            status: {
              type: 'string',
              enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
              description: 'Invoice status',
            },
            issue_date: {
              type: 'string',
              format: 'date',
              description: 'Issue date',
            },
            due_date: {
              type: 'string',
              format: 'date',
              description: 'Due date',
            },
            subtotal: {
              type: 'number',
              description: 'Subtotal amount',
            },
            tax_percent: {
              type: 'number',
              description: 'Tax percentage',
            },
            tax_amount: {
              type: 'number',
              description: 'Tax amount',
            },
            discount_percent: {
              type: 'number',
              description: 'Discount percentage',
            },
            discount_amount: {
              type: 'number',
              description: 'Discount amount',
            },
            total: {
              type: 'number',
              description: 'Total amount',
            },
            currency: {
              type: 'string',
              description: 'Currency code',
              default: 'USD',
            },
            notes: {
              type: 'string',
              description: 'Invoice notes',
              nullable: true,
            },
            paid_at: {
              type: 'string',
              format: 'date-time',
              description: 'Payment timestamp',
              nullable: true,
            },
            customer: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  product_id: { type: 'string', nullable: true },
                  description: { type: 'string' },
                  quantity: { type: 'number' },
                  unit_price: { type: 'number' },
                  total: { type: 'number' },
                  product: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      name: { type: 'string' },
                      sku: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        AuthToken: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT authentication token',
            },
            expires_in: {
              type: 'string',
              description: 'Token expiration time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'integer',
                  description: 'HTTP status code',
                },
                type: {
                  type: 'string',
                  description: 'Error type',
                },
                message: {
                  type: 'string',
                  description: 'Error message',
                },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Unauthorized - Invalid or missing authentication token',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 401,
                  type: 'Unauthorized',
                  message: 'Missing or invalid Authorization header',
                },
              },
            },
          },
        },
        BadRequestError: {
          description: 'Bad Request - Invalid input parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 400,
                  type: 'BadRequest',
                  message: 'Required field is missing',
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Not Found - Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 404,
                  type: 'NotFound',
                  message: 'Resource not found',
                },
              },
            },
          },
        },
        ServerError: {
          description: 'Server Error - Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 500,
                  type: 'ServerError',
                  message: 'An unexpected error occurred',
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./src/app/api/v1/**/*.ts'], // Path to API route files
};

export const swaggerSpec = swaggerJsdoc(options);
