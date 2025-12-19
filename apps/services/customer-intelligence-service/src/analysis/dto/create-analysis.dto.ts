import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

export enum CustomerType {
  KOMMUNE = 'kommune',
  UNTERNEHMEN = 'unternehmen',
  ORGANISATION = 'organisation',
}

export enum AnalysisType {
  INITIAL = 'initial',
  PERIODIC = 'periodic',
  ON_DEMAND = 'on-demand',
}

export class CreateAnalysisDto {
  @IsEnum(CustomerType)
  customerType: CustomerType;

  @IsEnum(AnalysisType)
  @IsOptional()
  analysisType?: AnalysisType;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  dataSources?: string[]; // ['crawler', 'documents', 'conversations']

  @IsOptional()
  metadata?: Record<string, any>;
}














