import {
  Controller,
  Post,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileUploadService } from './file-upload.service';
import { JWTGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import {
  FileUploadRequestDto,
  MultipleFileUploadRequestDto,
  PresignedUploadResponseDto,
} from './dto/presigned-upload.dto';

@ApiTags('file-upload')
@Controller('file-upload')
@UseGuards(JWTGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @ApiOperation({
    summary: 'Get presigned URL for single file upload',
    description: 'Admin only. Returns a presigned URL for uploading a single file to S3.',
  })
  @ApiResponse({
    status: 201,
    description: 'Presigned URL generated successfully',
    type: PresignedUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiBody({ type: FileUploadRequestDto })
  @Post('presigned-url')
  @Roles(Role.Admin)
  async getPresignedUrl(
    @Body() fileUploadRequest: FileUploadRequestDto,
  ): Promise<PresignedUploadResponseDto> {
    const { filename, contentType, folder = 'uploads' } = fileUploadRequest;

    // Validate file type
    if (!this.fileUploadService.validateFileType(contentType)) {
      throw new BadRequestException(
        `Unsupported file type: ${contentType}. Allowed types: images (jpeg, png, gif, webp), audio (mp3, wav, ogg, m4a), video (mp4, webm)`,
      );
    }

    return this.fileUploadService.getPresignedUploadUrl(filename, contentType, folder);
  }

  @ApiOperation({
    summary: 'Get presigned URLs for multiple file uploads',
    description: 'Admin only. Returns presigned URLs for uploading multiple files to S3.',
  })
  @ApiResponse({
    status: 201,
    description: 'Presigned URLs generated successfully',
    type: [PresignedUploadResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Invalid file types or parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiBody({ type: MultipleFileUploadRequestDto })
  @Post('presigned-urls')
  @Roles(Role.Admin)
  async getPresignedUrls(
    @Body() multipleFileUploadRequest: MultipleFileUploadRequestDto,
  ): Promise<PresignedUploadResponseDto[]> {
    const { files } = multipleFileUploadRequest;

    // Validate all file types first
    for (const file of files) {
      if (!this.fileUploadService.validateFileType(file.contentType)) {
        throw new BadRequestException(
          `Unsupported file type: ${file.contentType} for file: ${file.filename}`,
        );
      }
    }

    const results = await this.fileUploadService.getPresignedUploadUrls(files);

    return results.map(result => ({
      uploadUrl: result.uploadUrl,
      fileUrl: result.fileUrl,
      key: result.key,
      filename: result.filename,
    }));
  }
}