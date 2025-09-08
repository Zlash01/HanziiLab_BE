import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional } from 'class-validator';
import { ContentType } from '../enums/content-type.enum';
import { QuestionType } from '../enums/question-type.enum';

export enum LessonItemType {
  CONTENT = 'content',
  QUESTION = 'question',
}

export class CreateLessonItemDto {
  @IsNumber()
  @IsNotEmpty()
  lessonId: number;

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