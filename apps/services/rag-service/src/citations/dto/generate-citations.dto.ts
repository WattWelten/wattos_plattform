import { IsArray, IsOptional, IsObject } from 'class-validator';

export class GenerateCitationsDto {
  @IsArray()
  chunkIds: string[];

  @IsOptional()
  @IsObject()
  scores?: Record<string, number>;
}


