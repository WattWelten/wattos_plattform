import { IsString, IsObject, IsOptional, IsBoolean } from 'class-validator';

export class UpdateWidgetConfigDto {
  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsObject()
  size?: { width: number; height: number };

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

