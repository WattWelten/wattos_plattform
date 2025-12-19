import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum SttProvider {
  OPENAI = 'openai',
  WHISPER = 'whisper',
  AZURE = 'azure',
}

export class SpeechToTextDto {
  @IsString()
  audioData: string; // Base64-encoded audio

  @IsEnum(SttProvider)
  @IsOptional()
  provider?: SttProvider;

  @IsString()
  @IsOptional()
  language?: string; // de, en, etc.

  @IsOptional()
  prompt?: string; // Optional: Kontext für bessere Erkennung
}














