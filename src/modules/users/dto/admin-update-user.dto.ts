import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { Role } from '../../auth/enums/role.enum';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  currentHskLevel?: number;

  @IsOptional()
  @IsString()
  nativeLanguage?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
