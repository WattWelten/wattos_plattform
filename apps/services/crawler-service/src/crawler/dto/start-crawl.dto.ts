import { IsString, IsUrl, IsOptional, IsNumber, IsArray } from 'class-validator';

export class StartCrawlDto {
  @IsUrl()
  url: string;

  @IsString()
  tenantId: string;

  @IsNumber()
  @IsOptional()
  maxDepth?: number;

  @IsNumber()
  @IsOptional()
  maxPages?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedDomains?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  excludePaths?: string[];

  @IsOptional()
  metadata?: Record<string, any>;
}














