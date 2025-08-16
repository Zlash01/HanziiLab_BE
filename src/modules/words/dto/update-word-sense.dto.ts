import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class UpdateWordSenseDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  senseNumber?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  pinyin?: string;

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
  isPrimary?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  exampleContext?: string;
}
