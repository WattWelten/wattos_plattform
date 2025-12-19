import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateSummaryDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(2000)
  maxLength?: number;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  provider?: string;
}


