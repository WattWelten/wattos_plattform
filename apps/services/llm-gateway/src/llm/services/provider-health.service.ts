import { Injectable } from '@nestjs/common';
import { ProviderFactory } from './provider-factory';

@Injectable()
export class ProviderHealthService {
  constructor(private readonly providerFactory: ProviderFactory) {}

  async collectStatuses(providers: string[]) {
    const results = await Promise.all(
      providers.map(async (name) => {
        try {
          const provider = this.providerFactory.getProvider(name);
          const healthy = await provider.healthCheck();
          return { name, healthy };
        } catch {
          return { name, healthy: false };
        }
      }),
    );
    return results;
  }
}


