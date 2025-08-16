import { IsString, IsInt, IsOptional, Length } from 'class-validator';

export class CreateGrammarTranslationDto {
  @IsInt()
  grammarPatternId: number;

  @IsString()
  @Length(2, 5)
  language: string;

  @IsString()
  @Length(1, 200)
  title: string;

  @IsString()
  explanation: string;

  @IsOptional()
  @IsString()
  whenToUse?: string;

  @IsOptional()
  @IsString()
  commonMistakes?: string;
}
