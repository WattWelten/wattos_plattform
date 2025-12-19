import { IsString, IsObject, IsOptional, IsBoolean } from 'class-validator';

export class CreateDashboardDto {
  @IsString()
  name: string;

  @IsObject()
  layout: any;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

