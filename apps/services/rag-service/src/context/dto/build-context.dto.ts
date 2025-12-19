import { IsArray, IsOptional, IsNumber, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SearchResultItem } from '../../search/interfaces/search.interface';

export class BuildContextDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  searchResults: SearchResultItem[];

  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @IsOptional()
  @IsBoolean()
  includeMetadata?: boolean;
}


