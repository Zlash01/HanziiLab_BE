import {
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateLessonGrammarPatternDto {
  @IsInt()
  @Min(1)
  grammarPatternId: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}

export class UpdateLessonGrammarPatternDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}