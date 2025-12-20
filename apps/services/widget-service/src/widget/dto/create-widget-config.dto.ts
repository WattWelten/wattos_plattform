import { IsString, IsObject, IsOptional, IsBoolean, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum WidgetType {
  CHAT = 'chat',
  VOICE = 'voice',
  MULTIMODAL = 'multimodal',
}

export enum WidgetMode {
  IFRAME = 'iframe',
  EMBED = 'embed',
}

export class WidgetSizeDto {
  @IsOptional()
  width?: number;

  @IsOptional()
  height?: number;
}

export class CreateWidgetConfigDto {
  @IsString()
  name: string;

  @IsEnum(WidgetType)
  type: WidgetType;

  @IsOptional()
  @IsEnum(WidgetMode)
  mode?: WidgetMode;

  @IsOptional()
  @IsString()
  characterId?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WidgetSizeDto)
  size?: WidgetSizeDto;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  abTestVariant?: string;

  @IsOptional()
  @IsBoolean()
  analyticsEnabled?: boolean;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}
