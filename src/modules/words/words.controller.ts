import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WordsService } from './words.service';
import { WordSensesService } from './word-senses.service';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { GetWordsQueryDto } from './dto/get-words-query.dto';
import { CreateCompleteWordDto } from './dto/create-complete-word.dto';
import { UpdateCompleteWordDto } from './dto/update-complete-word.dto';
import { JWTGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('words')
@ApiBearerAuth()
@Controller('words')
@UseGuards(JWTGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class WordsController {
  constructor(
    private readonly wordsService: WordsService,
    private readonly wordSensesService: WordSensesService,
  ) {}

  @ApiOperation({
    summary: 'Search for word by simplified form (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Word search result returned successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  // GET /words/search?simplified=你好 - Search for word (Admin only)
  @Get('search')
  @Roles(Role.Admin)
  async searchWord(@Query('simplified') simplified: string) {
    return this.wordsService.search(simplified);
  }

  @ApiOperation({
    summary: 'Create complete word with sense and translation (Admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Complete word created successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiBody({ type: CreateCompleteWordDto })
  // POST /words - Create a complete word (Admin only)
  @Post()
  @Roles(Role.Admin)
  async createCompleteWord(@Body() createCompleteWordDto: CreateCompleteWordDto) {
    return this.wordsService.createComplete(createCompleteWordDto);
  }

  @ApiOperation({ summary: 'Get word statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Word statistics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  // GET /words/stats - Get word statistics (Admin only)
  @Get('stats')
  @Roles(Role.Admin)
  async getWordStats() {
    return this.wordsService.getWordStats();
  }

  // GET /words/simplified/:simplified - Get word by simplified form (Both user and admin)
  @Get('simplified/:simplified')
  @Roles(Role.User, Role.Admin)
  async getWordBySimplified(@Param('simplified') simplified: string) {
    return this.wordsService.findBySimplified(simplified);
  }

  @ApiOperation({ summary: 'Get all words with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Words retrieved successfully' })
  @ApiQuery({ type: GetWordsQueryDto })
  // GET /words - Get all words with filtering and pagination (Both user and admin)
  @Get()
  @Roles(Role.User, Role.Admin)
  async getWords(@Query() query: GetWordsQueryDto) {
    return this.wordsService.findAll(query);
  }

  // GET /words/:id - Get word by ID (Both user and admin)
  @Get(':id')
  @Roles(Role.User, Role.Admin)
  async getWordById(@Param('id', ParseIntPipe) id: number) {
    return this.wordsService.findById(id);
  }

  // PUT /words/:id - Update word (Admin only)
  @Put(':id')
  @Roles(Role.Admin)
  async updateWord(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWordDto: UpdateWordDto,
  ) {
    return this.wordsService.update(id, updateWordDto);
  }

  // DELETE /words/:id - Delete word (Admin only)
  @Delete(':id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteWord(@Param('id', ParseIntPipe) id: number) {
    await this.wordsService.remove(id);
  }

  @ApiOperation({
    summary: 'Update complete word by sense ID (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Complete word updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Word sense not found' })
  @ApiBody({ type: UpdateCompleteWordDto })
  // PATCH /words/senses/:senseId - Update complete word by sense ID (Admin only)
  @Patch('senses/:senseId')
  @Roles(Role.Admin)
  async updateCompleteWord(
    @Param('senseId', ParseIntPipe) senseId: number,
    @Body() updateCompleteWordDto: UpdateCompleteWordDto,
  ) {
    return this.wordsService.updateCompleteBySenseId(
      senseId,
      updateCompleteWordDto,
    );
  }

  @ApiOperation({ summary: 'Delete word sense by ID (Admin only)' })
  @ApiResponse({
    status: 204,
    description: 'Word sense deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Word sense not found' })
  // DELETE /words/senses/:senseId - Delete word sense (Admin only)
  @Delete('senses/:senseId')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteWordSense(@Param('senseId', ParseIntPipe) senseId: number) {
    await this.wordSensesService.remove(senseId);
  }
}
