import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { TokenType } from '../enums/token-type.enum';

export class UpdateSentenceTokenDto {
  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsString()
  chineseText?: string;

  @IsOptional()
  @IsEnum(TokenType)
  tokenType?: TokenType;

  @IsOptional()
  @IsInt()
  referenceId?: number;

  @IsOptional()
  @IsBoolean()
  isClickable?: boolean;

  @IsOptional()
  @IsString()
  highlightColor?: string;
}
