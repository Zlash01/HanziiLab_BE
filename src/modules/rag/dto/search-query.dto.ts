import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { SourceType } from '../entities/embedding.entity';

export class SearchQueryDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsArray()
  @IsEnum(SourceType, { each: true })
  sourceTypes?: SourceType[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => parseFloat(value))
  minSimilarity?: number = 0.5;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(6)
  @Transform(({ value }) => parseInt(value))
  hskLevel?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeMetadata?: boolean = true;
}

export class FindSimilarDto {
  @IsEnum(SourceType)
  sourceType: SourceType;

  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  sourceId: number;

  @IsOptional()
  @IsArray()
  @IsEnum(SourceType, { each: true })
  sourceTypes?: SourceType[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => parseFloat(value))
  minSimilarity?: number = 0.5;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(6)
  @Transform(({ value }) => parseInt(value))
  hskLevel?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeMetadata?: boolean = true;
}