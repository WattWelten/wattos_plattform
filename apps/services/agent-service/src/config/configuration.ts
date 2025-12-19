export default () => ({
  port: parseInt(process.env.PORT || '3003', 10),
  env: process.env.NODE_ENV || 'development',
  llmGateway: {
    url: process.env.LLM_GATEWAY_URL || 'http://localhost:3002',
  },
  toolService: {
    url: process.env.TOOL_SERVICE_URL || 'http://localhost:3004',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
});


