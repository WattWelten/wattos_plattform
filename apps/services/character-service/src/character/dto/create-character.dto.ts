import { IsString, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class KnowledgeBaseDto {
  @IsOptional()
  @IsObject()
  [key: string]: any;
}

export class CreateCharacterDto {
  @IsString()
  role: string;

  @IsString()
  @IsOptional()
  agent?: string;

  @IsString()
  @IsOptional()
  voice_id?: string;

  @IsString()
  @IsOptional()
  voice_model?: string;

  @IsString()
  @IsOptional()
  system_prompt?: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => KnowledgeBaseDto)
  custom_parameters?: Record<string, any>;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => KnowledgeBaseDto)
  knowledge_base?: Record<string, any>;
}

