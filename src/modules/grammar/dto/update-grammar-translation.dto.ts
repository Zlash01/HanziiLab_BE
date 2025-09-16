import { IsString, IsOptional, Length } from 'class-validator';

export class UpdateGrammarTranslationDto {
  @IsOptional()
  @IsString()
  @Length(2, 5)
  language?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  example?: any;
}
