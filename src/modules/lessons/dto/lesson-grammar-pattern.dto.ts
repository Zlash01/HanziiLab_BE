import {
  IsInt,
  IsBoolean,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateLessonGrammarPatternDto {
  @IsInt()
  @Min(1)
  grammarPatternId: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = false;

  @IsInt()
  @Min(0)
  orderIndex: number;
}

export class UpdateLessonGrammarPatternDto {
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}