import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { TokenType } from '../enums/token-type.enum';

export class CreateSentenceTokenDto {
  @IsInt()
  sentenceId: number;

  @IsInt()
  position: number;

  @IsString()
  @IsNotEmpty()
  chineseText: string;

  @IsEnum(TokenType)
  tokenType: TokenType;

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
