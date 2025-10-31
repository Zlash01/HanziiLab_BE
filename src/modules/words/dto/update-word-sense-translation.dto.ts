import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateWordSenseTranslationDto {
  @IsOptional()
  @IsString()
  @MaxLength(5)
  language?: string;

  @IsOptional()
  @IsString()
  translation?: string;

  @IsOptional()
  @IsString()
  additionalDetail?: string;
}
