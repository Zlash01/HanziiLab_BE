import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  MaxLength,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGrammarPatternDataDto {
  @ApiProperty({ example: ['帮忙', '&', '帮'] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  pattern?: string[];

  @ApiProperty({ example: ['bāngmáng', '&', 'bāng'] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  patternPinyin?: string[];

  @ApiProperty({ example: 'A + 帮 + B' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  patternFormula?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  hskLevel?: number;
}

export class UpdateGrammarTranslationDataDto {
  @IsOptional()
  @IsString()
  @MaxLength(5)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  grammarPoint?: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsArray()
  example?: Array<{
    chinese: string[];
    pinyin: string[];
    translation: string;
  }>;
}

export class UpdateCompleteGrammarPatternDto {
  @ApiProperty({ description: 'Pattern data to update (optional)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateGrammarPatternDataDto)
  pattern?: UpdateGrammarPatternDataDto;

  @ApiProperty({ description: 'Translation data to update (optional)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateGrammarTranslationDataDto)
  translation?: UpdateGrammarTranslationDataDto;
}
