import { PartialType } from '@nestjs/mapped-types';
import { CreateWidgetConfigDto } from './create-widget-config.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateWidgetConfigDto extends PartialType(CreateWidgetConfigDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
