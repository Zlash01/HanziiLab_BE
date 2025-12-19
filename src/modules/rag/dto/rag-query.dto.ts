import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { SourceType } from '../entities/embedding.entity';

export class RagQueryDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  userId?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(6)
  @Transform(({ value }) => parseInt(value))
  hskLevel?: number;

  @IsOptional()
  @IsEnum(['general', 'word', 'grammar', 'lesson'])
  type?: 'general' | 'word' | 'grammar' | 'lesson';

  @IsOptional()
  context?: string | Record<string, any>;  // String or JSON of current question/content
}