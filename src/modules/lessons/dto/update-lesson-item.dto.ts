import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional } from 'class-validator';
import { ContentType } from '../enums/content-type.enum';
import { QuestionType } from '../enums/question-type.enum';
import { LessonItemType } from './create-lesson-item.dto';

export class UpdateLessonItemDto {
  @IsNumber()
  @IsOptional()
  lessonId?: number;

  @IsNumber()
  @IsOptional()
  orderIndex?: number;

  @IsEnum(LessonItemType)
  @IsNotEmpty()
  itemType: LessonItemType;

  @IsEnum(ContentType)
  @IsOptional()
  contentType?: ContentType;

  @IsEnum(QuestionType)
  @IsOptional()
  questionType?: QuestionType;

  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;
}
