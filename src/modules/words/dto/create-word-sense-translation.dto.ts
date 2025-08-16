import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateWordSenseTranslationDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  wordSenseId: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(5)
  language: string;

  @IsNotEmpty()
  @IsString()
  translation: string;

  @IsOptional()
  @IsString()
  usageNotes?: string;
}
