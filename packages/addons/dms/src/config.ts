import { z } from 'zod';

/**
 * DMS Configuration Schema
 */
export const DMSConfigSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  timeout: z.number().default(30000), // 30 Sekunden
  retryAttempts: z.number().min(0).max(5).default(3),
  retryDelay: z.number().min(100).default(1000), // 1 Sekunde
  syncInterval: z.number().default(3600000), // 1 Stunde
  batchSize: z.number().default(100), // Max. Dokumente pro Batch
});

export type DMSConfig = z.infer<typeof DMSConfigSchema>;

/**
 * Default DMS Configuration
 */
export const getDefaultDMSConfig = (): Partial<DMSConfig> => ({
  baseUrl: process.env.DMS_BASE_URL || 'https://dms.example.com/api',
  apiKey: process.env.DMS_API_KEY,
  apiSecret: process.env.DMS_API_SECRET,
  timeout: parseInt(process.env.DMS_TIMEOUT || '30000', 10),
  retryAttempts: parseInt(process.env.DMS_RETRY_ATTEMPTS || '3', 10),
  retryDelay: parseInt(process.env.DMS_RETRY_DELAY || '1000', 10),
  syncInterval: parseInt(process.env.DMS_SYNC_INTERVAL || '3600000', 10),
  batchSize: parseInt(process.env.DMS_BATCH_SIZE || '100', 10),
});
