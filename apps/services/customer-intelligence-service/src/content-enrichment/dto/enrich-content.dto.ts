import { IsString, IsOptional, IsNumber } from 'class-validator';

export class EnrichContentDto {
  @IsString()
  targetGroupId: string;

  @IsString()
  sourceType: string; // "crawler" | "document" | "conversation" | "external"

  @IsString()
  sourceId: string;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsNumber()
  @IsOptional()
  relevanceScore?: number;
}














