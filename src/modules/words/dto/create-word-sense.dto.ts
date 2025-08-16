import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreateWordSenseDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  wordId: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  senseNumber: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  pinyin: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  partOfSpeech?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9)
  hskLevel?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  usageContext?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = false;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  exampleContext?: string;
}
