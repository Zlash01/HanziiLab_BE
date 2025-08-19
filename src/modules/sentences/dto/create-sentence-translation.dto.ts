import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

export class CreateSentenceTranslationDto {
  @IsInt()
  sentenceId: number;

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsNotEmpty()
  translation: string;

  @IsOptional()
  @IsString()
  literalTranslation?: string;
}
