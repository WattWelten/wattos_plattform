export default () => ({
  port: parseInt(process.env.PORT || '3006', 10),
  env: process.env.NODE_ENV || 'development',
  llmGateway: {
    url: process.env.LLM_GATEWAY_URL || 'http://localhost:3002',
  },
  ragService: {
    url: process.env.RAG_SERVICE_URL || 'http://localhost:3005',
  },
  streaming: {
    enabled: process.env.STREAMING_ENABLED !== 'false',
    chunkSize: parseInt(process.env.STREAMING_CHUNK_SIZE || '50', 10),
  },
  websocket: {
    enabled: process.env.WEBSOCKET_ENABLED !== 'false',
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      credentials: true,
    },
  },
  voiceService: {
    url: process.env.VOICE_SERVICE_URL || 'http://localhost:3016',
  },
});


