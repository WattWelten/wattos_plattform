import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class GeneratePersonasDto {
  @IsString()
  characterId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxPersonas?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minQualityScore?: number;
}


