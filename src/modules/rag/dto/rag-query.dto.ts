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
  context?: 'general' | 'word' | 'grammar' | 'lesson';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  @Transform(({ value }) => parseInt(value))
  maxSources?: number = 5;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => parseFloat(value))
  minSimilarity?: number = 0.6;
}