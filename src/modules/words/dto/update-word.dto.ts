import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class UpdateWordDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  simplified?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  traditional?: string;

  @IsOptional()
  @IsBoolean()
  isCompound?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  characterCount?: number;
}
