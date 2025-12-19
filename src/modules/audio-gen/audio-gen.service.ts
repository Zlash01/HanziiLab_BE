import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { GenerateAudioDto } from './dto/generate-audio.dto';
import axios from 'axios';

@Injectable()
export class AudioGenService {
  private readonly logger = new Logger(AudioGenService.name);
  private readonly TTS_SERVICE_URL =
    process.env.TTS_SERVICE_URL || 'http://localhost:7860';

  async generateAudio(dto: GenerateAudioDto): Promise<Buffer> {
    this.logger.log(`Generating audio for: "${dto.text}" with voice: ${dto.voice}`);
    this.logger.log(`TTS Service URL: ${this.TTS_SERVICE_URL}/tts`);

    try {
      const response = await axios.post(
        `${this.TTS_SERVICE_URL}/tts`,
        {
          text: dto.text,
          voice: dto.voice,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
          timeout: 600000, // 10 minute timeout for audio generation
        },
      );

      this.logger.log(`Audio generated successfully, size: ${response.data.length} bytes`);
      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(`TTS generation failed: ${error.message}`);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new HttpException(
            `TTS service error: ${error.response.statusText}`,
            error.response.status,
          );
        }
        throw new HttpException(
          `Failed to connect to TTS service: ${error.message}`,
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      throw new HttpException(
        `TTS generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async checkHealth(): Promise<{ status: string; service: string }> {
    try {
      const response = await axios.get(`${this.TTS_SERVICE_URL}/`);
      return response.data;
    } catch (error) {
      this.logger.error(`TTS health check failed: ${error.message}`);
      throw new HttpException(
        'TTS service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}

