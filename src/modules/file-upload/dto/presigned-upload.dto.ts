import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FileUploadRequestDto {
  @ApiProperty({ description: 'Original filename' })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({ description: 'File content type (MIME type)' })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiProperty({ description: 'S3 folder to upload to', required: false, default: 'uploads' })
  @IsString()
  @IsOptional()
  folder?: string;
}

export class MultipleFileUploadRequestDto {
  @ApiProperty({ type: [FileUploadRequestDto], description: 'Array of files to upload' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileUploadRequestDto)
  files: FileUploadRequestDto[];
}

export class PresignedUploadResponseDto {
  @ApiProperty({ description: 'Presigned URL for uploading the file' })
  uploadUrl: string;

  @ApiProperty({ description: 'Public URL of the file after upload' })
  fileUrl: string;

  @ApiProperty({ description: 'S3 key of the uploaded file' })
  key: string;

  @ApiProperty({ description: 'Original filename', required: false })
  filename?: string;
}