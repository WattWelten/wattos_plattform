import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAiProvider } from '../providers/openai.provider';
import { AzureOpenAiProvider } from '../providers/azure-openai.provider';
import { AnthropicProvider } from '../providers/anthropic.provider';
import { GoogleProvider } from '../providers/google.provider';
import { OllamaProvider } from '../providers/ollama.provider';
import { LlmProvider } from '../interfaces/llm-provider.interface';

@Injectable()
export class ProviderFactory {
  private readonly logger = new Logger(ProviderFactory.name);
  private cache = new Map<string, LlmProvider>();

  constructor(private readonly configService: ConfigService) {}

  getProvider(providerName: string): LlmProvider {
    const key = providerName.toLowerCase();
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const provider = this.createProvider(key);
    this.cache.set(key, provider);
    return provider;
  }

  private createProvider(name: string): LlmProvider {
    const providersConfig = this.configService.get('providers');
    switch (name) {
      case 'openai':
        return new OpenAiProvider(providersConfig.openai);
      case 'azure':
        return new AzureOpenAiProvider(providersConfig.azure);
      case 'anthropic':
        return new AnthropicProvider(providersConfig.anthropic);
      case 'google':
        return new GoogleProvider(providersConfig.google);
      case 'ollama':
        return new OllamaProvider(providersConfig.ollama);
      default:
        const message = `Unknown provider: ${name}`;
        this.logger.error(message);
        throw new Error(message);
    }
  }
}
