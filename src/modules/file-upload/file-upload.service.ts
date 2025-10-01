import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class FileUploadService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');

    if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error('AWS configuration is missing. Please check AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME in your .env file');
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      // Disable automatic checksums to simplify frontend uploads
      requestChecksumCalculation: 'WHEN_REQUIRED',
    });
    this.bucketName = bucketName;
  }

  async getPresignedUploadUrl(
    filename: string,
    contentType: string,
    folder: string = 'uploads',
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const key = `${folder}/${timestamp}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      // ACL removed - bucket should use bucket policy for public access instead
      ChecksumAlgorithm: undefined, // Explicitly disable checksum
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600, // 1 hour
      unhoistableHeaders: new Set(['x-amz-checksum-crc32']), // Prevent checksum headers in URL
    });

    const fileUrl = `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/${key}`;

    return {
      uploadUrl,
      fileUrl,
      key,
    };
  }

  async getPresignedUploadUrls(
    files: Array<{ filename: string; contentType: string; folder?: string }>,
  ): Promise<Array<{ uploadUrl: string; fileUrl: string; key: string; filename: string }>> {
    const results = await Promise.all(
      files.map(async ({ filename, contentType, folder = 'uploads' }) => {
        const result = await this.getPresignedUploadUrl(filename, contentType, folder);
        return {
          ...result,
          filename,
        };
      }),
    );

    return results;
  }

  validateFileType(contentType: string): boolean {
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      // Audio
      'audio/mpeg', // mp3
      'audio/wav',
      'audio/ogg',
      'audio/mp4', // m4a
      // Video (if needed)
      'video/mp4',
      'video/webm',
    ];

    return allowedTypes.includes(contentType);
  }
}