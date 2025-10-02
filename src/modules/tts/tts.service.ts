import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GenerateTtsDto } from './dto/generate-tts.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private readonly ttsServiceUrl: string;
  private readonly defaultVoice: string;
  private readonly outputDir: string;

  constructor(private configService: ConfigService) {
    this.ttsServiceUrl = this.configService.get<string>('TTS_SERVICE_URL') || 'http://127.0.0.1:7860';
    this.defaultVoice = this.configService.get<string>('TTS_DEFAULT_VOICE') || 'examples/voice_01.wav';
    this.outputDir = this.configService.get<string>('TTS_OUTPUT_DIR') || './uploads/tts';

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      this.logger.log(`Created TTS output directory: ${this.outputDir}`);
    }
  }

  /**
   * Generate TTS audio from Chinese text
   * @param generateTtsDto - TTS generation parameters
   * @returns Object containing audio file path and metadata
   */
  async generateSpeech(generateTtsDto: GenerateTtsDto): Promise<{
    audioUrl: string;
    filename: string;
    text: string;
    duration?: number;
  }> {
    try {
      const { text, voicePrompt, emotionPrompt, speed } = generateTtsDto;

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `tts_${timestamp}.wav`;
      const outputPath = path.join(this.outputDir, filename);

      this.logger.log(`Generating TTS for text: "${text}"`);

      // Prepare request payload for index-tts API
      const payload = {
        text,
        spk_audio_prompt: voicePrompt || this.defaultVoice,
        emotion_prompt: emotionPrompt || '',
        speed: speed || 1.0,
        output_path: outputPath,
      };

      // Call the Python TTS service
      const response = await axios.post(`${this.ttsServiceUrl}/api/tts/generate`, payload, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200 && response.data.success) {
        this.logger.log(`TTS audio generated successfully: ${filename}`);

        return {
          audioUrl: `/uploads/tts/${filename}`,
          filename,
          text,
          duration: response.data.duration,
        };
      } else {
        throw new HttpException(
          'TTS generation failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      this.logger.error(`TTS generation error: ${error.message}`, error.stack);

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new HttpException(
            'TTS service is not available. Please ensure the index-tts service is running.',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
        if (error.response) {
          throw new HttpException(
            error.response.data?.message || 'TTS service error',
            error.response.status,
          );
        }
      }

      throw new HttpException(
        'Failed to generate TTS audio',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check if TTS service is healthy and available
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    try {
      const response = await axios.get(`${this.ttsServiceUrl}/health`, {
        timeout: 5000,
      });

      if (response.status === 200) {
        return {
          status: 'healthy',
          service: this.ttsServiceUrl,
        };
      }

      return {
        status: 'unhealthy',
        service: this.ttsServiceUrl,
      };
    } catch (error) {
      this.logger.warn(`TTS service health check failed: ${error.message}`);
      return {
        status: 'unavailable',
        service: this.ttsServiceUrl,
      };
    }
  }

  /**
   * Delete generated TTS audio file
   * @param filename - Name of the file to delete
   */
  async deleteAudioFile(filename: string): Promise<void> {
    const filePath = path.join(this.outputDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      this.logger.log(`Deleted TTS audio file: ${filename}`);
    } else {
      throw new HttpException('Audio file not found', HttpStatus.NOT_FOUND);
    }
  }
}
