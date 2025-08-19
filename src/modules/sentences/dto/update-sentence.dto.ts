import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsUrl,
} from 'class-validator';
import { SentenceType } from '../enums/sentence-type.enum';

export class UpdateSentenceDto {
  @IsOptional()
  @IsString()
  chineseText?: string;

  @IsOptional()
  @IsString()
  pinyin?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  audioUrl?: string;

  @IsOptional()
  @IsEnum(SentenceType)
  sentenceType?: SentenceType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficultyLevel?: number;
}
