import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ChatMessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

export class ChatMessageDto {
  @IsEnum(ChatMessageRole)
  role!: ChatMessageRole;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsString()
  name?: string;
}
