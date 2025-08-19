import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { SentenceType } from '../enums/sentence-type.enum';

export class CreateSentenceDto {
  @IsString()
  @IsNotEmpty()
  chineseText: string;

  @IsString()
  @IsNotEmpty()
  pinyin: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  audioUrl?: string;

  @IsEnum(SentenceType)
  sentenceType: SentenceType;

  @IsInt()
  @Min(1)
  @Max(5)
  difficultyLevel: number;
}
