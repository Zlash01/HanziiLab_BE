import { IsString, IsInt, IsOptional, Length, Min, Max } from 'class-validator';

export class UpdateGrammarPatternDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  pattern?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  patternPinyin?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  patternFormula?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  hskLevel?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficultyLevel?: number;
}
