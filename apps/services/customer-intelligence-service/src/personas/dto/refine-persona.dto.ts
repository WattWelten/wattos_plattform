import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';

export class RefinePersonaDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  characteristics?: Record<string, any>;

  @IsArray()
  @IsOptional()
  painPoints?: string[];

  @IsArray()
  @IsOptional()
  goals?: string[];

  @IsObject()
  @IsOptional()
  communicationStyle?: Record<string, any>;
}














