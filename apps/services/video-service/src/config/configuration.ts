export default () => ({
  port: parseInt(process.env.PORT || process.env.VIDEO_SERVICE_PORT || '3017', 10),
  storage: {
    type: process.env.VIDEO_STORAGE_TYPE || 'local', // 's3' | 'minio' | 'local'
    bucket: process.env.VIDEO_STORAGE_BUCKET || 'videos',
    endpoint: process.env.VIDEO_STORAGE_ENDPOINT,
    accessKeyId: process.env.VIDEO_STORAGE_ACCESS_KEY_ID,
    secretAccessKey: process.env.VIDEO_STORAGE_SECRET_ACCESS_KEY,
    region: process.env.VIDEO_STORAGE_REGION || 'us-east-1',
    cdnUrl: process.env.VIDEO_CDN_URL,
    localPath: process.env.VIDEO_STORAGE_LOCAL_PATH || './storage/videos',
  },
  video: {
    maxFileSize: parseInt(process.env.VIDEO_MAX_FILE_SIZE || '104857600', 10), // 100MB default
    allowedFormats: ['webm', 'mp4'],
    maxDuration: parseInt(process.env.VIDEO_MAX_DURATION || '600', 10), // 10 minutes default
  },
});
