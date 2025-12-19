export default () => ({
  port: parseInt(process.env.PORT || process.env.LLM_GATEWAY_PORT || '3015', 10),
  defaultProvider: process.env.LLM_DEFAULT_PROVIDER ?? 'openai',
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    },
    azure: {
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION ?? '2023-12-01-preview',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com',
    },
    google: {
      apiKey: process.env.GOOGLE_API_KEY,
      baseUrl:
        process.env.GOOGLE_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta',
    },
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL ?? 'llama2',
    },
  },
  costTracking: {
    enabled: process.env.LLM_COST_TRACKING_ENABLED !== 'false',
    alertThreshold: Number(process.env.LLM_COST_ALERT_THRESHOLD ?? 0.8),
  },
});
