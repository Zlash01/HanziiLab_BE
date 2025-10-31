import {
  IsNotEmpty,
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

export class GrammarPatternDataDto {
  @ApiProperty({
    example: ['帮忙', '&', '帮'],
    description: 'Chinese characters pattern as array for word-by-word mapping',
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  pattern: string[];

  @ApiProperty({
    example: ['bāngmáng', '&', 'bāng'],
    description: 'Pinyin pattern as array for word-by-word mapping',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  patternPinyin?: string[];

  @ApiProperty({
    example: 'A + 帮 + B',
    description: 'Pattern formula structure (string notation)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  patternFormula?: string;

  @ApiProperty({ example: 3, description: 'HSK level (1-6)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  hskLevel?: number;
}

export class GrammarTranslationDataDto {
  @ApiProperty({ example: 'vn', description: 'Language code', default: 'vn' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  language?: string = 'vn';

  @ApiProperty({
    example: 'động từ ly hợp',
    description: 'Grammar point/category',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  grammarPoint: string;

  @ApiProperty({
    example:
      '"帮忙(bāngmáng)" và "帮(bāng)" có ý nghĩa giống nhau, nhưng đằng sau "帮忙(bāngmáng)" không thể trực tiếp mang tân ngữ...',
    description: 'Detailed explanation in target language',
  })
  @IsNotEmpty()
  @IsString()
  explanation: string;

  @ApiProperty({
    example: [
      {
        chinese: ['他', '帮忙', '做', '了', '这', '件', '事。'],
        pinyin: ['Tā', 'bāngmáng', 'zuò', 'le', 'zhè', 'jiàn', 'shì'],
        translation: 'Anh ấy đã giúp tôi làm việc này.',
      },
      {
        chinese: ['他', '帮', '我', '做', '了', '这', '件', '事。'],
        pinyin: ['Tā', 'bāng', 'wǒ', 'zuò', 'le', 'zhè', 'jiàn', 'shì'],
        translation: 'Anh ấy đã giúp tôi làm việc này.',
      },
    ],
    description: 'Example sentences with word-by-word mapping',
    required: false,
  })
  @IsOptional()
  @IsArray()
  example?: Array<{
    chinese: string[];
    pinyin: string[];
    translation: string;
  }>;
}

export class CreateCompleteGrammarPatternDto {
  @ApiProperty({
    description:
      'If provided, adds translation to existing pattern. If not, creates new pattern.',
    required: false,
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  patternId?: number;

  @ApiProperty({
    description: 'Pattern data (required if patternId not provided)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GrammarPatternDataDto)
  pattern?: GrammarPatternDataDto;

  @ApiProperty({ description: 'Translation data (always required)' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => GrammarTranslationDataDto)
  translation: GrammarTranslationDataDto;
}
