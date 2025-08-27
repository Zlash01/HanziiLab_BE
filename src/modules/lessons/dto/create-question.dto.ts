import { IsEnum, IsNotEmpty, IsNumber, IsObject } from 'class-validator';
import { QuestionType } from '../enums/question-type.enum';

export class CreateQuestionDto {
  @IsNumber()
  @IsNotEmpty()
  lessonId: number;

  @IsNumber()
  @IsNotEmpty()
  orderIndex: number;

  @IsEnum(QuestionType)
  @IsNotEmpty()
  questionType: QuestionType;

  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;
}