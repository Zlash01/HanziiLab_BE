import { IsEnum, IsNotEmpty, IsNumber, IsObject } from 'class-validator';
import { ContentType } from '../enums/content-type.enum';

export class CreateContentDto {
  @IsNumber()
  @IsNotEmpty()
  lessonId: number;

  @IsNumber()
  @IsNotEmpty()
  orderIndex: number;

  @IsEnum(ContentType)
  @IsNotEmpty()
  type: ContentType;

  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;
}