import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum VoiceType {
  MALE = 'male',
  FEMALE = 'female',
  CHILD = 'child',
  UNCLE = 'uncle',
}

export class GenerateAudioDto {
  @ApiProperty({
    description: 'Chinese text to convert to speech',
    example: '你好世界',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'Voice type to use for speech generation',
    enum: VoiceType,
    example: 'female',
  })
  @IsEnum(VoiceType)
  voice: VoiceType;
}
