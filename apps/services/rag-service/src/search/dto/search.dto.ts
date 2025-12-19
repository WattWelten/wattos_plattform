import { IsString, IsOptional, IsNumber, IsObject, Min, Max } from 'class-validator';

export class SearchDto {
  @IsString()
  knowledgeSpaceId: string;

  @IsString()
  query: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  topK?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minScore?: number;

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;
}


