import { IsString, IsNumber, IsOptional, Min, Max, IsEnum } from 'class-validator';

export enum FeedbackType {
  CHAT = 'chat',
  AGENT = 'agent',
  FEATURE = 'feature',
  GENERAL = 'general',
  RATING = 'rating',
  COMMENT = 'comment',
  IMPROVEMENT = 'improvement',
}

export class CreateFeedbackDto {
  @IsEnum(FeedbackType)
  type: FeedbackType;

  @IsString()
  resourceId: string; // chatId, agentId, etc.

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  tenantId?: string;
}

