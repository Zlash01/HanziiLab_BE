import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEmail,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  currentHskLevel?: number;

  @IsOptional()
  @IsString()
  nativeLanguage?: string;
}
