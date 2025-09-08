import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEmail,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User display name',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Current HSK level (1-6)',
    example: 2,
    minimum: 1,
    maximum: 6,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  currentHskLevel?: number;

  @ApiPropertyOptional({
    description: 'Native language of the user',
    example: 'English',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  nativeLanguage?: string;
}
