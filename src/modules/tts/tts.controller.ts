import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { TtsService } from './tts.service';
import { GenerateTtsDto } from './dto/generate-tts.dto';
import { JWTGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('tts')
@ApiBearerAuth()
@Controller('tts')
@UseGuards(JWTGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class TtsController {
  constructor(private readonly ttsService: TtsService) {}

  @ApiOperation({
    summary: 'Generate TTS audio from Chinese text (Admin only)',
    description:
      'Converts Chinese text to speech using index-tts service. Returns audio file URL.',
  })
  @ApiResponse({
    status: 201,
    description: 'TTS audio generated successfully',
    schema: {
      type: 'object',
      properties: {
        audioUrl: {
          type: 'string',
          example: '/uploads/tts/tts_1234567890.wav',
        },
        filename: {
          type: 'string',
          example: 'tts_1234567890.wav',
        },
        text: {
          type: 'string',
          example: '你好，欢迎学习中文',
        },
        duration: {
          type: 'number',
          example: 3.5,
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: 503,
    description: 'Service Unavailable - TTS service not running',
  })
  @ApiBody({ type: GenerateTtsDto })
  @Post('generate')
  @Roles(Role.Admin)
  async generateSpeech(@Body() generateTtsDto: GenerateTtsDto) {
    return this.ttsService.generateSpeech(generateTtsDto);
  }

  @ApiOperation({
    summary: 'Check TTS service health (Admin only)',
    description: 'Verifies that the index-tts service is available and running.',
  })
  @ApiResponse({
    status: 200,
    description: 'TTS service health status',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'healthy',
          enum: ['healthy', 'unhealthy', 'unavailable'],
        },
        service: {
          type: 'string',
          example: 'http://127.0.0.1:7860',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @Get('health')
  @Roles(Role.Admin)
  async healthCheck() {
    return this.ttsService.healthCheck();
  }

  @ApiOperation({
    summary: 'Delete generated TTS audio file (Admin only)',
    description: 'Removes a previously generated TTS audio file from the server.',
  })
  @ApiResponse({
    status: 200,
    description: 'Audio file deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Audio file not found',
  })
  @ApiParam({
    name: 'filename',
    type: 'string',
    description: 'Name of the audio file to delete',
    example: 'tts_1234567890.wav',
  })
  @Delete(':filename')
  @Roles(Role.Admin)
  async deleteAudioFile(@Param('filename') filename: string) {
    await this.ttsService.deleteAudioFile(filename);
    return {
      message: 'Audio file deleted successfully',
      filename,
    };
  }
}
