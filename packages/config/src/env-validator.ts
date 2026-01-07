/**
 * Environment Variables Validator
 * Type-safe Environment Variable Access mit Validierung
 */

import { z } from 'zod';

// Schema für Environment Variables
const envSchema = z.object({
  // Allgemeine Konfiguration
  NODE_ENV: z.enum(['development', 'production', 'staging', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().min(1).max(65535)).optional(),

  // Database
  DATABASE_URL: z.string().regex(/^postgresql:\/\//, 'Must be a PostgreSQL connection string'),

  // Redis
  REDIS_URL: z.string().regex(/^redis:\/\//, 'Must be a Redis connection string').default('redis://localhost:6379'),

  // API Gateway
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  ENABLE_SWAGGER: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional(),
  
  // OIDC/Keycloak
  OIDC_AUTHORIZATION_URL: z.string().url().optional(),
  OIDC_TOKEN_URL: z.string().url().optional(),
  OIDC_CLIENT_ID: z.string().optional(),
  OIDC_CLIENT_SECRET: z.string().optional(),
  OIDC_CALLBACK_URL: z.string().url().optional(),
  
  // Cache
  CACHE_ENABLED: z
    .string()
    .transform((val) => val !== 'false')
    .pipe(z.boolean())
    .default(true),
  CACHE_DEFAULT_TTL: z.string().transform(Number).pipe(z.number().int().min(1)).default(3600),
  CACHE_MAX_SIZE: z.string().transform(Number).pipe(z.number().int().min(1)).default(1000),

  // LLM Providers
  OPENAI_API_KEY: z.string().regex(/^sk-/, 'Must be a valid OpenAI API key').optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  AZURE_OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_ENDPOINT: z.string().url().optional(),
  GOOGLE_API_KEY: z.string().optional(),

  // Service URLs
  LLM_GATEWAY_URL: z.string().url().optional(),
  RAG_SERVICE_URL: z.string().url().optional(),
  CHAT_SERVICE_URL: z.string().url().optional(),
  AGENT_SERVICE_URL: z.string().url().optional(),
  TOOL_SERVICE_URL: z.string().url().optional(),
  ADMIN_SERVICE_URL: z.string().url().optional(),
  CHARACTER_SERVICE_URL: z.string().url().optional(),
  CUSTOMER_INTELLIGENCE_SERVICE_URL: z.string().url().optional(),
  CRAWLER_SERVICE_URL: z.string().url().optional(),
  VOICE_SERVICE_URL: z.string().url().optional(),
  AVATAR_SERVICE_URL: z.string().url().optional(),
  INGESTION_SERVICE_URL: z.string().url().default('http://localhost:3008'),

  // Voice Service
  ELEVENLABS_API_KEY: z.string().regex(/^sk_/, 'Must be a valid ElevenLabs API key').optional(),
  ELEVENLABS_VOICE_ID: z.string().optional(),
  TTS_PROVIDER: z.enum(['openai', 'elevenlabs', 'azure']).default('openai'),
  STT_PROVIDER: z.enum(['openai', 'whisper', 'azure']).default('openai'),

  // Vector Store
  VECTOR_STORE_TYPE: z.enum(['pgvector', 'opensearch']).default('pgvector'),
  OPENSEARCH_URL: z.string().url().optional(),

  // Feature Flags
  STREAMING_ENABLED: z
    .string()
    .transform((val) => val !== 'false')
    .pipe(z.boolean())
    .default(true),
  WEBSOCKET_ENABLED: z
    .string()
    .transform((val) => val !== 'false')
    .pipe(z.boolean())
    .default(true),
  SANDBOX_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .default(false),

  // Performance & Observability
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  SERVICE_NAME: z.string().default('wattos-service'),
  METRICS_ENABLED: z
    .string()
    .transform((val) => val !== 'false')
    .pipe(z.boolean())
    .default(true),
  METRICS_MAX_HISTOGRAM_SIZE: z.string().transform(Number).pipe(z.number().int().min(100)).default(1000),
  
  // OpenTelemetry (optional)
  OTEL_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .default(false),
  OTEL_EXPORTER_TYPE: z.enum(['console', 'jaeger', 'zipkin', 'otlp']).default('console'),
  OTEL_EXPORTER_JAEGER_ENDPOINT: z.string().url().optional(),
  OTEL_EXPORTER_ZIPKIN_ENDPOINT: z.string().url().optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),

  // Production Settings
  EXPORT_OPENAPI_SPEC: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .default(false),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

/**
 * Validiert und gibt Environment Variables zurück
 * @throws {z.ZodError} Wenn Validierung fehlschlägt
 */
export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join('\n');
      throw new Error(`Environment variable validation failed:\n${errors}`);
    }
    throw error;
  }
}

/**
 * Gibt validierte Environment Variables zurück
 * Validiert beim ersten Aufruf, cached danach
 */
export function getEnv(): Env {
  return validateEnv();
}

/**
 * Gibt eine spezifische Environment Variable zurück
 */
export function getEnvVar<K extends keyof Env>(key: K): Env[K] {
  const env = getEnv();
  return env[key];
}

/**
 * Prüft ob eine Environment Variable gesetzt ist
 */
export function hasEnvVar(key: keyof Env): boolean {
  try {
    const env = getEnv();
    return env[key] !== undefined;
  } catch {
    return false;
  }
}












