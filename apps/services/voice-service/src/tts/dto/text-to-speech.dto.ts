import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum VoiceProvider {
  OPENAI = 'openai',
  ELEVENLABS = 'elevenlabs',
  AZURE = 'azure',
}

export class TextToSpeechDto {
  @IsString()
  text: string;

  @IsEnum(VoiceProvider)
  @IsOptional()
  provider?: VoiceProvider;

  @IsString()
  @IsOptional()
  voice?: string; // alloy, echo, fable, onyx, nova, shimmer (OpenAI) oder ElevenLabs voice ID

  @IsString()
  @IsOptional()
  language?: string; // de, en, etc.

  @IsOptional()
  streaming?: boolean; // Für schnelle Gespräche
}














