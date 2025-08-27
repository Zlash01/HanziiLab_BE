import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLessonWordDto } from './lesson-word.dto';
import { CreateLessonGrammarPatternDto } from './lesson-grammar-pattern.dto';

export class CreateLessonDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  orderIndex: number;

  @IsNotEmpty()
  @IsInt()
  courseId: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonWordDto)
  words?: CreateLessonWordDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonGrammarPatternDto)
  grammarPatterns?: CreateLessonGrammarPatternDto[];
}
