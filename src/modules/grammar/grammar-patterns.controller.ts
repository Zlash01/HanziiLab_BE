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
import { GrammarPatternsService } from './grammar-patterns.service';
import { CreateGrammarPatternDto } from './dto/create-grammar-pattern.dto';
import { UpdateGrammarPatternDto } from './dto/update-grammar-pattern.dto';
import { GetGrammarPatternsQueryDto } from './dto/get-grammar-patterns-query.dto';
import { JWTGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('grammar-patterns')
@ApiBearerAuth('JWT-auth')
@Controller('grammar-patterns')
@UseGuards(JWTGuard, RolesGuard)
export class GrammarPatternsController {
  constructor(
    private readonly grammarPatternsService: GrammarPatternsService,
  ) {}

  @ApiOperation({ summary: 'Create a new grammar pattern (Admin only)' })
  @ApiResponse({ status: 201, description: 'Grammar pattern created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiBody({ type: CreateGrammarPatternDto })
  @Post()
  @Roles(Role.Admin)
  create(@Body() createGrammarPatternDto: CreateGrammarPatternDto) {
    return this.grammarPatternsService.create(createGrammarPatternDto);
  }

  @ApiOperation({ summary: 'Get all grammar patterns with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Grammar patterns retrieved successfully' })
  @ApiQuery({ type: GetGrammarPatternsQueryDto })
  @Get()
  @Roles(Role.Admin, Role.User)
  findAll(@Query() query: GetGrammarPatternsQueryDto) {
    return this.grammarPatternsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get grammar pattern statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @Get('stats')
  @Roles(Role.Admin)
  getStatistics() {
    return this.grammarPatternsService.getStatistics();
  }

  @Get('pattern/:pattern')
  @Roles(Role.Admin, Role.User)
  findByPattern(@Param('pattern') pattern: string) {
    return this.grammarPatternsService.findByPattern(pattern);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.User)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.grammarPatternsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGrammarPatternDto: UpdateGrammarPatternDto,
  ) {
    return this.grammarPatternsService.update(id, updateGrammarPatternDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.grammarPatternsService.remove(id);
  }
}
