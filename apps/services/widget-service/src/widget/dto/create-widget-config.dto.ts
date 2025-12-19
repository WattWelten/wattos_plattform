import { IsString, IsObject, IsOptional, IsBoolean } from 'class-validator';

export class CreateWidgetConfigDto {
  @IsString()
  position: string;

  @IsObject()
  size: { width: number; height: number };

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

