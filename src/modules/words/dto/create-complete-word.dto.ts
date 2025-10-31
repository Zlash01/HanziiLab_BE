import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsOptional,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WordDataDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  simplified: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  traditional?: string;
}

export class SenseDataDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  pinyin: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  partOfSpeech?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9)
  hskLevel?: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = false;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  audioUrl?: string;
}

export class TranslationDataDto {
  @IsOptional()
  @IsString()
  @MaxLength(5)
  language?: string = 'vn';

  @IsNotEmpty()
  @IsString()
  translation: string;

  @IsOptional()
  @IsString()
  additionalDetail?: string;
}

export class CreateCompleteWordDto {
  // If wordId is provided, only create sense+translation
  // If wordId is not provided, create word+sense+translation
  @IsOptional()
  @IsInt()
  @Min(1)
  wordId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => WordDataDto)
  word?: WordDataDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SenseDataDto)
  sense: SenseDataDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TranslationDataDto)
  translation: TranslationDataDto;
}
