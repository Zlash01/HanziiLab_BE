import { IsOptional, IsString, IsInt, Min, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLessonWordDto } from './lesson-word.dto';
import { CreateLessonGrammarPatternDto } from './lesson-grammar-pattern.dto';

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  orderIndex?: number;

  @IsOptional()
  @IsInt()
  courseId?: number;

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
