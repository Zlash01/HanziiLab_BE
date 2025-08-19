import { IsOptional, IsString } from 'class-validator';

export class UpdateSentenceTranslationDto {
  @IsOptional()
  @IsString()
  translation?: string;

  @IsOptional()
  @IsString()
  literalTranslation?: string;
}
