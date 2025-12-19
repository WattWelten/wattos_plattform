import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateKnowledgeSpaceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @IsOptional()
  @IsString()
  tenantId?: string; // Wird normalerweise aus Request-Header extrahiert
}














