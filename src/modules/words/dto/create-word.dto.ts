import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateWordDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  simplified: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  traditional?: string;
}
