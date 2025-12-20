"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationSchema = void 0;
const Joi = __importStar(require("joi"));
exports.validationSchema = Joi.object({
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
//# sourceMappingURL=validation.js.map