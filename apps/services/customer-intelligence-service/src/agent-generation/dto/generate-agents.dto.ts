import { IsString, IsOptional, IsArray } from 'class-validator';

export class GenerateAgentsDto {
  @IsString()
  analysisId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  personaIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetGroupIds?: string[];
}














