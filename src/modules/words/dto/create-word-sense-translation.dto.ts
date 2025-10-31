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

  @IsOptional()
  @IsString()
  @MaxLength(5)
  language?: string = 'vn';

  @IsNotEmpty()
  @IsString()
  translation: string;

  @IsOptional()
  @IsString()
  additionalDetail?: string;
}
