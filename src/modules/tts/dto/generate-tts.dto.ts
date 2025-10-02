import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class GenerateTtsDto {
  @ApiProperty({
    description: 'Chinese text to convert to speech',
    example: '你好，欢迎学习中文',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    description: 'Voice audio file path or URL for voice cloning (optional)',
    example: 'examples/voice_01.wav',
  })
  @IsOptional()
  @IsString()
  voicePrompt?: string;

  @ApiPropertyOptional({
    description: 'Emotion description for the speech (optional)',
    example: 'happy and energetic',
  })
  @IsOptional()
  @IsString()
  emotionPrompt?: string;

  @ApiPropertyOptional({
    description: 'Speech speed multiplier (0.5 to 2.0)',
    example: 1.0,
    minimum: 0.5,
    maximum: 2.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(2.0)
  speed?: number;
}
