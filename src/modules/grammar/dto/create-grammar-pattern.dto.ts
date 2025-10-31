import {
  IsString,
  IsInt,
  IsOptional,
  Length,
  Min,
  Max,
  IsArray,
  ArrayMinSize,
} from 'class-validator';

export class CreateGrammarPatternDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  pattern: string[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  patternPinyin?: string[];

  @IsOptional()
  @IsString()
  @Length(1, 200)
  patternFormula?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  hskLevel?: number;
}
