import { IsArray, IsString, IsOptional, IsBoolean } from 'class-validator';

export class GenerateAgentsDto {
  @IsArray()
  @IsString({ each: true })
  personaIds: string[];

  @IsOptional()
  @IsBoolean()
  validate?: boolean;
}


