export default () => ({
  port: parseInt(process.env.PORT || process.env.AVATAR_SERVICE_PORT || '3009', 10),
  env: process.env.NODE_ENV || 'development',
  services: {
    voiceService: process.env.VOICE_SERVICE_URL || 'http://localhost:3016',
  },
  avatar: {
    renderWidth: parseInt(process.env.AVATAR_RENDER_WIDTH || '1920', 10),
    renderHeight: parseInt(process.env.AVATAR_RENDER_HEIGHT || '1080', 10),
    defaultModel: process.env.AVATAR_DEFAULT_MODEL || 'default',
  },
});


