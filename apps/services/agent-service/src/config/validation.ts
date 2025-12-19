// Validation Schema (using class-validator instead of Joi for NestJS)
export const validationSchema = {
  PORT: { type: 'number', default: 3003 },
  NODE_ENV: { type: 'string', default: 'development' },
  LLM_GATEWAY_URL: { type: 'string', default: 'http://localhost:3002' },
  TOOL_SERVICE_URL: { type: 'string', default: 'http://localhost:3004' },
  DATABASE_URL: { type: 'string', required: true },
  REDIS_HOST: { type: 'string', default: 'localhost' },
  REDIS_PORT: { type: 'number', default: 6379 },
};

