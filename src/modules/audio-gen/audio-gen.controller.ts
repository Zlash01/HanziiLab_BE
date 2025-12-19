import { Controller, Post, Body, Get, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import { AudioGenService } from './audio-gen.service';
import { GenerateAudioDto, VoiceType } from './dto/generate-audio.dto';

@ApiTags('Audio Generation')
@Controller('audio-gen')
export class AudioGenController {
  constructor(private readonly audioGenService: AudioGenService) {}

  @Post('tts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate speech from Chinese text' })
  @ApiProduces('audio/wav')
  @ApiResponse({
    status: 200,
    description: 'Audio file generated successfully',
  })
  @ApiResponse({
    status: 503,
    description: 'TTS service unavailable',
  })
  async generateAudio(
    @Body() dto: GenerateAudioDto,
    @Res() res: Response,
  ): Promise<void> {
    const audioBuffer = await this.audioGenService.generateAudio(dto);

    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': audioBuffer.length,
      'Content-Disposition': `attachment; filename="tts_${dto.voice}_${Date.now()}.wav"`,
    });

    res.send(audioBuffer);
  }

  @Get('health')
  @ApiOperation({ summary: 'Check TTS service health' })
  @ApiResponse({
    status: 200,
    description: 'TTS service is healthy',
  })
  async checkHealth() {
    return this.audioGenService.checkHealth();
  }

  @Get('voices')
  @ApiOperation({ summary: 'Get available voice options' })
  @ApiResponse({
    status: 200,
    description: 'List of available voices',
  })
  getVoices() {
    return {
      voices: Object.values(VoiceType),
      description: {
        male: 'Adult male voice',
        female: 'Adult female voice',
        child: 'Child voice',
        uncle: 'Older male voice',
      },
    };
  }
}
