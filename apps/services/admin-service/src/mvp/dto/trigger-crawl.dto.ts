import { IsString, IsUrl, IsOptional } from 'class-validator';
import { z } from 'zod';

// Zod Schema für Validierung
export const triggerCrawlSchema = z.object({
  url: z.string().url('Invalid URL format'),
  schedule: z.string().optional(),
});

export type TriggerCrawlInput = z.infer<typeof triggerCrawlSchema>;

// Class-Validator DTO (für NestJS)
export class TriggerCrawlDto {
  @IsUrl()
  url!: string;

  @IsString()
  @IsOptional()
  schedule?: string;
}
