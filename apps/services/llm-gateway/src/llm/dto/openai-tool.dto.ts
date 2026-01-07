import { IsString, IsObject, ValidateNested, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class ToolFunctionDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsObject()
  parameters!: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

class OpenAIToolDto {
  @IsString()
  type!: string;

  @ValidateNested()
  @Type(() => ToolFunctionDto)
  function!: ToolFunctionDto;
}

export { OpenAIToolDto, ToolFunctionDto };




