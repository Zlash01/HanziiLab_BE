import {
  Controller,
  Get,
  Post,
  Put,
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
import { WordSenseTranslationsService } from './word-sense-translations.service';
import { CreateWordSenseTranslationDto } from './dto/create-word-sense-translation.dto';
import { UpdateWordSenseTranslationDto } from './dto/update-word-sense-translation.dto';
import { GetWordSenseTranslationsQueryDto } from './dto/get-word-sense-translations-query.dto';
import { JWTGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('word-sense-translations')
@UseGuards(JWTGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class WordSenseTranslationsController {
  constructor(
    private readonly wordSenseTranslationsService: WordSenseTranslationsService,
  ) {}

  // POST /word-sense-translations - Create a new word sense translation (Admin only)
  @Post()
  @Roles(Role.Admin)
  async createWordSenseTranslation(
    @Body() createWordSenseTranslationDto: CreateWordSenseTranslationDto,
  ) {
    return this.wordSenseTranslationsService.create(
      createWordSenseTranslationDto,
    );
  }

  // GET /word-sense-translations/stats - Get translation statistics (Admin only)
  @Get('stats')
  @Roles(Role.Admin)
  async getTranslationStats() {
    return this.wordSenseTranslationsService.getTranslationStats();
  }

  // GET /word-sense-translations/by-word-sense/:wordSenseId - Get translations by word sense ID (Both user and admin)
  @Get('by-word-sense/:wordSenseId')
  @Roles(Role.User, Role.Admin)
  async getTranslationsByWordSenseId(
    @Param('wordSenseId', ParseIntPipe) wordSenseId: number,
  ) {
    return this.wordSenseTranslationsService.findByWordSenseId(wordSenseId);
  }

  // GET /word-sense-translations/by-language/:language - Get translations by language (Both user and admin)
  @Get('by-language/:language')
  @Roles(Role.User, Role.Admin)
  async getTranslationsByLanguage(@Param('language') language: string) {
    return this.wordSenseTranslationsService.findByLanguage(language);
  }

  // GET /word-sense-translations - Get all translations with filtering and pagination (Both user and admin)
  @Get()
  @Roles(Role.User, Role.Admin)
  async getWordSenseTranslations(
    @Query() query: GetWordSenseTranslationsQueryDto,
  ) {
    return this.wordSenseTranslationsService.findAll(query);
  }

  // GET /word-sense-translations/:id - Get translation by ID (Both user and admin)
  @Get(':id')
  @Roles(Role.User, Role.Admin)
  async getWordSenseTranslationById(@Param('id', ParseIntPipe) id: number) {
    return this.wordSenseTranslationsService.findById(id);
  }

  // PUT /word-sense-translations/:id - Update translation (Admin only)
  @Put(':id')
  @Roles(Role.Admin)
  async updateWordSenseTranslation(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWordSenseTranslationDto: UpdateWordSenseTranslationDto,
  ) {
    return this.wordSenseTranslationsService.update(
      id,
      updateWordSenseTranslationDto,
    );
  }

  // DELETE /word-sense-translations/:id - Delete translation (Admin only)
  @Delete(':id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteWordSenseTranslation(@Param('id', ParseIntPipe) id: number) {
    await this.wordSenseTranslationsService.remove(id);
  }
}
