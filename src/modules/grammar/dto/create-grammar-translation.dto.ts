import { IsString, IsInt, IsOptional, Length } from 'class-validator';

export class CreateGrammarTranslationDto {
  @IsInt()
  grammarPatternId: number;

  @IsString()
  @Length(2, 5)
  language: string;

  @IsString()
  @Length(1, 200)
  grammarPoint: string;

  @IsString()
  explanation: string;

  @IsOptional()
  example?: any;
}
