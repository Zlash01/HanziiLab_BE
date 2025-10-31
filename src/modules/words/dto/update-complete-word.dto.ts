import {
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

export class UpdateWordDataDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  simplified?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  traditional?: string;
}

export class UpdateSenseDataDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pinyin?: string;

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
  isPrimary?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  audioUrl?: string;
}

export class UpdateTranslationDataDto {
  @IsOptional()
  @IsString()
  @MaxLength(5)
  language?: string;

  @IsOptional()
  @IsString()
  translation?: string;

  @IsOptional()
  @IsString()
  additionalDetail?: string;
}

export class UpdateCompleteWordDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateWordDataDto)
  word?: UpdateWordDataDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSenseDataDto)
  sense?: UpdateSenseDataDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateTranslationDataDto)
  translation?: UpdateTranslationDataDto;
}
