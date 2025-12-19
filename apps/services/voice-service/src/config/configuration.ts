export default () => ({
  port: parseInt(process.env.PORT || process.env.VOICE_SERVICE_PORT || '3016', 10),
  env: process.env.NODE_ENV || 'development',
  services: {
    chatService: process.env.CHAT_SERVICE_URL || 'http://localhost:3006',
    llmGateway: process.env.LLM_GATEWAY_URL || 'http://localhost:3009',
    avatarService: process.env.AVATAR_SERVICE_URL || 'http://localhost:3009',
  },
  voice: {
    ttsProvider: process.env.TTS_PROVIDER || 'openai', // openai | elevenlabs | azure
    sttProvider: process.env.STT_PROVIDER || 'openai', // openai | whisper | azure
    openaiApiKey: process.env.OPENAI_API_KEY,
    elevenlabsApiKey: process.env.ELEVENLABS_API_KEY,
    defaultVoice: process.env.DEFAULT_VOICE || 'alloy', // OpenAI voices: alloy, echo, fable, onyx, nova, shimmer
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'de',
    streamingEnabled: process.env.VOICE_STREAMING_ENABLED !== 'false',
    lowLatencyMode: process.env.VOICE_LOW_LATENCY_MODE === 'true', // Für schnelle Gespräche
  },
});

