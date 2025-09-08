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
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @ApiOperation({ summary: 'Create new lesson content' })
  @ApiResponse({ status: 201, description: 'Content created successfully' })
  @ApiBody({ type: CreateContentDto })
  @Post()
  create(@Body() createContentDto: CreateContentDto) {
    return this.contentService.create(createContentDto);
  }

  @ApiOperation({ summary: 'Get all lesson content' })
  @ApiResponse({ status: 200, description: 'Content retrieved successfully' })
  @Get()
  findAll() {
    return this.contentService.findAll();
  }

  @ApiOperation({ summary: 'Get content by lesson ID' })
  @ApiResponse({ status: 200, description: 'Content retrieved successfully' })
  @ApiParam({ name: 'lessonId', type: 'number', description: 'Lesson ID' })
  @Get('lesson/:lessonId')
  findByLessonId(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.contentService.findByLessonId(lessonId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contentService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContentDto: UpdateContentDto,
  ) {
    return this.contentService.update(id, updateContentDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contentService.remove(id);
  }

  @Delete(':id/hard')
  hardDelete(@Param('id', ParseIntPipe) id: number) {
    return this.contentService.hardDelete(id);
  }
}