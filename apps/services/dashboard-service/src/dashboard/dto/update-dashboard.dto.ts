import { IsString, IsObject, IsOptional, IsBoolean } from 'class-validator';

export class UpdateDashboardDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  layout?: any;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

