import { IsOptional, IsEnum, IsInt, Min, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SentenceType } from '../enums/sentence-type.enum';

export class GetSentencesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(SentenceType)
  sentenceType?: SentenceType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  difficultyLevel?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  hasAudio?: boolean;
}
