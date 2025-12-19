export default () => ({
  port: parseInt(process.env.PORT || '3009', 10),
  env: process.env.NODE_ENV || 'development',
  llmGateway: {
    url: process.env.LLM_GATEWAY_URL || 'http://localhost:3002',
  },
});


