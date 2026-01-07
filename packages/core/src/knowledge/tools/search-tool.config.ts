/**
 * Search Tool Configuration
 * 
 * Konfiguration für das RAG Search Tool
 */

import { z } from 'zod';

/**
 * Search Tool Config Schema
 */
export const SearchToolConfigSchema = z.object({
  enabled: z.boolean().default(true),
  defaultTopK: z.number().int().min(1).max(20).default(5),
  maxTopK: z.number().int().min(1).max(50).default(20),
  minScore: z.number().min(0).max(1).default(0.7),
  knowledgeSpaceId: z.string().uuid().optional(),
  filters: z
    .object({
      domain: z.string().optional(),
      language: z.string().optional(),
      dateRange: z
        .object({
          from: z.string().optional(),
          to: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  rerank: z.boolean().default(false),
  rerankModel: z.string().optional(),
});

export type SearchToolConfig = z.infer<typeof SearchToolConfigSchema>;

/**
 * Default Search Tool Config
 */
export const defaultSearchToolConfig: SearchToolConfig = {
  enabled: true,
  defaultTopK: 5,
  maxTopK: 20,
  minScore: 0.7,
  rerank: false,
};

/**
 * Search Tool Config Builder
 */
export class SearchToolConfigBuilder {
  private config: Partial<SearchToolConfig> = {};

  enabled(enabled: boolean): this {
    this.config.enabled = enabled;
    return this;
  }

  topK(topK: number): this {
    this.config.defaultTopK = topK;
    return this;
  }

  maxTopK(maxTopK: number): this {
    this.config.maxTopK = maxTopK;
    return this;
  }

  minScore(minScore: number): this {
    this.config.minScore = minScore;
    return this;
  }

  knowledgeSpace(knowledgeSpaceId: string): this {
    this.config.knowledgeSpaceId = knowledgeSpaceId;
    return this;
  }

  filters(filters: SearchToolConfig['filters']): this {
    this.config.filters = filters;
    return this;
  }

  rerank(enabled: boolean, model?: string): this {
    this.config.rerank = enabled;
    if (model) {
      this.config.rerankModel = model;
    }
    return this;
  }

  build(): SearchToolConfig {
    return SearchToolConfigSchema.parse({
      ...defaultSearchToolConfig,
      ...this.config,
    });
  }
}

/**
 * Search Tool Config Factory
 */
export function createSearchToolConfig(
  overrides?: Partial<SearchToolConfig>,
): SearchToolConfig {
  return SearchToolConfigSchema.parse({
    ...defaultSearchToolConfig,
    ...overrides,
  });
}










