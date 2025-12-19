import * as Joi from 'joi';

export const validationSchema = Joi.object({
  LLM_GATEWAY_PORT: Joi.number().default(3015),
  LLM_DEFAULT_PROVIDER: Joi.string().valid('openai', 'azure', 'anthropic', 'google', 'ollama'),
  OPENAI_API_KEY: Joi.string().optional(),
  OPENAI_BASE_URL: Joi.string().uri().optional(),
  AZURE_OPENAI_API_KEY: Joi.string().optional(),
  AZURE_OPENAI_ENDPOINT: Joi.string().uri().optional(),
  AZURE_OPENAI_DEPLOYMENT_NAME: Joi.string().optional(),
  AZURE_OPENAI_API_VERSION: Joi.string().optional(),
  ANTHROPIC_API_KEY: Joi.string().optional(),
  ANTHROPIC_BASE_URL: Joi.string().uri().optional(),
  GOOGLE_API_KEY: Joi.string().optional(),
  GOOGLE_BASE_URL: Joi.string().uri().optional(),
  OLLAMA_BASE_URL: Joi.string().uri().optional(),
  OLLAMA_MODEL: Joi.string().optional(),
  LLM_COST_TRACKING_ENABLED: Joi.string().valid('true', 'false').optional(),
  LLM_COST_ALERT_THRESHOLD: Joi.number().min(0).max(1).optional(),
});
