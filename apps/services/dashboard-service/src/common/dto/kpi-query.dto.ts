/**
 * DTOs für KPI-Endpoints
 * 
 * Input-Validierung für KPI-Query-Parameter
 * 
 * Note: Swagger Decorators sind optional - wenn @nestjs/swagger nicht installiert ist,
 * werden sie ignoriert. class-validator wird für Runtime-Validierung verwendet.
 */

import { IsEnum, IsOptional, IsString } from 'class-validator';

// Swagger Decorators (optional - nur wenn @nestjs/swagger installiert ist)
let ApiProperty: any;
let ApiPropertyOptional: any;
try {
  const swagger = require('@nestjs/swagger');
  ApiProperty = swagger.ApiProperty;
  ApiPropertyOptional = swagger.ApiPropertyOptional;
} catch {
  // @nestjs/swagger nicht installiert - Decorators werden ignoriert
  ApiProperty = () => () => {};
  ApiPropertyOptional = () => () => {};
}

export enum KpiRange {
  TODAY = 'today',
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
}

export class GetKpisDto {
  @ApiProperty({
    description: 'Time range for KPI calculation',
    enum: KpiRange,
    default: KpiRange.SEVEN_DAYS,
  })
  @IsOptional()
  @IsEnum(KpiRange, {
    message: 'Range must be one of: today, 7d, 30d',
  })
  range?: KpiRange;
}

export class GetKpiMetricsDto {
  @ApiPropertyOptional({
    description: 'Time range for KPI metrics',
    enum: KpiRange,
    default: KpiRange.SEVEN_DAYS,
  })
  @IsOptional()
  @IsEnum(KpiRange, {
    message: 'Range must be one of: today, 7d, 30d',
  })
  range?: KpiRange;
}
