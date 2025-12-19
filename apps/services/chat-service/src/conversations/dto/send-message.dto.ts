import { IsString, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SearchToolConfigDto {
  @IsString()
  @IsOptional()
  strategy?: string; // 'two_stage' | 'single_stage'

  @IsOptional()
  top_k?: number;
}

export class SendConversationMessageDto {
  @IsString()
  thread_id: string;

  @IsString()
  message: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchToolConfigDto)
  search_tool_config?: SearchToolConfigDto;
}

