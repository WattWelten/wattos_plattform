import { z } from 'zod';

/**
 * F13 Configuration Schema
 */
export const F13ConfigSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string().optional(),
  timeout: z.number().default(30000), // 30 Sekunden
  retryAttempts: z.number().min(0).max(5).default(3),
  retryDelay: z.number().min(100).default(1000), // 1 Sekunde
});

export type F13Config = z.infer<typeof F13ConfigSchema>;

/**
 * Default F13 Configuration
 */
export const getDefaultF13Config = (): Partial<F13Config> => ({
  baseUrl: process.env.F13_BASE_URL || 'https://f13.example.com/api', // TODO: Echte F13 URL
  apiKey: process.env.F13_API_KEY,
  timeout: parseInt(process.env.F13_TIMEOUT || '30000', 10),
  retryAttempts: parseInt(process.env.F13_RETRY_ATTEMPTS || '3', 10),
  retryDelay: parseInt(process.env.F13_RETRY_DELAY || '1000', 10),
});

