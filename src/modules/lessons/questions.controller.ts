import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @ApiOperation({ summary: 'Create new lesson question' })
  @ApiResponse({ status: 201, description: 'Question created successfully' })
  @ApiBody({ type: CreateQuestionDto })
  @Post()
  create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  @ApiOperation({ summary: 'Get all lesson questions' })
  @ApiResponse({ status: 200, description: 'Questions retrieved successfully' })
  @Get()
  findAll() {
    return this.questionsService.findAll();
  }

  @ApiOperation({ summary: 'Get questions by lesson ID' })
  @ApiResponse({ status: 200, description: 'Questions retrieved successfully' })
  @ApiParam({ name: 'lessonId', type: 'number', description: 'Lesson ID' })
  @Get('lesson/:lessonId')
  findByLessonId(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.questionsService.findByLessonId(lessonId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.remove(id);
  }

  @Delete(':id/hard')
  hardDelete(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.hardDelete(id);
  }
}