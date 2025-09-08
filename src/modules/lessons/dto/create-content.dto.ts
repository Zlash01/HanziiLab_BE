import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional } from 'class-validator';
import { ContentType } from '../enums/content-type.enum';

export class CreateContentDto {
  @IsNumber()
  @IsNotEmpty()
  lessonId: number;

  @IsNumber()
  @IsOptional()
  orderIndex?: number;

  @IsEnum(ContentType)
  @IsNotEmpty()
  type: ContentType;

  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;
}