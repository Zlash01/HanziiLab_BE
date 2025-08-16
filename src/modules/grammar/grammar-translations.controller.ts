import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { GrammarTranslationsService } from './grammar-translations.service';
import { CreateGrammarTranslationDto } from './dto/create-grammar-translation.dto';
import { UpdateGrammarTranslationDto } from './dto/update-grammar-translation.dto';
import { GetGrammarTranslationsQueryDto } from './dto/get-grammar-translations-query.dto';
import { JWTGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('grammar-translations')
@UseGuards(JWTGuard, RolesGuard)
export class GrammarTranslationsController {
  constructor(
    private readonly grammarTranslationsService: GrammarTranslationsService,
  ) {}

  @Post()
  @Roles(Role.Admin)
  create(@Body() createGrammarTranslationDto: CreateGrammarTranslationDto) {
    return this.grammarTranslationsService.create(createGrammarTranslationDto);
  }

  @Get()
  @Roles(Role.Admin, Role.User)
  findAll(@Query() query: GetGrammarTranslationsQueryDto) {
    return this.grammarTranslationsService.findAll(query);
  }

  @Get('stats')
  @Roles(Role.Admin)
  getStatistics() {
    return this.grammarTranslationsService.getStatistics();
  }

  @Get('by-grammar-pattern/:grammarPatternId')
  @Roles(Role.Admin, Role.User)
  findByGrammarPatternId(
    @Param('grammarPatternId', ParseIntPipe) grammarPatternId: number,
  ) {
    return this.grammarTranslationsService.findByGrammarPatternId(
      grammarPatternId,
    );
  }

  @Get('by-language/:language')
  @Roles(Role.Admin, Role.User)
  findByLanguage(@Param('language') language: string) {
    return this.grammarTranslationsService.findByLanguage(language);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.User)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.grammarTranslationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGrammarTranslationDto: UpdateGrammarTranslationDto,
  ) {
    return this.grammarTranslationsService.update(
      id,
      updateGrammarTranslationDto,
    );
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.grammarTranslationsService.remove(id);
  }
}
